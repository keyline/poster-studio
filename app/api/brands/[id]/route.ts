import { AppError } from "@/lib/openai";
import { pickInput } from "@/lib/brandInput";
import { route } from "@/lib/server";
import { deleteBrand, getBrand, saveBrand } from "@/lib/store";
import type { BrandInput, SourceNote } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

async function load(ctx: Ctx) {
  const brand = await getBrand((await ctx.params).id);
  if (!brand) throw new AppError("Brand not found.", 404);
  return brand;
}

export const GET = route(async (_req, ctx: Ctx) => ({ brand: await load(ctx) }));

// Updates details and/or replaces the list of source notes (uploads already analysed).
export const PUT = route(async (req, ctx: Ctx) => {
  const brand = await load(ctx);
  const body = (await req.json()) as Partial<BrandInput> & { notes?: SourceNote[]; details?: boolean };
  if (body.details) {
    const input = pickInput(body);
    if (!input.name) throw new AppError("Brand name is required.", 400);
    Object.assign(brand, input, { logo: input.logo ?? (body.logo === null ? undefined : brand.logo) });
  }
  if (Array.isArray(body.notes)) {
    brand.notes = body.notes
      .filter((n) => n && typeof n.text === "string")
      .map((n) => ({ id: n.id || crypto.randomUUID(), label: String(n.label || "Upload"), text: n.text.slice(0, 6000) }));
  }
  return { brand: await saveBrand(brand) };
});

export const DELETE = route(async (_req, ctx: Ctx) => {
  await deleteBrand((await ctx.params).id);
  return { ok: true };
});
