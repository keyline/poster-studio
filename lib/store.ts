import type { Brand } from "./types";

// Shared team storage: Upstash Redis (Vercel → Storage → Upstash for Redis).
// Without it the browser keeps brands itself (see lib/brandStore.ts).
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "poster-studio:brands";

export const isPersistent = Boolean(REDIS_URL && REDIS_TOKEN);

async function redis(command: string[]) {
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`Storage error: ${data.error || res.status}`);
  return data.result;
}

export async function listBrands(): Promise<Brand[]> {
  const brands = ((await redis(["HVALS", KEY])) as string[]).map((v) => JSON.parse(v) as Brand);
  return brands.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveBrand(brand: Brand): Promise<Brand> {
  await redis(["HSET", KEY, brand.id, JSON.stringify(brand)]);
  return brand;
}

export async function deleteBrand(id: string) {
  await redis(["HDEL", KEY, id]);
}
