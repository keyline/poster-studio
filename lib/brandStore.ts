"use client";

import { api } from "./client";
import type { Brand } from "./types";

// Brands are saved to shared team storage (Upstash Redis) when the server has it,
// otherwise in this browser's IndexedDB so saving always works.

const DB_NAME = "poster-studio";
const STORE = "brands";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Browser storage is unavailable (private window?)."));
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Browser storage error."));
  });
}

export type StorageMode = "shared" | "browser";

export async function loadBrands(): Promise<{ brands: Brand[]; mode: StorageMode }> {
  const { brands, persistent } = await api<{ brands: Brand[]; persistent: boolean }>("/api/brands");
  if (persistent) return { brands, mode: "shared" };
  const local = await tx<Brand[]>("readonly", (s) => s.getAll() as IDBRequest<Brand[]>);
  return { brands: local.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), mode: "browser" };
}

export async function storeBrand(brand: Brand, mode: StorageMode): Promise<Brand> {
  const stamped = { ...brand, updatedAt: new Date().toISOString() };
  if (mode === "shared") return (await api<{ brand: Brand }>(`/api/brands/${brand.id}`, { brand: stamped }, "PUT")).brand;
  await tx("readwrite", (s) => s.put(stamped));
  return stamped;
}

export async function removeBrand(id: string, mode: StorageMode) {
  if (mode === "shared") await api(`/api/brands/${id}`, undefined, "DELETE");
  else await tx("readwrite", (s) => s.delete(id));
}

// What the AI endpoints need: everything except the (large) logo image.
export function forAi(brand: Brand) {
  return { ...brand, logo: undefined };
}
