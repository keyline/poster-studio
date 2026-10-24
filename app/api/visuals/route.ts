import { brandContext } from "@/lib/brandContext";
import { sanitizeBrand } from "@/lib/brandInput";
import { AD_LAYOUT_RULES, clampDepth, depthGuide, isAdStyle, realismRules, styleGuide } from "@/lib/craft";
import { getExpert } from "@/lib/experts";
import { AppError, parseJson, respond } from "@/lib/openai";
import { route } from "@/lib/server";
import type { Idea, Layout, Team, TextMode, Visual } from "@/lib/types";

// Two agency steps: art direction (layout spec), then the final image prompt.
export const maxDuration = 300;

const LAYOUT_SHAPE = `"layout":{"position":"top|bottom|left|right|center — where the headline block sits","tone":"light (white type) or dark (black type), whichever reads on that area","accent":"#hex from the brand palette","font":"serif|sans|condensed"}`;

export const POST = route(async (req) => {
  const { brand: rawBrand, ideas, team, orientation, textMode, adStyle, depth: rawDepth } = (await req.json()) as {
    brand: unknown;
    ideas: Idea[];
    team: Team;
    orientation: string;
    textMode: TextMode;
    adStyle: unknown;
    depth: unknown;
  };
  const brand = sanitizeBrand(rawBrand);
  if (!Array.isArray(ideas) || ideas.length === 0) throw new AppError("Create the ideas first.", 400);
  const ad = getExpert(team?.artDirector);
  const ph = getExpert(team?.photographer);
  const vz = getExpert(team?.visualizer);
  if (!ad || !ph || !vz) throw new AppError("Select your art director, visualizer and photographer.", 400);
  const style = isAdStyle(adStyle) ? adStyle : "photo";
  const depth = clampDepth(rawDepth);
  const aiText = textMode === "ai";

  const ideasText = ideas
    .map(
      (i, n) =>
        `## Idea ${n + 1}: ${i.title}\nBig idea: ${i.bigIdea}\nHeadline: ${i.headline}\nSubhead: ${i.subhead}\nBody: ${i.body}\nCTA: ${i.cta}\nTagline: ${i.tagline}\nVisual concept: ${i.visualConcept}${i.doubleMeaning ? `\nDouble meaning: ${i.doubleMeaning}` : ""}`,
    )
    .join("\n\n");
  const context = `# Brand\n${brandContext(brand)}\n\n# Approved ideas\n${ideasText}`;

  // Step 1: the art director lays out each ad, like a scamp/marker visual.
  const adSystem = `You are ${ad.name}, Creative/Art Director (${ad.style}), working with visualizer ${vz.name} (${vz.style}).
Turn each approved idea into a precise art-direction spec for a ${orientation} print ad, as you would brief a studio before the shoot.

${styleGuide(style)}

${depthGuide(depth)}

${AD_LAYOUT_RULES}

For each idea, the spec must say: the exact composition (what is where, rough % of the frame), how the visual delivers the idea${depth >= 7 ? " and its double meaning" : ""}, the typographic layout (headline position, size, typeface style, colour), where body copy and the sign-off (logo + tagline) go, the palette (hex), and the texture/finish. Use the brand's visual identity. Give the three ads three clearly different executions within the chosen ad style.

Respond with ONLY a JSON object:
{"visuals":[{"styleName":"2–4 words","styleNote":"one sentence on the execution","artDirection":"the spec, 90–150 words",${LAYOUT_SHAPE}}]}
Return them in the same order as the ideas.`;

  const specRes = await respond({ system: adSystem, content: context, json: true });
  const specs = parseJson<{ visuals: Partial<Visual>[] }>(specRes.text).visuals ?? [];

  // Step 2: the specialist writes the final image-generation prompt from the spec.
  const maker =
    style === "photo"
      ? `${ph.name}, photographer (${ph.style})`
      : style === "graphic"
        ? "the studio's senior illustrator and finished-artist"
        : "the studio's senior typographer and finished-artist";

  const textRule = aiText
    ? `TEXT IN THE IMAGE: this is the finished ad. Render the headline, subhead, CTA and tagline EXACTLY as written, each in double quotes, with the typeface style, size, colour and placement from the spec. Spell every word exactly; no other words, letters or numbers anywhere. Leave a clear empty area in the sign-off corner for the logo; do not draw any logo.`
    : `NO TEXT IN THE IMAGE: absolutely no letters, words, numbers, logos, signage or watermarks — the studio typesets the copy afterwards. Keep the area named in layout.position (about a third of the frame) calm and uncluttered so type can sit on it${style === "typographic" ? "; the image is just the background surface (flat brand colour or paper texture with subtle print grain)" : ""}.`;

  const promptSystem = `You are ${maker}. Write the final image-generation prompt (gpt-image) for each art-direction spec, so the output looks like a real ${style === "photo" ? "photographic" : style === "graphic" ? "graphic" : "typographic"} print advertisement made by a top agency, not like an AI picture.

${styleGuide(style)}

${realismRules(style)}

${textRule}

Each prompt: 170–260 words of plain prose. Start with "A ${orientation} print advertisement…", then the composition, the visual, ${style === "photo" ? "lighting, camera, lens and film, " : ""}palette, typography (if any), texture and finish.

Before answering, check every prompt: Is it clearly an ADVERTISEMENT with a designed layout, not just a picture? Does it follow the spec? Would an art director believe a human made it? Fix it if not.

Respond with ONLY a JSON object: {"prompts":["prompt for ad 1","prompt for ad 2","prompt for ad 3"]}`;

  const specText = ideas
    .map((i, n) => `## Ad ${n + 1} (idea: ${i.title})\nCopy: headline "${i.headline}", subhead "${i.subhead}", CTA "${i.cta}", tagline "${i.tagline}"\nSpec: ${specs[n]?.artDirection || i.visualConcept}`)
    .join("\n\n");
  const promptRes = await respond({ system: promptSystem, content: `# Brand\n${brandContext(brand)}\n\n# Art-direction specs\n${specText}`, json: true });
  const prompts = parseJson<{ prompts: string[] }>(promptRes.text).prompts ?? [];

  const visuals: Visual[] = ideas.map((_, i) => normalizeVisual(specs[i], prompts[i]));
  if (!visuals.some((v) => v.prompt)) throw new AppError("No prompts came back. Please try again.", 502);
  return { visuals };
});

function normalizeVisual(v: Partial<Visual> = {}, prompt?: string): Visual {
  const l = (v.layout ?? {}) as Partial<Layout>;
  return {
    styleName: v.styleName || "Visual",
    styleNote: v.styleNote || "",
    artDirection: v.artDirection || "",
    prompt: typeof prompt === "string" ? prompt : "",
    layout: {
      position: ["top", "bottom", "left", "right", "center"].includes(l.position as string) ? l.position! : "bottom",
      tone: l.tone === "dark" ? "dark" : "light",
      accent: /^#[0-9a-f]{6}$/i.test(l.accent ?? "") ? l.accent! : "#e8552d",
      font: ["serif", "sans", "condensed"].includes(l.font as string) ? l.font! : "sans",
    },
  };
}
