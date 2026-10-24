import { AppError } from "@/lib/openai";
import { route } from "@/lib/server";
import { isPersistent, listBrands, saveBrand } from "@/lib/store";
import { pickInput } from "@/lib/brandInput";
import type { Brand, BrandInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = route(async () => ({ brands: await listBrands(), persistent: isPersistent }));

export const POST = route(async (req) => {
  const input = (await req.json()) as BrandInput;
  if (!input.name?.trim()) throw new AppError("Brand name is required.", 400);
  const now = new Date().toISOString();
  const brand: Brand = { ...pickInput(input), id: crypto.randomUUID(), notes: [], createdAt: now, updatedAt: now };
  return { brand: await saveBrand(brand) };
});
