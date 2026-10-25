import { brandContext } from "@/lib/brandContext";
import { sanitizeBrand } from "@/lib/brandInput";
import { AD_LAYOUT_RULES, CREATIVE_STYLES, formatInfo, clampDepth, depthGuide, realismRules, styleGuide, styleName, threeStylesGuide, type AdStyle } from "@/lib/craft";
import { buildImageBrief, type BriefParts, type LogoUsage } from "@/lib/briefTemplate";
import { expertProfile, getExpert, type Expert } from "@/lib/experts";
import { AppError, parseJson, respond, type Part } from "@/lib/openai";
import { route } from "@/lib/server";
import type { Brand, Idea, Layout, LogoPos, Team, TextMode, Visual } from "@/lib/types";

// Two agency steps: art direction (layout spec), then the final image prompt.
export const maxDuration = 300;

const LAYOUT_SHAPE = `"layout":{"position":"top|bottom|left|right|center — where the headline block sits","tone":"light (white type) or dark (black type), whichever reads on that area","accent":"#hex from the brand palette","font":"serif|sans|condensed"}`;

export const POST = route(async (req) => {
  const { brand: rawBrand, ideas, team, orientation, channel: rawChannel, brief, textMode, depth: rawDepth, logo: rawLogo } = (await req.json()) as {
    brand: unknown;
    ideas: Idea[];
    team: Team;
    orientation: string;
    channel?: string;
    brief?: string;
    logo?: string; // the brand logo (data URL), so the Creative Director can plan its use
    textMode: TextMode;
    depth: unknown;
  };
  const brand = sanitizeBrand(rawBrand);
  if (!Array.isArray(ideas) || ideas.length === 0) throw new AppError("Create the ideas first.", 400);
  const ad = getExpert(team?.artDirector);
  const ph = getExpert(team?.photographer);
  const cw = getExpert(team?.copywriter);
  const vz = getExpert(team?.visualizer);
  if (!ad || !ph || !vz) throw new AppError("Select your art director, visualizer and photographer.", 400);
  const depth = clampDepth(rawDepth);
  const aiText = textMode !== "overlay";
  const channel = rawChannel || "LinkedIn";
  const format = formatInfo(orientation);
  const logo = typeof rawLogo === "string" && rawLogo.startsWith("data:image/") && rawLogo.length < 1_500_000 ? rawLogo : undefined;
  const styleOf = (n: number): AdStyle => CREATIVE_STYLES[n] ?? "photo";

  const ideasText = ideas
    .map(
      (i, n) =>
        `## Ad ${n + 1} — ${styleName(styleOf(n))}: ${i.title}\nBig idea: ${i.bigIdea}\nHeadline: ${i.headline}\nSubhead: ${i.subhead}\nBody: ${i.body}\nCTA: ${i.cta}\nTagline: ${i.tagline}\nVisual concept: ${i.visualConcept}${i.doubleMeaning ? `\nDouble meaning: ${i.doubleMeaning}` : ""}`,
    )
    .join("\n\n");
  const context = `# Brand\n${brandContext(brand)}\n\n# Approved ideas\n${ideasText}`;

  // Step 1: the art director lays out each ad, like a scamp/marker visual.
  const adSystem = `You are the Creative/Art Director:
${expertProfile(ad)}

You work with the visualizer:
${expertProfile(vz)}

Turn each approved idea into a precise art-direction spec for a print ad in ${format.brief}, as you would brief a studio before the shoot. Each ad has its own style:

${threeStylesGuide()}

${depthGuide(depth)}

${AD_LAYOUT_RULES}

For each ad, the spec must say: the exact composition (what is where, rough % of the frame), how the visual delivers the idea${depth >= 7 ? " and its double meaning" : ""}, the typographic layout (headline position, size, typeface style, colour), where body copy and the sign-off (logo + tagline) go, the palette (hex), and the texture/finish. Use the brand's visual identity and your own signature moves. For the text-only ad, the words ARE the visual: describe the type treatment and a plain background.

Respond with ONLY a JSON object:
{"visuals":[{"styleName":"2–4 words","styleNote":"one sentence on the execution","artDirection":"the spec, 90–150 words",${LAYOUT_SHAPE}}]}
Return them in the same order as the ideas.`;

  const specRes = await respond({ system: adSystem, content: context, json: true });
  const specs = parseJson<{ visuals: Partial<Visual>[] }>(specRes.text).visuals ?? [];

  let prompts: string[];
  let logoZones: (LogoPos | undefined)[] = [];
  if (aiText) {
    // Step 2: the Creative Director writes a full creative brief per ad; the app assembles it in the house format.
    ({ prompts, logoZones } = await writeCreativeBriefs({ brand, ideas, specs, team: { cw, ad, vz, ph }, channel, format, brief: brief ?? "", depth, logo }));
  } else {
  // Step 2: the right specialist for each ad writes its final image-generation prompt.
  const makers: Record<AdStyle, string> = {
    typographic: "the studio's senior typographer and finished-artist (for the text-only ad)",
    graphic: `the studio's senior illustrator and finished-artist (for the graphic ad), following the visualizer's signature: ${vz.style}`,
    photo: `the photographer (for the realistic-photo ad):\n${expertProfile(ph)}`,
  };

  const textRule = aiText
    ? `TEXT IN THE IMAGE: this is the finished ad. Render the headline, subhead, CTA and tagline EXACTLY as written, each in double quotes, with the typeface style, size, colour and placement from the spec. Spell every word exactly; no other words, letters or numbers anywhere. Leave a clear empty area in the sign-off corner for the logo; do not draw any logo.`
    : `PICTURE ONLY — NO TEXT: the studio typesets the headline, body copy, CTA and logo afterwards with real fonts. So the spec's typography, copy and logo notes are NOT for you: ignore them and describe only the picture. Absolutely no letters, words, numbers, logos, brand names, signage, labels, screens with writing, or watermarks anywhere. Keep the zone where the type will sit calm, uncluttered and evenly toned so text reads cleanly on it. For the text-only ad (ad 1) the picture is just the background surface: a flat brand-colour field or uncoated paper with subtle print grain and at most one small graphic accent away from the centre.`;

  const promptSystem = `You are the studio team finishing three ads. Each ad is made by its specialist:
- Ad 1 (text only): ${makers.typographic}
- Ad 2 (graphic): ${makers.graphic}
- Ad 3 (realistic photo): ${makers.photo}

Write the final image-generation prompt (gpt-image) for each ad so the output looks like real work by a top agency, not like an AI picture.

${CREATIVE_STYLES.map((st, i) => `Ad ${i + 1} rules:\n${styleGuide(st)}\n${realismRules(st)}`).join("\n\n")}

${textRule}

${
    aiText
      ? `Each prompt: 170–260 words of plain prose. Start with "A ${orientation} print advertisement…", then the composition, the visual, (for the photo ad) lighting, camera, lens and film, palette, typography, texture and finish.

Before answering, check every prompt: Is it clearly an ADVERTISEMENT with a designed layout? Is every word to render spelled exactly as given, with no other text? Would an art director believe a human made it? Fix it if not.`
      : `Each prompt: 150–230 words of plain prose. Start ad 1 with "A ${orientation} background surface…", ad 2 with "A ${orientation} poster illustration…", ad 3 with "A ${orientation} advertising photograph…". Then the subject, composition (state exactly which part of the frame stays empty for type), (for the photo ad) lighting, camera, lens and film, palette, texture and finish.

Before answering, check every prompt: Does it mention a headline, words, typography, a logo or a brand name? Remove them. Is the empty type zone clearly described? Would an art director believe a human made it? Fix it if not.`
  }

Respond with ONLY a JSON object: {"prompts":["prompt for ad 1","prompt for ad 2","prompt for ad 3"]}`;

  const specText = ideas
    .map(
      (i, n) =>
        `## Ad ${n + 1} — ${styleName(styleOf(n))} (idea: ${i.title})\n${aiText ? `Copy to render: headline "${i.headline}", subhead "${i.subhead}", CTA "${i.cta}", tagline "${i.tagline}"\n` : ""}Type zone: ${specs[n]?.layout?.position ?? "bottom"} of the frame\nSpec: ${specs[n]?.artDirection || i.visualConcept}`,
    )
    .join("\n\n");
  // For picture-only prompts, leave out brand names and slogans: image models turn them into lettering.
  const promptContext = aiText ? `# Brand\n${brandContext(brand)}` : pictureContext(brand);
  const promptRes = await respond({ system: promptSystem, content: `${promptContext}\n\n# Art-direction specs\n${specText}`, json: true });
  prompts = parseJson<{ prompts: string[] }>(promptRes.text).prompts ?? [];
  }

  const visuals: Visual[] = ideas.map((_, i) => {
    const v = normalizeVisual(specs[i], prompts[i], styleOf(i));
    v.layout.logoPos = logoZones[i] ?? "auto";
    // A hard rule in code, because image models otherwise like to add words and fake logos.
    if (v.prompt && !aiText) v.prompt = pictureOnly(v.prompt, brand.name, v.layout.position);
    return v;
  });
  if (!visuals.some((v) => v.prompt)) throw new AppError("No prompts came back. Please try again.", 502);
  return { visuals };
});

