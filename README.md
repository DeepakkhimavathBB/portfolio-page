# Deepak Khimavath Portfolio

Static portfolio with a Vercel serverless chat endpoint.

## Local setup

1. Install the Vercel CLI if needed:

```bash
npm i -g vercel
```

2. Create `.env.local` from `.env.example` and add `MISTRAL_API_KEY`.

3. Run locally without installing Vercel CLI:

```bash
npm run dev
```

Then open `http://localhost:3000`.

If you want to test with Vercel's local runtime instead, install the Vercel CLI and run:

```bash
npm run vercel-dev
```

## Vercel deployment

Add these environment variables in Vercel Project Settings:

- `MISTRAL_API_KEY` - required
- `MISTRAL_MODEL` - optional, defaults to `mistral-small-latest`
- `DEEPAK_AI_SYSTEM_PROMPT` - optional prompt override

The site entry point is `index.html`. The chat endpoint is `api/chat.js`, so the API key stays server-side and is never shipped to the browser.

## Resume

The resume link points to:

```text
assets/Deepak_Khimavath_Resume_MASTER_v3.pdf
```
