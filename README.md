# Poster Studio

A small team tool: **pick an expert → describe the poster → get a detailed AI-written prompt → generate posters** with the OpenAI API.

- 8 built-in experts (Marketing Strategist, Graphic Designer, Event Promoter, Social Media Manager, Brand Storyteller, Real Estate Marketer, Corporate Communications, Minimalist/Swiss). Edit them in `lib/experts.ts`.
- Prompt is editable before generating.
- Portrait / square / landscape, low / medium / high quality, 1–4 variations, one-click download.
- Your OpenAI key stays on the server; an optional team password stops strangers from using your credits.

## Deploy on Vercel (recommended, ~5 minutes)

1. Go to <https://vercel.com/new>, sign in with GitHub, and import this repository.
2. Under **Environment Variables** add:
   - `OPENAI_API_KEY` — your key from <https://platform.openai.com/api-keys>
   - `APP_PASSWORD` — any password you'll share with your team
3. Click **Deploy**. Share the URL + password with your team.

> Image generation takes 20–60s. If high-quality posters time out on Vercel's free plan, use Medium quality or upgrade the plan.

> Your OpenAI organization may need to be verified to use `gpt-image-1` (OpenAI dashboard → Settings → Organization → Verify).

## Run locally

```bash
cp .env.example .env.local   # then fill in OPENAI_API_KEY
npm install
npm run dev                  # http://localhost:3000
```

## Configuration

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `OPENAI_API_KEY` | yes | – | OpenAI API key |
| `APP_PASSWORD` | recommended | none | Shared team password |
| `OPENAI_TEXT_MODEL` | no | `gpt-4.1-mini` | Model that writes the prompt |
| `OPENAI_IMAGE_MODEL` | no | `gpt-image-1` | Model that draws the poster |
