import { appealNames } from "@/lib/appeals";
import { brandContext } from "@/lib/brandContext";
import { sanitizeBrand } from "@/lib/brandInput";
import { clampDepth, depthGuide, isAdStyle, styleGuide } from "@/lib/craft";
import { getExpert } from "@/lib/experts";
import { AppError, parseJson, respond } from "@/lib/openai";
import { route } from "@/lib/server";
import type { Idea, Team } from "@/lib/types";

// Two agency steps: the team develops ideas, then the Creative Director reviews them.
export const maxDuration = 300;

const COPY_RULES = `Copy rules — it must read like a seasoned human copywriter, not AI:
- Headline max 9 words (fewer at high depth). Concrete, specific, surprising.
- No AI clichés: unlock, unleash, elevate, discover, journey, seamless, revolutionize, game-changer, "experience the", "more than just", redefine, embrace, ultimate, "look no further".
- No exclamation marks unless essential. Natural language for the local audience and culture.
- Subhead max 14 words. Body copy max 25 words. CTA max 4 words. Tagline max 6 words or empty.

Post copy (the caption published with the creative on Facebook / Instagram):
- Same idea and voice as the ad, written for the feed: a scroll-stopping first line (never repeat the headline word for word), 2–4 short lines that expand the idea, one clear call to action with the key detail (offer, date, phone or website if given in the brief), then 5–8 relevant hashtags (brand, category, location).
- 40–90 words before the hashtags. Short lines with line breaks. Max 2 emojis, only if they fit the brand. Same clichés ban as above.`;

const SHAPE = `{"ideas":[{"title":"2–4 word route name","appeals":["appeal names used"],"insight":"the human truth","bigIdea":"one sentence","headline":"","subhead":"","body":"","cta":"","tagline":"","visualConcept":"what the ad shows, 2–3 sentences, in the chosen ad style","doubleMeaning":"how copy + visual create a second reading (empty if none)","postCopy":"social caption with line breaks and hashtags","rationale":"why it works vs competitors, 1–2 sentences"}]}`;

export const POST = route(async (req) => {
  const { brand: rawBrand, brief, appeals, team, orientation, adStyle, depth: rawDepth } = (await req.json()) as {
    brand: unknown;
    brief: string;
    appeals: string[];
    team: Team;
    orientation: string;
    adStyle: unknown;
    depth: unknown;
  };
  const brand = sanitizeBrand(rawBrand);
  if (!brief?.trim()) throw new AppError("Write a brief first.", 400);
  const cw = getExpert(team?.copywriter);
  const ad = getExpert(team?.artDirector);
  const vz = getExpert(team?.visualizer);
  if (!cw || !ad || !vz) throw new AppError("Select your copywriter, art director and visualizer.", 400);
  const style = isAdStyle(adStyle) ? adStyle : "photo";
  const depth = clampDepth(rawDepth);

  const direction = `${styleGuide(style)}\n\n${depthGuide(depth)}`;
  const brandAndBrief = `# Brand\n${brandContext(brand)}\n\n# Poster brief\n${brief}\n\n# Positioning appeal(s)\n${appealNames(appeals ?? []).join("\n") || "Choose what fits the brief best"}`;

  // Step 1: the creative team develops three routes.
  const teamSystem = `You are a creative team in a traditional advertising agency, working on a ${orientation} print ad / poster.
- Copywriter: ${cw.name} — ${cw.style}
- Creative/Art Director: ${ad.name} — ${ad.style}
- Visualizer: ${vz.name} — ${vz.style}

Work the way an agency does: find the insight first, then the idea, then the words and the visual together. The copywriter and visualizer are a pair: headline and visual must be conceived together, not one decorating the other.

${direction}

Develop exactly 3 distinctly different ideas (different insights and routes, not variations of one line).
Every idea must be driven by the selected positioning appeal(s). Use the brand study: exploit market gaps, avoid what competitors already say, follow the brand do's and don'ts.

${COPY_RULES}

Respond with ONLY a JSON object:
${SHAPE}`;

  const first = await respond({ system: teamSystem, content: brandAndBrief, json: true });
  const drafts = (parseJson<{ ideas: Idea[] }>(first.text).ideas ?? []).slice(0, 3);
  if (drafts.length === 0) throw new AppError("No ideas came back. Please try again.", 502);

  // Step 2: the Executive Creative Director reviews and sharpens the work.
  const cdSystem = `You are the Executive Creative Director of a top traditional ad agency reviewing your team's three routes before they go to the client.

${direction}

Judge each idea hard against: the brief; the positioning appeal(s); the creative depth target above (raise or lower the cleverness to match it exactly); the ad style; whether headline and visual truly work together; whether it could only be for THIS brand (not a competitor); clichés and AI-sounding copy; whether it reads in 3 seconds on a wall.
Then return the improved versions: rewrite headlines, sharpen the visual concept, cut weak words. If an idea is weak or too close to another, replace it with a stronger one. Keep the three routes clearly different.
For each, add "cdNote": one sentence on what you changed and why.

${COPY_RULES}

Respond with ONLY a JSON object of the same shape as the input, with "cdNote" added to each idea:
${SHAPE.replace('"rationale"', '"cdNote":"","rationale"')}`;

  let ideas = drafts;
  try {
    const review = await respond({
      system: cdSystem,
      content: `${brandAndBrief}\n\n# The team's ideas\n${JSON.stringify({ ideas: drafts }, null, 1)}`,
      json: true,
    });
    const reviewed = (parseJson<{ ideas: Idea[] }>(review.text).ideas ?? []).slice(0, 3);
    if (reviewed.length === drafts.length && reviewed.every((i) => i.headline !== undefined)) ideas = reviewed;
  } catch {
    // If the review fails, the team's own ideas are still usable.
  }
  return { ideas };
});
