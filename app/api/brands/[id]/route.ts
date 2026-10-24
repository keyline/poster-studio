import { sanitizeBrand } from "@/lib/brandInput";
import { AppError } from "@/lib/openai";
import { route } from "@/lib/server";
import { deleteBrand, isPersistent, saveBrand } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

function requireStorage() {
  if (!isPersistent) throw new AppError("Shared storage is not connected.", 409);
}

export const PUT = route(async (req, ctx: Ctx) => {
  requireStorage();
  const { brand: raw } = (await req.json()) as { brand: unknown };
  const brand = sanitizeBrand(raw);
  if (brand.id !== (await ctx.params).id) throw new AppError("Brand id mismatch.", 400);
  brand.updatedAt = new Date().toISOString();
  return { brand: await saveBrand(brand) };
});

export const DELETE = route(async (_req, ctx: Ctx) => {
  requireStorage();
  await deleteBrand((await ctx.params).id);
  return { ok: true };
});