const PARTS_SHAPE = `{"adType":"e.g. Recruitment Advertisement: Telecaller for Technology Products","brandDescriptor":"e.g. a Kolkata-based digital technology company","objective":"1–3 sentences: what the client needs, from the brief","mustNotLookLike":["4–5 things, e.g. a typical LinkedIn recruitment post","a job portal advertisement","a generic Canva template"],"insightHeadline":"two short sentences contrasting what most ads in this category do with what great ones do","insightBody":"1–2 sentences on what the product/role/offer really is","insightPoints":["4–5 short lines on what it truly means for the audience"],"challenge":"the creative challenge in 1–2 sentences, honest, no exaggeration","centralThought":"the central thought in one sentence","territories":[{"name":"2–4 words","description":"one sentence"}],"selectedDirection":"the ONE chosen visual for THIS ad, described in 70–120 words: what we see, where, how it carries the idea","philosophy":[{"name":"a master, e.g. David Ogilvy","principle":"one word, e.g. Persuasion","text":"2–3 sentences applying it to this ad"}],"visualRequirements":["5–8 bullets"],"avoid":["6–9 bullets of clichés to avoid for this category"],"typography":"one sentence","palette":"one sentence with hex colours from the brand","composition":"one sentence","creativeTest":["6–7 questions"],"objectiveShort":"finish the sentence 'The objective is to create an advertisement that …'"}`;

