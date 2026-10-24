import { normalizeStudy } from "@/lib/brandContext";
import { AppError, parseJson, respond } from "@/lib/openai";
import { route } from "@/lib/server";
import { getBrand, saveBrand } from "@/lib/store";
import { fetchPage } from "@/lib/web";

type Ctx = { params: Promise<{ id: string }> };

// Research with web search can take a couple of minutes.
export const maxDuration = 300;

const SYSTEM = `You are the strategic planning team of a top traditional creative agency.
Do a detailed brand and competitor study for the client below, to brief copywriters and art directors.

Research with web search: the brand itself, its website and social presence, its category in its market/location, and its REAL direct competitors (4–6). Use the client material provided. Base claims on evidence; where you infer, say so briefly.

Respond with ONLY a JSON object (no markdown fences) of this exact shape:
{
  "brandSummary": "3–5 sentences: who they are, what they sell, where, price positioning",
  "category": "short category name",
  "targetAudience": ["specific audience segments with demographics and mindset"],
  "brandPersonality": ["4–6 adjectives"],
  "toneOfVoice": "how the brand speaks today and how it should speak",
  "visualIdentity": { "colors": ["#hex – name/usage"], "typography": "observed or recommended", "imagery": "photography/illustration style observed or recommended" },
  "usp": ["unique selling points"],
  "competitors": [{ "name": "", "positioning": "", "strengths": "", "weaknesses": "", "communicationStyle": "how their ads/social look and sound" }],
  "marketGaps": ["what nobody in the category is saying or showing"],
  "positioningOpportunities": ["concrete angles this brand can own"],
  "dos": ["creative do's for this brand"],
  "donts": ["creative don'ts — clichés of the category, things competitors overuse, brand risks"],
  "sources": ["URLs or materials used"]
}`;

export const POST = route(async (_req, ctx: Ctx) => {
  const brand = await getBrand((await ctx.params).id);
  if (!brand) throw new AppError("Brand not found.", 404);

  const fetched: string[] = [];
  const tryFetch = async (label: string, url: string, max: number) => {
    if (!url) return;
    try {
      fetched.push(`### ${label} (${url})\n${await fetchPage(url, max)}`);
    } catch (e) {
      fetched.push(`### ${label} (${url})\nCould not be fetched directly (${(e as Error).message}).`);
    }
  };
  await Promise.all([
    tryFetch("Website", brand.website, 9000),
    tryFetch("Facebook page", brand.facebook, 1500),
    tryFetch("Instagram profile", brand.instagram, 1500),
  ]);

  const material = [
    `# Client details`,
    `Brand name: ${brand.name}`,
    brand.industry && `Industry: ${brand.industry}`,
    brand.location && `Market / location: ${brand.location}`,
    brand.description && `Client's own description:\n${brand.description}`,
    brand.website && `Website: ${brand.website}`,
    brand.facebook && `Facebook: ${brand.facebook}`,
    brand.instagram && `Instagram: ${brand.instagram}`,
    brand.otherLinks && `Other links: ${brand.otherLinks}`,
    brand.competitorsHint && `Competitors the client mentioned: ${brand.competitorsHint}`,
    fetched.length > 0 && `# Fetched pages\n${fetched.join("\n\n")}`,
    brand.notes.length > 0 && `# Notes from uploaded screenshots and documents\n${brand.notes.map((n) => `## ${n.label}\n${n.text}`).join("\n\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const { text, usedWebSearch } = await respond({ system: SYSTEM, content: material, webSearch: true });
  brand.study = normalizeStudy(parseJson(text), usedWebSearch);
  return { brand: await saveBrand(brand) };
});
