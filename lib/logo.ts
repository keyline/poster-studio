"use client";

// Logo handling for the poster typesetter: removes a plain background box,
// measures the logo's brightness, and recolours it when asked.

export type LogoStyle = "auto" | "original" | "white" | "black" | "badge";

export type PreparedLogo = {
  canvas: HTMLCanvasElement; // transparent version
  w: number;
  h: number;
  luminance: number; // 0 (black) … 1 (white), average of visible pixels
  samples: number[]; // brightness of a sample of the logo's "ink" pixels, to judge contrast against any background
  hadBackground: boolean;
};

const cache = new Map<string, PreparedLogo>();

const lum = (r: number, g: number, b: number) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

export function prepareLogo(img: HTMLImageElement, key: string): PreparedLogo {
  const cached = cache.get(key);
  if (cached) return cached;

  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  const at = (x: number, y: number) => (y * w + x) * 4;

  // A logo "has a background" when its four corners are opaque and the same colour.
  const corners = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)];
  const [r0, g0, b0] = [px[corners[0]], px[corners[0] + 1], px[corners[0] + 2]];
  const dist = (i: number) => Math.abs(px[i] - r0) + Math.abs(px[i + 1] - g0) + Math.abs(px[i + 2] - b0);
  const hadBackground = corners.every((i) => px[i + 3] > 245 && dist(i) < 30);

  if (hadBackground) {
    // Flood-fill from the edges so background-coloured areas inside the logo are kept.
    const HARD = 40;
    const SOFT = 90;
    const seen = new Uint8Array(w * h);
    const stack: number[] = [];
    for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
    for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
    while (stack.length) {
      const p = stack.pop()!;
      if (seen[p]) continue;
      seen[p] = 1;
      const i = p * 4;
      const d = dist(i);
      if (d >= SOFT) continue;
      // Fully clear near the background colour, feather the anti-aliased edge.
      px[i + 3] = d < HARD ? 0 : Math.round((px[i + 3] * (d - HARD)) / (SOFT - HARD));
      if (d >= HARD) continue;
      const x = p % w;
      if (x > 0) stack.push(p - 1);
      if (x < w - 1) stack.push(p + 1);
      if (p >= w) stack.push(p - w);
      if (p < w * (h - 1)) stack.push(p + w);
    }
    ctx.putImageData(data, 0, 0);
  }

  let sum = 0;
  let weight = 0;
  const visible: number[] = [];
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3] / 255;
    if (a < 0.5) continue;
    const l = lum(px[i], px[i + 1], px[i + 2]);
    sum += l * a;
    weight += a;
    // Areas in the logo's own background colour (e.g. a white centre) are not ink.
    if (!hadBackground || dist(i) > 45) visible.push(l);
  }
  const step = Math.max(1, Math.floor(visible.length / 3000));
  const samples = visible.filter((_, i) => i % step === 0);

  const prepared = { canvas, w, h, luminance: weight ? sum / weight : 0.5, samples, hadBackground };
  cache.set(key, prepared);
  return prepared;
}

// One-colour version of the logo (keeps its shape and transparency).
export function tintLogo(logo: PreparedLogo, color: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = logo.w;
  c.height = logo.h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(logo.canvas, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, logo.w, logo.h);
  return c;
}

// Average brightness of an area of the canvas (what the logo will sit on).
export function areaLuminance(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): number {
  const sx = Math.max(0, Math.floor(x));
  const sy = Math.max(0, Math.floor(y));
  const sw = Math.max(1, Math.min(ctx.canvas.width - sx, Math.ceil(w)));
  const sh = Math.max(1, Math.min(ctx.canvas.height - sy, Math.ceil(h)));
  const px = ctx.getImageData(sx, sy, sw, sh).data;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < px.length; i += 16) {
    sum += lum(px[i], px[i + 1], px[i + 2]);
    n++;
  }
  return n ? sum / n : 0.5;
}

// Share of the logo that would blend into a background of the given brightness.
export function blendShare(logo: PreparedLogo, background: number): number {
  if (!logo.samples.length) return 0;
  return logo.samples.filter((l) => Math.abs(l - background) < 0.25).length / logo.samples.length;
}
