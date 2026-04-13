import express from "express";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8787);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist");
const distIndexPath = path.join(distDir, "index.html");
const hasBuiltFrontend = fs.existsSync(distIndexPath);

app.use(express.json({ limit: "1mb" }));

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function asString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function firstStringFrom(value) {
  if (!Array.isArray(value)) {
    return "";
  }

  for (const item of value) {
    if (typeof item === "string" && item.trim()) {
      return item.trim();
    }
  }

  return "";
}

function safeJsonParse(input) {
  if (!input || typeof input !== "string") {
    return null;
  }

  try {
    return JSON.parse(input);
  } catch {
    const fencedMatch = input.match(/\{[\s\S]*\}/);
    if (!fencedMatch) {
      return null;
    }

    try {
      return JSON.parse(fencedMatch[0]);
    } catch {
      return null;
    }
  }
}

function readApiKeyFromEnv() {
  const groqKey = asString(process.env.GROQ_API_KEY);
  if (groqKey) {
    return groqKey;
  }

  return asString(process.env.GROK_API_KEY);
}

function resolveProvider(apiKey) {
  const configuredProvider = asString(process.env.AI_PROVIDER, "auto").toLowerCase();

  if (configuredProvider === "groq" || configuredProvider === "grok") {
    return "groq";
  }

  if (configuredProvider === "xai") {
    return "xai";
  }

  return apiKey.toLowerCase().startsWith("gsk_") ? "groq" : "xai";
}

function providerConfig(provider) {
  if (provider === "groq") {
    return {
      apiUrl: "https://api.groq.com/openai/v1/chat/completions",
      model: asString(process.env.AI_MODEL) || asString(process.env.GROQ_MODEL) || asString(process.env.GROK_MODEL) || "llama-3.1-8b-instant",
    };
  }

  return {
    apiUrl: "https://api.x.ai/v1/chat/completions",
    model: asString(process.env.AI_MODEL) || asString(process.env.GROK_MODEL) || "grok-3-mini",
  };
}

function buildFallbackResponse(payload) {
  const assetName = asString(payload?.asset?.name, "the selected asset");
  const anomalyLevel = asString(payload?.anomalyLevel, "unknown");
  const anomalyScore = Number(payload?.anomalyScore);
  const confidence = Number.isFinite(anomalyScore)
    ? clamp(Math.round((1 - anomalyScore) * 100), 25, 90)
    : 42;

  return {
    summary: `AI analysis is temporarily unavailable for ${assetName}.`,
    whyDetected: `Telemetry indicates anomaly level ${anomalyLevel}.`,
    likelyCause: "Possible transient telemetry drift or incomplete upstream model response.",
    confidence,
    recommendedAction: "Run a manual systems check and re-trigger diagnostics in 2-3 minutes.",
  };
}

function setSourceHeaders(res, provider, model) {
  if (provider) {
    res.setHeader("x-ai-provider", provider);
  }
  if (model) {
    res.setHeader("x-ai-model", model);
  }
  res.setHeader("x-ai-requested-at", new Date().toISOString());
}

function normalizeAiOutput(parsed, fallback) {
  const evidence = parsed?.evidence && typeof parsed.evidence === "object" ? parsed.evidence : null;
  const actions = parsed?.recommendedActions;
  const firstAction = Array.isArray(actions) && actions[0] && typeof actions[0] === "object"
    ? asString(actions[0].action)
    : "";

  const confidenceRaw = Number(parsed?.confidence);
  const normalizedConfidence = Number.isFinite(confidenceRaw)
    ? clamp(Math.round(confidenceRaw <= 1 ? confidenceRaw * 100 : confidenceRaw), 0, 100)
    : fallback.confidence;

  return {
    summary: asString(parsed?.summary) || asString(parsed?.primaryAnswer) || fallback.summary,
    whyDetected:
      asString(parsed?.whyDetected) ||
      asString(parsed?.why) ||
      firstStringFrom(parsed?.supportingPoints) ||
      firstStringFrom(evidence?.whatChanged) ||
      fallback.whyDetected,
    likelyCause:
      asString(parsed?.likelyCause) ||
      asString(parsed?.cause) ||
      firstStringFrom(evidence?.likelyCauses) ||
      fallback.likelyCause,
    confidence: normalizedConfidence,
    recommendedAction:
      asString(parsed?.recommendedAction) ||
      asString(parsed?.action) ||
      firstAction ||
      fallback.recommendedAction,
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "AstraSense unified web+api", hasBuiltFrontend });
});

app.post("/api/ai/diagnostics", async (req, res) => {
  const payload = req.body || {};
  const fallback = buildFallbackResponse(payload);
  const apiKey = readApiKeyFromEnv();

  if (!apiKey) {
    setSourceHeaders(res, "fallback", "no-api-key");
    return res.json(fallback);
  }

  const provider = resolveProvider(apiKey);
  const { apiUrl, model } = providerConfig(provider);

  const systemPrompt = [
    "You are AstraSense AI Copilot.",
    "Analyze telemetry and return strictly valid JSON with keys:",
    "summary, whyDetected, likelyCause, confidence, recommendedAction.",
    "confidence must be a number from 0 to 100.",
    "Keep wording concise, operational, and evidence-based.",
  ].join(" ");

  const userPrompt = {
    task: "Analyze diagnostics payload and return the required JSON schema only.",
    payload,
    requiredShape: {
      summary: "string",
      whyDetected: "string",
      likelyCause: "string",
      confidence: "number 0-100",
      recommendedAction: "string",
    },
  };

  try {
    setSourceHeaders(res, provider, model);

    const llmResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userPrompt) },
        ],
      }),
    });

    const bodyText = await llmResponse.text();
    const providerBody = safeJsonParse(bodyText);

    if (!llmResponse.ok || !providerBody) {
      setSourceHeaders(res, `${provider}-fallback`, model);
      return res.json(fallback);
    }

    const content = providerBody?.choices?.[0]?.message?.content;
    const parsedContent = safeJsonParse(content);

    if (!parsedContent) {
      setSourceHeaders(res, `${provider}-fallback`, model);
      return res.json(fallback);
    }

    setSourceHeaders(res, provider, model);
    return res.json(normalizeAiOutput(parsedContent, fallback));
  } catch {
    setSourceHeaders(res, `${provider}-fallback`, model);
    return res.json(fallback);
  }
});

// Ensure API paths never fall through to HTML.
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found" });
});

if (hasBuiltFrontend) {
  app.use(express.static(distDir));
}

app.get("*", (_req, res) => {
  if (!hasBuiltFrontend) {
    return res.status(503).send("Frontend build not found. Run npm run build.");
  }

  return res.sendFile(distIndexPath);
});

app.listen(port, () => {
  console.log(`[server] listening on port ${port}`);
});
