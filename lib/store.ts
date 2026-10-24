import { createClient } from "redis";
import type { Brand } from "./types";

// Shared team storage. Works with either kind of Redis Vercel can connect:
// - Upstash (REST): KV_REST_API_URL + KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_*)
// - Redis / Redis Cloud (TCP): REDIS_URL
// Without either, the browser keeps brands itself (see lib/brandStore.ts).
const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_URL = process.env.REDIS_URL || process.env.KV_URL;
const KEY = "poster-studio:brands";

export const isPersistent = Boolean((REST_URL && REST_TOKEN) || REDIS_URL);

async function rest(command: string[]) {
  const res = await fetch(REST_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REST_TOKEN}` },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`Storage error: ${data.error || res.status}`);
  return data.result;
}

async function connect() {
  const c = createClient({ url: REDIS_URL, socket: { connectTimeout: 10000 } });
  c.on("error", (e) => console.error("Redis error", e));
  await c.connect();
  return c;
}

// One connection per server instance, reused across requests.
let client: ReturnType<typeof connect> | null = null;
function tcp(): ReturnType<typeof connect> {
  client ??= connect().catch((e) => {
    client = null;
    throw new Error(`Storage error: could not connect to Redis (${(e as Error).message})`);
  });
  return client;
}

async function hvals(): Promise<string[]> {
  return REST_URL && REST_TOKEN ? rest(["HVALS", KEY]) : (await tcp()).hVals(KEY);
}

export async function listBrands(): Promise<Brand[]> {
  const brands = (await hvals()).map((v) => JSON.parse(v) as Brand);
  return brands.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveBrand(brand: Brand): Promise<Brand> {
  const value = JSON.stringify(brand);
  if (REST_URL && REST_TOKEN) await rest(["HSET", KEY, brand.id, value]);
  else await (await tcp()).hSet(KEY, brand.id, value);
  return brand;
}

export async function deleteBrand(id: string) {
  if (REST_URL && REST_TOKEN) await rest(["HDEL", KEY, id]);
  else await (await tcp()).hDel(KEY, id);
}
