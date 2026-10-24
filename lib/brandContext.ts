import type { Brand, BrandStudy } from "./types";

const list = (a?: string[]) => (a ?? []).filter(Boolean).join("; ");

// Compact text description of a brand + its study, fed into creative prompts.
export function brandContext(b: Brand): string {
  const s = b.study;
  const lines = [
    `Brand: ${b.name}`,
    b.industry && `Industry: ${b.industry}`,
    b.location && `Market / location: ${b.location}`,
    b.description && `Client brief about the brand: ${b.description}`,
    b.website && `Website: ${b.website}`,
  ];
  if (s) {
    lines.push(
      `Summary: ${s.brandSummary}`,
      `Category: ${s.category}`,
      `Target audience: ${list(s.targetAudience)}`,
      `Brand personality: ${list(s.brandPersonality)}`,
      `Tone of voice: ${s.toneOfVoice}`,
      `Visual identity — colours: ${list(s.visualIdentity.colors)}; typography: ${s.visualIdentity.typography}; imagery: ${s.visualIdentity.imagery}`,
      `USPs: ${list(s.usp)}`,
      `Competitors: ${s.competitors.map((c) => `${c.name} — ${c.positioning} (communication: ${c.communicationStyle})`).join(" | ")}`,
      `Market gaps: ${list(s.marketGaps)}`,
      `Positioning opportunities: ${list(s.positioningOpportunities)}`,
      `Brand do's: ${list(s.dos)}`,
      `Brand don'ts: ${list(s.donts)}`,
    );
  }
  return lines.filter(Boolean).join("\n");
}

const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : JSON.stringify(x))) : typeof v === "string" && v ? [v] : [];
const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

// Makes the AI's JSON safe to render even if fields are missing or mistyped.
export function normalizeStudy(raw: Record<string, unknown>, usedWebSearch: boolean): BrandStudy {
  const vi = (raw.visualIdentity ?? {}) as Record<string, unknown>;
  const comps = Array.isArray(raw.competitors) ? (raw.competitors as Record<string, unknown>[]) : [];
  return {
    brandSummary: str(raw.brandSummary),
    category: str(raw.category),
    targetAudience: arr(raw.targetAudience),
    brandPersonality: arr(raw.brandPersonality),
    toneOfVoice: str(raw.toneOfVoice),
    visualIdentity: { colors: arr(vi.colors), typography: str(vi.typography), imagery: str(vi.imagery) },
    usp: arr(raw.usp),
    competitors: comps.map((c) => ({
      name: str(c.name),
      positioning: str(c.positioning),
      strengths: str(c.strengths),
      weaknesses: str(c.weaknesses),
      communicationStyle: str(c.communicationStyle),
    })),
    marketGaps: arr(raw.marketGaps),
    positioningOpportunities: arr(raw.positioningOpportunities),
    dos: arr(raw.dos),
    donts: arr(raw.donts),
    sources: arr(raw.sources),
    usedWebSearch,
    generatedAt: new Date().toISOString(),
  };
}
