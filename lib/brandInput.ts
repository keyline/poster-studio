import { normalizeStudy } from "./brandContext";
import { AppError } from "./openai";
import type { Brand, BrandInput, SourceNote } from "./types";

// Whitelists and trims the editable brand fields coming from the client.
export function pickInput(i: Partial<BrandInput>): BrandInput {
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return {
    name: s(i.name),
    industry: s(i.industry),
    location: s(i.location),
    description: s(i.description),
    website: s(i.website),
    facebook: s(i.facebook),
    instagram: s(i.instagram),
    otherLinks: s(i.otherLinks),
    competitorsHint: s(i.competitorsHint),
    logo: typeof i.logo === "string" && i.logo.startsWith("data:image/") ? i.logo : undefined,
  };
}

// Brands now travel with each request, so validate the whole object every time.
export function sanitizeBrand(raw: unknown): Brand {
  const b = (raw ?? {}) as Partial<Brand>;
  const input = pickInput(b);
  if (!input.name) throw new AppError("Brand name is required.", 400);
  if (typeof b.id !== "string" || !b.id) throw new AppError("Brand id is missing.", 400);
  const notes: SourceNote[] = Array.isArray(b.notes)
    ? b.notes
        .filter((n) => n && typeof n.text === "string")
        .map((n) => ({ id: String(n.id || crypto.randomUUID()), label: String(n.label || "Upload"), text: n.text.slice(0, 6000) }))
    : [];
  const now = new Date().toISOString();
  return {
    ...input,
    id: b.id,
    notes,
    study: b.study ? normalizeStudy(b.study as unknown as Record<string, unknown>, Boolean(b.study.usedWebSearch), b.study.generatedAt) : undefined,
    createdAt: typeof b.createdAt === "string" ? b.createdAt : now,
    updatedAt: typeof b.updatedAt === "string" ? b.updatedAt : now,
  };
}
