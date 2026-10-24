import { appealNames } from "@/lib/appeals";
import { brandContext } from "@/lib/brandContext";
import { getExpert } from "@/lib/experts";
import { AppError, parseJson, respond } from "@/lib/openai";
import { route } from "@/lib/server";
import { getBrand } from "@/lib/store";
import type { Idea, Team } from "@/lib/types";

export const maxDuration = 120;

export const POST = route(async (req) => {
  const { brandId, brief, appeals, team, orientation } = (await req.json()) as {
    brandId: string;
    brief: string;
    appeals: string[];
    team: Team;
    orientation: string;
  };
  const brand = await getBrand(brandId);
  if (!brand) throw new AppError("Brand not found.", 404);
  if (!brief?.trim()) throw new AppError("Write a brief first.", 400);
  const cw = getExpert(team?.copywriter);
  const ad = getExpert(team?.artDirector);
  const vz = getExpert(team?.visualizer);
  if (!cw || !ad || !vz) throw new AppError("Select your copywriter, art director and visualizer.", 400);

  const system = `You are a creative team in a traditional advertising agency, working on a ${orientation} poster.
- Copywriter: ${cw.name} — ${cw.style}
- Creative/Art Director: ${ad.name} — ${ad.style}
- Visualizer: ${vz.name} — ${vz.style}

The copywriter leads the thinking, the visualizer turns each idea into one strong image, the art director keeps it on-brand.

Develop exactly 3 distinctly different creative ideas (different insights and routes, not variations of one line).
Every idea must be driven by the selected positioning appeal(s); combine them where it makes sense.
Use the brand study: exploit market gaps, avoid what competitors already say, follow the brand do's and don'ts.

Copy rules — it must read like a seasoned human copywriter, not AI:
- Headline max 9 words. Concrete, specific, surprising. Wordplay only if it really lands.
- No AI clichés: unlock, unleash, elevate, discover, journey, seamless, revolutionize, game-changer, experience the, "more than just", "redefine", "embrace", "ultimate".
- No exclamation marks unless essential. Plain, natural language for the local audience and culture.
- Subhead max 14 words. Body copy max 25 words. CTA max 4 words.

Respond with ONLY a JSON object:
{"ideas":[{"title":"2–4 word route name","appeals":["appeal names used"],"insight":"the human truth","bigIdea":"one sentence","headline":"","subhead":"","body":"","cta":"","tagline":"short sign-off or empty","visualConcept":"what the image shows, 2–3 sentences — real, photographable","rationale":"why it works vs competitors, 1–2 sentences"}]}`;

  const content = `# Brand\n${brandContext(brand)}\n\n# Poster brief\n${brief}\n\n# Positioning appeal(s)\n${appealNames(appeals ?? []).join("\n") || "Choose what fits the brief best"}`;

  const { text } = await respond({ system, content, json: true });
  const ideas = (parseJson<{ ideas: Idea[] }>(text).ideas ?? []).slice(0, 3);
  if (ideas.length === 0) throw new AppError("No ideas came back. Please try again.", 502);
  return { ideas };
});
