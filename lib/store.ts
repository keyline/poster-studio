import { promises as fs } from "fs";
import path from "path";
import type { Brand } from "./types";

// Brands live in Upstash Redis when it is connected (Vercel → Storage → Upstash),
// otherwise in a local JSON file (fine for local dev, NOT persistent on Vercel).
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "poster-studio:brands";
const FILE = process.env.VERCEL
  ? "/tmp/poster-studio-brands.json"
  : path.join(process.cwd(), ".data", "brands.json");

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

async function readFile(): Promise<Record<string, Brand>> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return {};
  }
}

async function writeFile(all: Record<string, Brand>) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(all));
}

export async function listBrands(): Promise<Brand[]> {
  const brands: Brand[] = isPersistent
    ? ((await redis(["HVALS", KEY])) as string[]).map((v) => JSON.parse(v))
    : Object.values(await readFile());
  return brands.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getBrand(id: string): Promise<Brand | null> {
  if (isPersistent) {
    const v = (await redis(["HGET", KEY, id])) as string | null;
    return v ? JSON.parse(v) : null;
  }
  return (await readFile())[id] ?? null;
}

export async function saveBrand(brand: Brand): Promise<Brand> {
  brand.updatedAt = new Date().toISOString();
  if (isPersistent) {
    await redis(["HSET", KEY, brand.id, JSON.stringify(brand)]);
  } else {
    const all = await readFile();
    all[brand.id] = brand;
    await writeFile(all);
  }
  return brand;
}

export async function deleteBrand(id: string) {
  if (isPersistent) {
    await redis(["HDEL", KEY, id]);
  } else {
    const all = await readFile();
    delete all[id];
    await writeFile(all);
  }
}
