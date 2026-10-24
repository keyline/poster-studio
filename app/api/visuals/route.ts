import { brandContext } from "@/lib/brandContext";
import { getExpert } from "@/lib/experts";
import { AppError, parseJson, respond } from "@/lib/openai";
import { route } from "@/lib/server";
import { getBrand } from "@/lib/store";
import type { Idea, Layout, Team, TextMode, Visual } from "@/lib/types";

export const maxDuration = 120;

const NOT_AI = `Rules so the result does NOT look AI-generated:
- Write it as a brief for a real photo shoot: camera body, lens (mm), aperture, shutter, ISO or film stock, the real lighting setup and modifiers, time of day, the exact location and set dressing.
- Real-world imperfection: natural skin texture with pores and fine lines, stray hairs, creased fabric, a little everyday clutter, dust, slight lens vignetting, subtle film grain or sensor noise, believable shadows, slightly off-centre framing, honest colour grading (no oversaturation, no HDR).
- People: real-looking local people who fit the audience and location, ordinary body types, candid expressions — no stock-photo smiles, no posing at camera unless the idea needs it.
- Materials and products must look physically real, with correct scale, reflections and wear.
- Explicitly avoid: plastic or airbrushed skin, glossy CGI/3D render look, perfect symmetry, glowing rim light, fantasy or neon haze unless motivated, dreamy bokeh overload, surreal impossible backgrounds, extra fingers or warped hands, smooth gradients, "digital art" or "hyper-realistic" wording.`;

export const POST = route(async (req) => {
  const { brandId, ideas, team, orientation, textMode } = (await req.json()) as {
    brandId: string;
    ideas: Idea[];
    team: Team;
    orientation: string;
    textMode: TextMode;
  };
  const brand = await getBrand(brandId);
  if (!brand) throw new AppError("Brand not found.", 404);
  if (!Array.isArray(ideas) || ideas.length === 0) throw new AppError("Create the ideas first.", 400);
  const ad = getExpert(team?.artDirector);
  const ph = getExpert(team?.photographer);
  const vz = getExpert(team?.visualizer);
  if (!ad || !ph || !vz) throw new AppError("Select your art director, visualizer and photographer.", 400);

  const textRule =
    textMode === "ai"
      ? `TEXT: This is the finished ${orientation} print poster. Include the headline, subhead and CTA exactly as written, in double quotes, and specify typeface style, size, colour and exact placement like a real print ad layout. Include space for the logo but do not draw a logo. No other text.`
      : `TEXT: Absolutely NO text, letters, numbers, logos, signage or watermarks anywhere in the image — typography will be added later by the art director. Compose the photograph so the area given in "layout.position" (about one third of the frame) is calm, uncluttered negative space where type can sit legibly.`;

  const system = `You are the craft team of a traditional creative agency turning approved ideas into ${orientation} poster visuals.
- Creative/Art Director: ${ad.name} — ${ad.style}
- Visualizer: ${vz.name} — ${vz.style}
- Photographer: ${ph.name} — ${ph.style}

For EACH idea write one detailed image-generation prompt (gpt-image). The three visuals must use three clearly DIFFERENT execution styles (e.g. documentary photo vs studio still life vs editorial portrait vs mixed-media) while each staying true to its idea, the brand palette and the photographer's craft.

${NOT_AI}

${textRule}

Each prompt: 170–260 words, plain prose, start with the shot type and subject, then setting, composition, lighting, camera/lens/film, colour grading, texture and mood; state the ${orientation} orientation.

Respond with ONLY a JSON object:
{"visuals":[{"styleName":"2–4 words","styleNote":"one sentence on why this style","prompt":"...","layout":{"position":"top|bottom|left|right|center — where the type sits","tone":"light (white type) or dark (black type), whichever reads best on that area","accent":"#hex from the brand palette for the CTA","font":"serif|sans|condensed"}}]}
Return the visuals in the same order as the ideas.`;

  const content = `# Brand\n${brandContext(brand)}\n\n# Approved ideas\n${ideas
    .map(
      (i, n) =>
        `## Idea ${n + 1}: ${i.title}\nBig idea: ${i.bigIdea}\nHeadline: ${i.headline}\nSubhead: ${i.subhead}\nCTA: ${i.cta}\nVisual concept: ${i.visualConcept}`,
    )
    .join("\n\n")}`;

  const { text } = await respond({ system, content, json: true });
  const raw = parseJson<{ visuals: Partial<Visual>[] }>(text).visuals ?? [];
  const visuals: Visual[] = ideas.map((_, i) => normalizeVisual(raw[i]));
  if (!visuals.some((v) => v.prompt)) throw new AppError("No prompts came back. Please try again.", 502);
  return { visuals };
});

function normalizeVisual(v: Partial<Visual> = {}): Visual {
  const l = (v.layout ?? {}) as Partial<Layout>;
  return {
    styleName: v.styleName || "Visual",
    styleNote: v.styleNote || "",
    prompt: v.prompt || "",
    layout: {
      position: ["top", "bottom", "left", "right", "center"].includes(l.position as string) ? l.position! : "bottom",
      tone: l.tone === "dark" ? "dark" : "light",
      accent: /^#[0-9a-f]{6}$/i.test(l.accent ?? "") ? l.accent! : "#e8552d",
      font: ["serif", "sans", "condensed"].includes(l.font as string) ? l.font! : "sans",
    },
  };
}
