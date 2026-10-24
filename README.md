# Poster Studio

Your team's AI creative agency, following the traditional agency flow:

1. **Client brands.** Add a client: details, about text, website, Facebook and Instagram (URL and/or screenshots), brochures (PDF), old ads, logo. The planning team reads everything and runs a **brand & competitor study** with live web research. Brands are stored, so the team can keep many clients.
2. **Create poster.** Pick a brand, write the brief, choose one or more **positioning styles** (Fear, Lust, Greed, Pride, Belonging, Nostalgia…), then assemble the **creative team**: Copywriter, Creative/Art Director, Visualizer and Photographer, each with their own style.
3. **Three ideas.** The team presents 3 different ideas with headline, subhead, body copy, CTA and visual concept. Everything is editable.
4. **Three shoot briefs.** The art director and photographer write 3 detailed image prompts in 3 different styles, written like real photo-shoot briefs so the images don't look AI-made.
5. **Posters.** Images are generated with `gpt-image-1`. By default the copy and logo are **typeset by the app** with real fonts (crisp, editable, no AI lettering). Adjust position, colour and font, then download.

Experts and positioning styles are plain lists in `lib/experts.ts` and `lib/appeals.ts`.

## Deploy on Vercel

1. Import this repo at <https://vercel.com/new>.
2. Environment variables:
   - `OPENAI_API_KEY`: your OpenAI key (required)
   - `APP_PASSWORD`: shared team password (recommended)
3. **Storage (needed to remember brands):** in your Vercel project go to **Storage → Create / Connect Database → Upstash for Redis** (free tier is enough) and connect it to the project. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically. Redeploy.
   Without it, brands are kept only temporarily and will disappear.
4. Deploy.

Notes
- The brand study uses OpenAI's web search tool. If your model/account doesn't support it, the app falls back to the model's own knowledge plus your material, and says so on the study.
- The study and high-quality images can take 1–3 minutes. If you see timeouts on the Vercel Hobby plan, make sure **Fluid compute** is enabled (Project → Settings → Functions), or use Medium quality.
- Facebook and Instagram usually block automated reading, so **screenshots** of the page/profile and a few posts give the best results.
- PDFs up to 3 MB each (serverless upload limit).

## Run locally

```bash
cp .env.example .env.local   # fill in OPENAI_API_KEY
npm install
npm run dev                  # http://localhost:3000
```

Locally, brands are saved to `.data/brands.json` unless Upstash variables are set.

## Configuration

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `OPENAI_API_KEY` | yes | – | OpenAI API key |
| `APP_PASSWORD` | recommended | none | Shared team password |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | for saving brands | – | Upstash Redis (added by Vercel) |
| `OPENAI_TEXT_MODEL` | no | `gpt-4.1` | Model for study, ideas and prompts |
| `OPENAI_IMAGE_MODEL` | no | `gpt-image-1` | Image model |
| `OPENAI_BASE_URL` | no | `https://api.openai.com/v1` | API base URL |
