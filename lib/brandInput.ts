import type { BrandInput } from "./types";

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
