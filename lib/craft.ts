// Shared creative direction: ad styles and the 1–10 creative depth scale.

export type AdStyle = "typographic" | "graphic" | "photo";

export const AD_STYLES: { id: AdStyle; name: string; hint: string }[] = [
  { id: "typographic", name: "Text only", hint: "Typographic ad — the words are the visual" },
  { id: "graphic", name: "Graphic", hint: "Illustration, shapes, poster art" },
  { id: "photo", name: "Realistic photo", hint: "Photographic print ad" },
];

export function isAdStyle(v: unknown): v is AdStyle {
  return v === "typographic" || v === "graphic" || v === "photo";
}

export function clampDepth(v: unknown) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(10, Math.max(1, n)) : 6;
}

export const DEPTH_LABELS: Record<number, string> = {
  1: "Straight & clear",
  2: "Straight & clear",
  3: "Simple, benefit-led",
  4: "A clever twist",
  5: "A clever twist",
  6: "Witty",
  7: "Double meaning",
  8: "Double meaning",
  9: "Award-level concept",
  10: "Award-level concept",
};

export function depthGuide(depth: number): string {
  if (depth <= 3)
    return `CREATIVE DEPTH ${depth}/10 — straightforward. Say the benefit plainly and confidently. No wordplay, no puns. The visual shows the product or the benefit literally. Clarity over cleverness.`;
  if (depth <= 6)
    return `CREATIVE DEPTH ${depth}/10 — a clever twist. One fresh angle on the benefit; light wordplay is welcome if it reads instantly. The visual adds a small surprise that rewards a second look, but is still literal enough to understand alone.`;
  if (depth <= 8)
    return `CREATIVE DEPTH ${depth}/10 — double meaning. The headline must carry a genuine double meaning (pun, idiom turned, word with two readings) that relates to the product truth. Headline and visual must complete each other: neither makes full sense alone, together they click (1 + 1 = 3). Use a visual metaphor or juxtaposition, not a literal product shot.`;
  return `CREATIVE DEPTH ${depth}/10 — award-level concept, in the spirit of Cannes Lions / D&AD press and outdoor winners. The idea lives in ONE striking visual twist: a visual pun, a transformed everyday object, an unexpected juxtaposition, or clever use of negative space, that carries a double meaning on its own. The headline is short (2–6 words) and plays off the visual; the reader completes the idea and gets an "aha" within 3 seconds. Body copy and CTA are still there, short and supporting. Lateral, intelligent, never random, always tied to the brand truth.`;
}

export function styleGuide(style: AdStyle): string {
  switch (style) {
    case "typographic":
      return `AD STYLE — TEXT ONLY (typographic ad). There is no photograph and no illustration: the words are the visual. The idea must be expressed through the words AND how they are set: scale contrast, line breaks, a word broken or crossed out, spacing, alignment, a single word in the accent colour, type that forms a shape. Background is a flat brand colour or paper. Think classic typographic press ads.`;
    case "graphic":
      return `AD STYLE — GRAPHIC. Poster art made of illustration, flat shapes, symbols, cut-paper or collage. Limited palette (2–4 colours from the brand), strong silhouette, bold use of negative space, deliberate grid. Print feel: paper grain, screen-print or risograph texture, slight misregistration, halftone. Think classic Swiss and Saul Bass posters, modern Pentagram work.`;
    case "photo":
      return `AD STYLE — REALISTIC PHOTOGRAPHY. A photographic print ad shot like a real campaign: one strong photograph, art-directed, with real props, location and lighting. Think award-winning press ads, not stock imagery.`;
  }
}

// What makes an image read as an AI picture rather than a printed ad.
export function realismRules(style: AdStyle): string {
  if (style === "photo")
    return `REALISM (photo):
- Describe it as a real campaign shoot: camera body, lens (mm), aperture, film stock or sensor, the real lighting setup and modifiers, time of day, exact location and set dressing.
- Real-world imperfection: natural skin texture, stray hairs, creased fabric, a little everyday clutter, dust, slight vignetting, subtle grain, believable shadows, honest colour grading (no oversaturation, no HDR).
- Real-looking local people who fit the audience, ordinary body types, candid expressions; no stock-photo smiles.
- Products physically correct in scale, reflections and wear.
- Avoid: plastic/airbrushed skin, glossy CGI or 3D-render look, perfect symmetry, glowing rim light, fantasy haze, bokeh overload, impossible backgrounds, warped hands, "hyper-realistic" or "digital art" wording.`;
  return `REALISM (${style === "graphic" ? "graphic" : "typographic"}):
- It must look designed by a human art director and printed: a deliberate grid, consistent margins, considered kerning, a clear hierarchy.
- Print texture: uncoated paper grain, subtle ink spread${style === "graphic" ? ", screen-print/risograph texture, halftone dots, slight misregistration" : ""}.
- Limited, intentional palette from the brand colours; flat colour, no gradients.
- Avoid: glossy 3D, plastic shine, neon glow, lens flares, random decorative swirls, clip-art, "AI art" look, extra unrequested text, gibberish letters.`;
}

export const AD_LAYOUT_RULES = `PRINT AD LAYOUT (how real agency ads are built):
- One dominant element (the visual or the headline) taking 50–70% of the space; everything else is clearly secondary.
- Strong hierarchy: headline → visual → body copy → sign-off (logo + tagline, usually bottom right or bottom centre).
- Generous margins (at least 6% of the width) and lots of breathing room. Never fill every corner.
- Max two typefaces. Body copy small and short.`;

// Every run makes one creative of each kind, in this order.
export const CREATIVE_STYLES: AdStyle[] = ["typographic", "graphic", "photo"];

export function styleName(style: AdStyle) {
  return AD_STYLES.find((s) => s.id === style)!.name;
}

export function threeStylesGuide(): string {
  return CREATIVE_STYLES.map((st, i) => `Ad ${i + 1} — ${styleName(st).toUpperCase()}:\n${styleGuide(st)}`).join("\n\n");
}

export const FORMATS: { id: string; label: string; brief: string; aspect: number }[] = [
  { id: "feed", label: "4:5 feed (1080 × 1350)", brief: "a 4:5 vertical format, 1080 × 1350 pixels", aspect: 4 / 5 },
  { id: "portrait", label: "Portrait poster (2:3)", brief: "a 2:3 vertical poster format", aspect: 2 / 3 },
  { id: "square", label: "Square (1:1)", brief: "a 1:1 square format, 1080 × 1080 pixels", aspect: 1 },
  { id: "landscape", label: "Landscape (3:2)", brief: "a 3:2 horizontal format", aspect: 3 / 2 },
];

export function formatInfo(id: string) {
  return FORMATS.find((f) => f.id === id) ?? FORMATS[0];
}

export const CHANNELS = ["LinkedIn", "Instagram", "Facebook", "Newspaper / magazine print", "Outdoor hoarding", "WhatsApp & website"];
