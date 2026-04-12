# AstraSense Command

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy env template:

```bash
copy .env.example .env
```

Set these values in `.env`:

- `AI_PROVIDER=auto` (or explicitly `xai` / `grok`).
- `GROQ_API_KEY=...` or `GROK_API_KEY=...` from your provider account.
- `AI_MODEL=...` optional model override (provider-specific model id).
- `AI_PROXY_PORT=8787`.

Provider routing:
- `gsk_...` keys route to Groq (`api.groq.com`).
- non-`gsk_` keys route to xAI (`api.x.ai`).

Important: both are real online API calls and may require credits depending on your account tier.

3. Run app + AI proxy together:

```bash
npm run dev:full
```

- Frontend runs on `http://localhost:8080`
- AI proxy runs on `http://localhost:8787`

## AI Integration (Online)

The app includes a server-side AI proxy at `server/ai-proxy.mjs`.

- Frontend calls `/api/ai/diagnostics`
- Vite proxies `/api` to the local AI backend during development
- Grok API key stays server-side (never exposed in browser code)

On the Vehicle Detail page, use **Run AI Analysis** in the **AstraSense AI Copilot** panel to generate:

- What changed
- Why it matters
- Likely causes (hypothesis)
- Ranked next actions
- Confidence score

## Render Deployment (Single Service, Free)

This repo is configured to deploy as one Render web service:

- `npm run build` builds the Vite frontend to `dist`.
- `npm start` runs `server/ai-proxy.mjs`.
- The backend serves `/api/*` and also serves static files from `dist`.
- SPA fallback is enabled so deep links like `/vehicle/:id` work on refresh.

### Render settings

- Build command: `npm install; npm run build`
- Start command: `npm start`
- Health check path: `/api/health`

### Required Render environment variables

- `AI_PROVIDER=auto` (or `grok` / `xai`)
- `GROQ_API_KEY` (or `GROK_API_KEY`)

### Optional Render environment variables

- `GROQ_MODEL` (example: `llama-3.1-8b-instant`)
- `AI_MODEL` (overrides model selection if set)

Notes:

- Do not set `PORT` on Render manually unless you need to override; Render injects it automatically.
- Frontend API calls use same-origin `/api/*`, so no separate proxy service is required in production.
