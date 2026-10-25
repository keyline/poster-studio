# Poster Studio

Your team's AI creative agency, following the traditional agency flow:

1. **Client brands.** Add a client: details, about text, website, Facebook and Instagram (URL and/or screenshots), brochures (PDF), old ads, logo. The planning team reads everything and runs a **brand & competitor study** with live web research. Brands are stored, so the team can keep many clients.
2. **Create poster.** Pick a brand, write the brief, choose the **creative depth** (1 = straight and clear … 10 = double-meaning, award-level concept), choose one or more **positioning styles** (Fear, Lust, Greed, Pride, Belonging, Nostalgia…), then assemble the **creative team**: Copywriter, Creative/Art Director, Visualizer and Photographer. Each has a detailed profile (experience, approach, signature, influences, what they avoid, a sample) that is given to the AI in full. Every run creates **two creatives**: 1 · graphic, 2 · realistic photo (set in `CREATIVE_STYLES` in `lib/craft.ts`).
3. **Two ideas.** The team develops 2 different ideas (insight, headline, subhead, body copy, CTA, tagline, visual concept, double meaning), then an **Executive Creative Director reviews** them, sharpens the copy to the chosen depth and notes what changed. Everything is editable.
4. **Two creative briefs.** The art director lays out each ad, then the Creative Director writes a full creative brief per ad in the house format (THE BRIEF, strategic insight, central creative idea with territories and the chosen direction, creative philosophy, art direction, copywriting, channel execution, creative test, final deliverable). That brief is the final image prompt. Format and channel (e.g. LinkedIn, 4:5 at 1080 × 1350) are part of it. The alternative mode "Picture only + studio typesetting" asks for a text-free picture and typesets the copy in the app.
5. **Posters + post copy.** Each creative comes with a ready-to-publish social caption (post copy). **Download all** saves the 2 finished posters and 2 `.txt` caption files. Images are generated with OpenAI's GPT Image models (default `gpt-image-1-mini`), capped at **$0.04 per image**. By default the copy and logo are **typeset by the app** with real fonts (crisp, editable, no AI lettering). Adjust position, colour and font, then download.

Experts and positioning styles are plain lists in `lib/experts.ts` and `lib/appeals.ts`.

## Add your OpenAI API key

1. Go to <https://platform.openai.com/api-keys>, click **Create new secret key**, name it "Poster Studio", copy it (starts with `sk-`). You only see it once.
2. Add credit at <https://platform.openai.com/settings/organization/billing> (e.g. $10) and, to be safe, set a **monthly budget limit** under Settings → Limits.
3. Image models may need a verified organization: Settings → Organization → **Verify organization**.
4. In Vercel: open the project → **Settings → Environment Variables** → add `OPENAI_API_KEY` = your key (all environments) → Save.
5. **Deployments** → latest deployment → **⋯ → Redeploy**. Environment changes only apply after a redeploy.

Never put the key in the code or share it in chat; it lives only in Vercel.

## Image cost limit

Each image is limited to **$0.04** by default (`MAX_IMAGE_COST_USD`). The server enforces it: if a quality would cost more, it automatically uses the best quality that fits. The poster screen shows the model, quality and estimated cost before you shoot.

Approximate prices with the default `gpt-image-1-mini`:

| Format | Low | Medium | High |
|---|---|---|---|
| Square 1024×1024 | $0.005 | $0.011 | $0.036 ✅ |
| Portrait / landscape | $0.006 | $0.015 ✅ | $0.052 ❌ over budget |

✅ = what "Best within budget" picks. So square posters come out in high quality and portrait/landscape in medium.
For a different trade-off, change `MAX_IMAGE_COST_USD` (e.g. `0.06` lets portrait use high quality) or `OPENAI_IMAGE_MODEL`.
Prices are third-party estimates of OpenAI's rates; check your OpenAI usage page after the first few posters. Text steps (study, ideas, prompts) cost roughly $0.01–0.05 per run.

## Deploy on Vercel

1. Import this repo at <https://vercel.com/new>.
2. Environment variables:
   - `OPENAI_API_KEY`: your OpenAI key (required)
   - `APP_PASSWORD`: shared team password (recommended)
3. **Share brands with the team (optional):** by default brands are saved in each person's browser. To share one brand list with everyone, go to your Vercel project → **Storage → Create / Connect Database → Redis** (or Upstash for Redis; the free tier is enough) and connect it to the project. Vercel adds `REDIS_URL` (or `KV_REST_API_URL` / `KV_REST_API_TOKEN` for Upstash) automatically. Redeploy. Brands already saved in a browser can then be moved to the team with the **Move them to the team** button on the Brands page.
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

Without Redis variables, brands are saved in the browser (IndexedDB).

## Configuration

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `OPENAI_API_KEY` | yes | – | OpenAI API key |
| `APP_PASSWORD` | recommended | none | Shared team password |
| `REDIS_URL`, or `KV_REST_API_URL` + `KV_REST_API_TOKEN` | to share brands | – | Redis or Upstash Redis (added by Vercel); otherwise brands stay in each browser |
| `OPENAI_TEXT_MODEL` | no | `gpt-4.1` | Model for study, ideas and prompts |
| `OPENAI_IMAGE_MODEL` | no | `gpt-image-1-mini` | Image model (`gpt-image-1.5`, … also priced in `lib/imageCost.ts`) |
| `MAX_IMAGE_COST_USD` | no | `0.04` | Maximum estimated cost per image |
| `OPENAI_BASE_URL` | no | `https://api.openai.com/v1` | API base URL |