const LOGO_SHAPE = `"logo":{"zone":"bottom-right|bottom-left|top-right|top-left|bottom-center — the calmest place for the sign-off in THIS layout, away from the headline and the main visual","background":"what the area behind the logo must be so the logo reads perfectly, based on the logo's own colours (e.g. a plain light cream area, because the logo is navy and orange)","notes":"one or two sentences of further guidance for this ad, e.g. how the composition leads the eye to the sign-off"}`;

// The Creative Director writes the content of each ad's brief; buildImageBrief puts it in the house format.
async function writeCreativeBriefs(o: {
  brand: Brand;
  ideas: Idea[];
  specs: Partial<Visual>[];
  team: { cw?: Expert; ad: Expert; vz: Expert; ph: Expert };
  channel: string;
  format: ReturnType<typeof formatInfo>;
  brief: string;
  depth: number;
  logo?: string;
}): Promise<{ prompts: string[]; logoZones: (LogoPos | undefined)[] }> {
  const { cw, ad, vz, ph } = o.team;
  const system = `You are a world-class advertising creative director writing the final creative brief for each of three advertisements. The brief will be handed to the studio as the production-ready visual-generation brief, so it must be specific, honest and visual.

Your team (draw the CREATIVE PHILOSOPHY masters from their influences, and add Steve Jobs for simplicity if it fits):
${[cw && `COPYWRITER — ${expertProfile(cw)}`, `ART DIRECTOR — ${expertProfile(ad)}`, `VISUALIZER — ${expertProfile(vz)}`, `PHOTOGRAPHER — ${expertProfile(ph)}`].filter(Boolean).join("\n\n")}

${depthGuide(o.depth)}

For each ad:
- Ad 1 is a TEXT-ONLY typographic ad, ad 2 a GRAPHIC ad, ad 3 a REALISTIC PHOTO ad. Each ad's selectedDirection must fit its style and its approved idea and art-direction spec.
- territories: 4 possible creative territories for the central thought; the selectedDirection is the chosen one, developed for this ad.
- philosophy: 5–6 masters, each with the principle they bring (e.g. Steve Jobs — Simplicity, David Ogilvy — Persuasion, Bill Bernbach — Human insight, Saul Bass — Visual intelligence, Raghu Rai — Photographic authenticity, David Abbott — Restraint).
- Be truthful: never invent salary, prices, qualifications, benefits or claims not in the client brief.
- Write in plain, intelligent English.
${
    o.logo
      ? `
LOGO: the brand's real logo is attached as an image. Look at it carefully. Describe it precisely once in "logoDescription" (shape, symbol, wordmark, colours, horizontal or stacked, whether it needs a light or dark background). The logo is added to the finished image afterwards, exactly as it is, so the image must never draw a logo or write the brand name. For each ad decide the sign-off position and the background behind it so the logo is clearly legible and looks intentional, the way a brand guideline would place it.`
      : ""
  }

