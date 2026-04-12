import express from "express";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || process.env.AI_PROXY_PORT || 8787);
const configuredProvider = (process.env.AI_PROVIDER || "auto").trim().toLowerCase();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist");
const distIndexPath = path.join(distDir, "index.html");
const hasBuiltFrontend = fs.existsSync(distIndexPath);

app.use(express.json({ limit: "1mb" }));

const supportedApiKeyEnvVars = ["GROQ_API_KEY", "GROK_API_KEY"];

function readApiKeyFromEnv() {
  for (const envVar of supportedApiKeyEnvVars) {
    const value = process.env[envVar];
    if (typeof value === "string" && value.trim()) {
      return { apiKey: value.trim(), envVar };
    }
  }

  return { apiKey: "", envVar: null };
}

function resolveProvider(apiKey) {
  if (configuredProvider === "xai" || configuredProvider === "grok") {
    return configuredProvider;
  }

  return apiKey.trim().toLowerCase().startsWith("gsk_") ? "grok" : "xai";
}

function getProviderConfig(provider) {
  if (provider === "grok") {
    return {
      apiUrl: "https://api.groq.com/openai/v1/chat/completions",
      defaultModel: "llama-3.1-8b-instant",
      label: "Groq",
    };
  }

  return {
    apiUrl: "https://api.x.ai/v1/chat/completions",
    defaultModel: "grok-3-mini",
    label: "xAI",
  };
}

function classifyResponseMode(operatorPrompt) {
  const prompt = typeof operatorPrompt === "string" ? operatorPrompt.trim().toLowerCase() : "";

  if (!prompt) {
    return "snapshot_report";
  }

  if (/(what changed|what has changed|change|difference|compare|comparison|drift)/.test(prompt)) {
    return "comparison";
  }

  if (/(is this serious|serious|severity|critical|risk level|can this still be deployed|deployable|can deploy)/.test(prompt)) {
    return "severity_focused";
  }

  if (/(what to do now|what should i do|what should we do|how do i fix|how to fix|check first|next step|immediate action|what now)/.test(prompt)) {
    return "action_focused";
  }

  if (prompt.endsWith("?") || /^(what|how|why|is|can|should|when|where)\b/.test(prompt)) {
    return "direct_answer";
  }

  return "direct_answer";
}

app.get("/api/health", (_req, res) => {
  const { apiKey, envVar } = readApiKeyFromEnv();
  const effectiveProvider = apiKey
    ? resolveProvider(apiKey)
    : (configuredProvider === "auto" ? null : configuredProvider);

  res.json({
    ok: true,
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    configuredProvider,
    effectiveProvider,
    hasApiKey: Boolean(apiKey),
    apiKeySource: envVar,
    hasBuiltFrontend,
  });
});

app.post("/api/ai/diagnostics", async (req, res) => {
  const { apiKey, envVar } = readApiKeyFromEnv();

  if (!apiKey) {
    return res.status(500).json({
      error: `API key is not configured. Add one of: ${supportedApiKeyEnvVars.join(", ")}`,
    });
  }

  if (!envVar) {
    return res.status(500).json({
      error: "Unable to resolve API key source from environment.",
    });
  }
  const provider = resolveProvider(apiKey);
  const providerConfig = getProviderConfig(provider);

  const {
    asset,
    telemetryAssessments,
    anomalyScore,
    anomalyLevel,
    timeline,
    recommendedActions,
    operatorPrompt,
  } = req.body || {};

  const responseMode = classifyResponseMode(operatorPrompt);

  if (!asset || !Array.isArray(telemetryAssessments)) {
    return res.status(400).json({
      error: "Invalid payload. Expected asset and telemetryAssessments.",
    });
  }

  const systemPrompt = [
    "You are AstraSense AI Copilot, an operator-facing vehicle intelligence assistant inside a premium fleet monitoring system.",
    "Interpret telemetry realistically, conservatively, and usefully.",
    "Stay grounded in provided asset details, readiness, anomaly score, baseline/current telemetry, drift values, safe thresholds, timeline context, and operator question.",
    "Answer the operator's direct question first when present.",
    "If no meaningful operator question is present, provide concise snapshot analysis.",
    "Do not invent facts. Do not assume unsupported causes. Do not exaggerate.",
    "Use cautious language for uncertainty: possible cause, likely contributor, may indicate, consistent with, not enough evidence to confirm.",
    "Severity, explanation, and recommendations must align with evidence.",
    "Prefer operational usefulness over filler. Keep responses professional, calm, concise, and evidence-based.",
    "Use severity logic consistently: nominal for harmless drift and low anomaly; watch for noticeable but non-urgent drift; warning for clear deviation needing inspection; critical for severe threshold breach or strong multi-signal mission risk.",
    "For weak evidence, keep causes broad and cautious. For stronger evidence, you may provide specific likely causes but avoid false certainty.",
    "Never jump to dramatic failures from minor drift.",
    "If evidence is limited or mixed, state that clearly. If condition is critical, be decisive.",
    "Use an adaptive response mode instead of forcing the same layout every time.",
    "If the operator asks a direct question, answer that question first in primaryAnswer before any supporting detail.",
    "Supporting evidence should be secondary and concise.",
    "Your goal is operational trustworthiness, not dramatic language.",
    "Return ONLY JSON that matches the requested schema exactly.",
  ].join(" ");

  const schemaHint = {
    mode: "direct_answer|snapshot_report|comparison|action_focused|severity_focused",
    primaryAnswer: "string",
    severity: "NOMINAL|WATCH|WARNING|CRITICAL",
    confidence: "number (0-100)",
    supportingPoints: ["string"],
    recommendedActions: [
      {
        tier: "Immediate|Next 15 Min|Follow-up",
        action: "string",
        reason: "string (optional)",
      },
    ],
    evidence: {
      whatChanged: ["string"],
      whyItMatters: ["string"],
      likelyCauses: ["string"],
    },
  };

  const userPrompt = {
    task: "Analyze the diagnostics snapshot and generate operator decision support using the requested adaptive response mode.",
    responseMode,
    operatorPrompt: typeof operatorPrompt === "string" ? operatorPrompt.slice(0, 1200) : "",
    outputSchema: schemaHint,
    data: {
      asset,
      anomalyScore,
      anomalyLevel,
      telemetryAssessments,
      timeline,
      recommendedActions,
    },
  };

  try {
    const requestTimestamp = new Date().toISOString();
    const resolvedModel =
      process.env.AI_MODEL ||
      process.env.GROQ_MODEL ||
      process.env.GROK_MODEL ||
      providerConfig.defaultModel;

    const response = await fetch(providerConfig.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: resolvedModel,
        temperature: 0.2,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userPrompt) },
        ],
      }),
    });

    const rawText = await response.text();
    let raw;

    try {
      raw = rawText ? JSON.parse(rawText) : {};
    } catch {
      return res.status(502).json({
        error: `${providerConfig.label} returned a non-JSON response body.`,
        details: rawText.slice(0, 1200),
      });
    }

    if (!response.ok) {
      const providerError =
        (typeof raw?.error === "string" && raw.error) ||
        (typeof raw?.message === "string" && raw.message) ||
        null;

      return res.status(response.status).json({
        error: providerError || `${providerConfig.label} API request failed.`,
        details: raw,
      });
    }

    const content = raw?.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(502).json({
        error: `No content returned by ${providerConfig.label} API.`,
        details: raw,
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(502).json({
        error: `${providerConfig.label} returned non-JSON content.`,
        content,
      });
    }

    return res.json({
      ok: true,
      analysis: parsed,
      source: {
        provider,
        model: resolvedModel,
        requestTimestamp,
        requestId: (typeof raw?.id === "string" && raw.id) || response.headers.get("x-request-id") || undefined,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected AI proxy error.",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

if (hasBuiltFrontend) {
  app.use(express.static(distDir));

  // SPA fallback for deep links like /vehicle/:id while preserving /api routes.
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    return res.sendFile(distIndexPath);
  });
}

app.listen(port, () => {
  console.log(`[server] listening on port ${port}`);
});