Respond with ONLY a JSON object: {${o.logo ? `"logoDescription":"…",` : ""}"briefs":[${o.logo ? PARTS_SHAPE.replace(/}$/, `,${LOGO_SHAPE}}`) : PARTS_SHAPE}, …two more]}`;

  const content = `# Client
${brandContext(o.brand)}

# Client brief for this campaign
${o.brief || "(see ideas)"}

# Channel and format
${o.channel}, ${o.format.brief}

# Approved ideas and art direction
${o.ideas
  .map(
    (i, n) =>
      `## Ad ${n + 1} — ${styleName(CREATIVE_STYLES[n] ?? "photo")}: ${i.title}\nInsight: ${i.insight}\nBig idea: ${i.bigIdea}\nHeadline: ${i.headline}\nVisual concept: ${i.visualConcept}\nArt direction: ${o.specs[n]?.artDirection ?? ""}`,
  )
  .join("\n\n")}`;

  const parts: Part[] = [{ type: "input_text", text: content }];
  if (o.logo) parts.push({ type: "input_text", text: "The brand logo:" }, { type: "input_image", image_url: o.logo });
  const res = await respond({ system, content: parts, json: true });
  const parsed = parseJson<{ logoDescription?: string; briefs: (Partial<BriefParts> & { logo?: Partial<LogoUsage> })[] }>(res.text);
  const briefs = parsed.briefs ?? [];
  const zones: LogoUsage["zone"][] = ["bottom-right", "bottom-left", "top-right", "top-left", "bottom-center"];
  const logoZones: (LogoPos | undefined)[] = [];

  const prompts = o.ideas.map((idea, n) => {
    const p = briefs[n] ?? {};
    const arr = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
    const str = (v: unknown, fallback = "") => (typeof v === "string" && v.trim() ? v.trim() : fallback);
    const options = [idea.headline, ...arr(idea.headlineOptions)].filter((h, k, all) => h && all.indexOf(h) === k);
    const lz = p.logo?.zone && zones.includes(p.logo.zone) ? p.logo.zone : "bottom-right";
    logoZones[n] = o.logo ? lz : undefined;
    return buildImageBrief({
      logo: o.logo
        ? {
            description: str(parsed.logoDescription, `the ${o.brand.name} logo`),
            zone: lz,
            background: str(p.logo?.background, "a plain, calm area in a colour that contrasts with the logo"),
            notes: str(p.logo?.notes),
          }
        : undefined,
      style: CREATIVE_STYLES[n] ?? "photo",
      channel: o.channel,
      formatLine: o.format.brief,
      copy: {
        brandName: o.brand.name,
        headlineOptions: options,
        headline: idea.headline,
        supportingLine: idea.subhead,
        keyInfo: idea.keyInfo ?? "",
        cta: idea.cta,
      },
      parts: {
        adType: str(p.adType, "Advertisement"),
        brandDescriptor: str(p.brandDescriptor, o.brand.industry ? `a ${o.brand.industry} brand` : "a brand"),
        objective: str(p.objective, idea.bigIdea),
        mustNotLookLike: arr(p.mustNotLookLike),
        insightHeadline: str(p.insightHeadline, idea.insight),
        insightBody: str(p.insightBody),
        insightPoints: arr(p.insightPoints),
        challenge: str(p.challenge),
        centralThought: str(p.centralThought, idea.bigIdea),
        territories: Array.isArray(p.territories) ? p.territories.map((t) => ({ name: str(t?.name), description: str(t?.description) })) : [],
        selectedDirection: str(p.selectedDirection, idea.visualConcept),
        philosophy: Array.isArray(p.philosophy)
          ? p.philosophy.map((m) => ({ name: str(m?.name), principle: str(m?.principle), text: str(m?.text) })).filter((m) => m.name)
          : [],
        visualRequirements: arr(p.visualRequirements),
        avoid: arr(p.avoid),
        typography: str(p.typography),
        palette: str(p.palette),
        composition: str(p.composition),
        creativeTest: arr(p.creativeTest),
        objectiveShort: str(p.objectiveShort, "makes the right people interested"),
      },
    });
  });
  return { prompts, logoZones };
}

const ZONE: Record<Layout["position"], string> = {
  top: "top third",
  bottom: "bottom third",
  left: "left half",
  right: "right half",
  center: "centre",
};

function pictureContext(brand: Brand) {
  const vi = brand.study?.visualIdentity;
  return [
    "# Look and setting",
    brand.location && `Location / culture: ${brand.location}`,
    vi?.colors.length && `Palette: ${vi.colors.join("; ")}`,
    vi?.imagery && `Imagery style: ${vi.imagery}`,
  ]
    .filter(Boolean)
    .join("\n");
}

const WORDY = /\b(headlines?|sub-?heads?|taglines?|slogans?|logos?|logotypes?|typograph\w*|typefaces?|fonts?|lettering|letters?|words?|text|copy|captions?|cta|call to action|body copy|sign-?off|brand ?name|wordmark|signage|labels?|written|reads?|says?|spelled)\b/i;

// Keeps only sentences about the picture itself and wraps it in the no-text rule, front and back.
function pictureOnly(prompt: string, brandName: string, position: Layout["position"]) {
  const escaped = brandName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const brandRe = escaped ? new RegExp(escaped, "gi") : null;
  const kept = prompt
    .replace(/["“”][^"“”]*["“”]/g, "")
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !WORDY.test(sentence) || /\bno (text|words|letters|lettering|logos?)\b/i.test(sentence))
    .map((sentence) => (brandRe ? sentence.replace(brandRe, "the") : sentence))
    .join(" ")
    .trim();
  return `A picture with absolutely no text, letters, numbers, logos or signage anywhere. ${kept}${noTextSuffix(position)}`;
}

function noTextSuffix(position: Layout["position"]) {
  return `\n\nIMPORTANT: the image contains no text of any kind: no letters, words, numbers, logos, brand names, signage or watermarks. Keep the ${ZONE[position]} of the frame as clean, calm negative space for typography that will be added later, and keep the bottom-right corner plain for the logo.`;
}

function normalizeVisual(v: Partial<Visual> = {}, prompt: string | undefined, style: AdStyle): Visual {
  const l = (v.layout ?? {}) as Partial<Layout>;
  return {
    styleName: `${styleName(style)} · ${v.styleName || "Visual"}`,
    styleNote: v.styleNote || "",
    artDirection: v.artDirection || "",
    prompt: typeof prompt === "string" ? prompt : "",
    layout: {
      position: ["top", "bottom", "left", "right", "center"].includes(l.position as string) ? l.position! : "bottom",
      tone: "auto", // the typesetter picks white or black from what is actually behind the text
      accent: /^#[0-9a-f]{6}$/i.test(l.accent ?? "") ? l.accent! : "#e8552d",
      font: ["serif", "sans", "condensed"].includes(l.font as string) ? l.font! : "sans",
      // The text-only ad sets its type straight on its plain background; the others use a copy panel.
      panel: style !== "typographic",
    },
  };
}
