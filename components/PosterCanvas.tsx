"use client";

import { useEffect, useRef } from "react";
import { canvasToJpeg, loadImage, saveBlob } from "@/lib/client";
import type { Layout } from "@/lib/types";

const FONTS = {
  serif: '"Playfair Display", Georgia, serif',
  sans: '"Inter", Helvetica, Arial, sans-serif',
  condensed: '"Oswald", "Arial Narrow", sans-serif',
};
const BODY_FONT = FONTS.sans;

export type Copy = { headline: string; subhead: string; cta: string; body?: string; tagline?: string };

type Box = { x: number; y: number; w: number; h: number };
type Line = { text: string; font: string; lead: number; alpha: number };

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
  }
  return lines;
}

function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}

let fontsReady: Promise<unknown> | null = null;
function ensureFonts() {
  fontsReady ??= Promise.all(
    ['700 40px "Playfair Display"', '700 40px "Oswald"', '700 40px "Inter"', '400 40px "Inter"', '600 40px "Inter"'].map((f) =>
      document.fonts.load(f),
    ),
  ).catch(() => null);
  return fontsReady;
}

// Draws the image to fill `box`, cropping from the side given by `keep` (the side that stays).
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, box: Box, keep: "top" | "bottom" | "left" | "right" | "center") {
  const s = Math.max(box.w / img.naturalWidth, box.h / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  let dx = box.x + (box.w - dw) / 2;
  let dy = box.y + (box.h - dh) / 2;
  if (keep === "top") dy = box.y;
  if (keep === "bottom") dy = box.y + box.h - dh;
  if (keep === "left") dx = box.x;
  if (keep === "right") dx = box.x + box.w - dw;
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// Headline, subhead and body copy as wrapped lines with their sizes.
function textBlock(ctx: CanvasRenderingContext2D, copy: Copy, layout: Layout, W: number, boxW: number, scale: number) {
  const hSize = Math.round(W * 0.078 * scale);
  const sSize = Math.round(W * 0.03 * scale);
  const bSize = Math.round(W * 0.024 * scale);
  const headline = layout.font === "condensed" ? copy.headline.toUpperCase() : copy.headline;
  const hFont = `700 ${hSize}px ${FONTS[layout.font]}`;
  const sFont = `500 ${sSize}px ${BODY_FONT}`;
  const bFont = `400 ${bSize}px ${BODY_FONT}`;
  const lines: Line[] = [];
  const gaps: number[] = [];
  const add = (text: string, font: string, lead: number, alpha: number, maxW: number) => {
    ctx.font = font;
    for (const t of wrap(ctx, text, maxW)) lines.push({ text: t, font, lead, alpha });
  };
  add(headline, hFont, hSize * (layout.font === "condensed" ? 1.02 : 1.1), 1, boxW);
  if (copy.subhead) {
    gaps[lines.length] = hSize * 0.4;
    add(copy.subhead, sFont, sSize * 1.38, 0.95, boxW);
  }
  if (copy.body) {
    gaps[lines.length] = sSize * 0.75;
    add(copy.body, bFont, bSize * 1.5, 0.85, Math.min(boxW, W * 0.7));
  }
  const height = lines.reduce((h, l, i) => h + (gaps[i] ?? 0) + l.lead, 0);
  return { lines, gaps, height, ctaSize: Math.round(W * 0.026 * scale) };
}

function drawBlock(ctx: CanvasRenderingContext2D, block: ReturnType<typeof textBlock>, x: number, y: number, ink: string, center: boolean) {
  ctx.textAlign = center ? "center" : "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = ink;
  block.lines.forEach((l, i) => {
    y += block.gaps[i] ?? 0;
    ctx.font = l.font;
    ctx.globalAlpha = l.alpha;
    ctx.fillText(l.text, x, y);
    y += l.lead;
  });
  ctx.globalAlpha = 1;
  return y;
}

function ctaSize(ctx: CanvasRenderingContext2D, text: string, size: number) {
  ctx.font = `600 ${size}px ${BODY_FONT}`;
  return { w: ctx.measureText(text).width + size * 2, h: size * 2.3 };
}

function drawCta(ctx: CanvasRenderingContext2D, text: string, size: number, x: number, y: number, accent: string) {
  const { w, h } = ctaSize(ctx, text, size);
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = isLight(accent) ? "#141414" : "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
}

// Logo with the tagline beneath; returns its size so callers can reserve room for it.
function signOff(ctx: CanvasRenderingContext2D, logo: HTMLImageElement | null, tagline: string, W: number, H: number) {
  let lw = 0;
  let lh = 0;
  if (logo) {
    lw = W * 0.17;
    lh = (lw * logo.naturalHeight) / logo.naturalWidth;
    if (lh > H * 0.07) {
      lh = H * 0.07;
      lw = (lh * logo.naturalWidth) / logo.naturalHeight;
    }
  }
  const tSize = Math.round(W * 0.019);
  ctx.font = `500 ${tSize}px ${BODY_FONT}`;
  const tw = tagline ? ctx.measureText(tagline).width : 0;
  const tH = tagline ? tSize * 1.6 : 0;
  return {
    w: Math.max(lw, tw),
    h: lh + tH,
    draw(x: number, y: number, alignRight: boolean, ink: string, shadow: boolean) {
      if (logo) ctx.drawImage(logo, alignRight ? x - lw : x, y, lw, lh);
      if (!tagline) return;
      ctx.font = `500 ${tSize}px ${BODY_FONT}`;
      ctx.textAlign = alignRight ? "right" : "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = ink;
      if (shadow) {
        ctx.shadowColor = ink === "#ffffff" ? "rgba(0,0,0,.45)" : "rgba(255,255,255,.5)";
        ctx.shadowBlur = tSize * 0.6;
      }
      ctx.fillText(tagline, x, y + lh + tSize * 0.4);
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
    },
  };
}

// Lays out the full ad: picture, headline, subhead, body copy, CTA and logo sign-off.
async function draw(canvas: HTMLCanvasElement, src: string, copy: Copy, layout: Layout, showText: boolean, logoSrc?: string) {
  const [img] = await Promise.all([loadImage(src), ensureFonts()]);
  const logo = logoSrc ? await loadImage(logoSrc).catch(() => null) : null;
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const { position, tone, accent } = layout;
  const pad = Math.round(W * 0.07);
  const ink = tone === "light" ? "#ffffff" : "#141414";
  const tagline = showText ? copy.tagline?.trim() ?? "" : "";
  const sign = signOff(ctx, logo, tagline, W, H);
  const hasCopy = showText && Boolean(copy.headline || copy.subhead || copy.body || copy.cta);

  // Copy panel: a solid block beside or below the picture, as in a classic press ad.
  if (hasCopy && layout.panel !== false && position !== "center") {
    const paper = tone === "light" ? "#16140f" : "#f4efe6";
    const side = position === "left" || position === "right";
    const block = textBlock(ctx, copy, layout, W, side ? W * 0.42 - pad * 1.2 : W - pad * 2, side ? 0.78 : 0.9);
    const cta = copy.cta ? ctaSize(ctx, copy.cta, block.ctaSize) : { w: 0, h: 0 };
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, W, H);

    if (side) {
      const pw = W * 0.42;
      const px = position === "left" ? 0 : W - pw;
      drawCover(ctx, img, { x: position === "left" ? pw : 0, y: 0, w: W - pw, h: H }, position === "left" ? "right" : "left");
      const x = px + pad * 0.6;
      drawBlock(ctx, block, x, pad, ink, false);
      let fy = H - pad * 0.8 - sign.h;
      sign.draw(x, fy, false, ink, false);
      if (copy.cta) drawCta(ctx, copy.cta, block.ctaSize, x, (fy -= cta.h + pad * 0.5), accent);
    } else {
      const footer = Math.max(cta.h, sign.h);
      const ph = Math.min(H * 0.62, Math.max(H * 0.3, pad * 1.8 + block.height + pad * 0.6 + footer));
      const py = position === "bottom" ? H - ph : 0;
      drawCover(ctx, img, { x: 0, y: position === "bottom" ? 0 : ph, w: W, h: H - ph }, position === "bottom" ? "top" : "bottom");
      drawBlock(ctx, block, pad, py + pad, ink, false);
      const fy = py + ph - pad * 0.8 - footer;
      if (copy.cta) drawCta(ctx, copy.cta, block.ctaSize, pad, fy + (footer - cta.h) / 2, accent);
      sign.draw(W - pad, fy + (footer - sign.h) / 2, true, ink, false);
    }
    return;
  }

  // Copy over the picture, on a soft scrim.
  ctx.drawImage(img, 0, 0);
  if (hasCopy) {
    const side = position === "left" || position === "right";
    const center = position === "center";
    const boxW = side ? W * 0.5 - pad * 1.5 : W - pad * 2;
    const x0 = position === "right" ? W * 0.5 + pad * 0.5 : pad;
    const block = textBlock(ctx, copy, layout, W, boxW, side ? 0.82 : 1);
    const cta = copy.cta ? ctaSize(ctx, copy.cta, block.ctaSize) : { w: 0, h: 0 };
    const total = block.height + (copy.cta ? block.ctaSize * 1.2 + cta.h : 0);
    const y0 = position === "top" ? pad : position === "bottom" ? H - pad - total : Math.max(pad, (H - total) / 2);

    const shade = tone === "light" ? "0,0,0" : "255,255,255";
    let g: CanvasGradient;
    if (position === "top") g = ctx.createLinearGradient(0, 0, 0, y0 + total + pad * 2);
    else if (position === "bottom") g = ctx.createLinearGradient(0, H, 0, y0 - pad * 2);
    else if (position === "left") g = ctx.createLinearGradient(0, 0, x0 + boxW + pad * 2, 0);
    else if (position === "right") g = ctx.createLinearGradient(W, 0, x0 - pad * 2, 0);
    else g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
    g.addColorStop(0, `rgba(${shade},${center ? 0.4 : 0.6})`);
    g.addColorStop(1, `rgba(${shade},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const y = drawBlock(ctx, block, center ? W / 2 : x0, y0, ink, center);
    if (copy.cta) drawCta(ctx, copy.cta, block.ctaSize, center ? W / 2 - cta.w / 2 : x0, y + block.ctaSize * 1.2, accent);
  }

  // Sign-off in the corner furthest from the copy.
  if (sign.h) {
    const m = W * 0.05;
    const bottom = !hasCopy || position === "top" || position === "left" || position === "right";
    const right = !(hasCopy && position === "right");
    sign.draw(right ? W - m : m, bottom ? H - m - sign.h : m, right, ink, true);
  }
}

export default function PosterCanvas(props: {
  src: string;
  copy: Copy;
  layout: Layout;
  showText: boolean;
  logo?: string;
  filename: string;
  onCanvas?: (canvas: HTMLCanvasElement | null) => void; // lets the page export all posters at once
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { src, copy, layout, showText, logo, onCanvas } = props;

  useEffect(() => {
    onCanvas?.(ref.current);
    return () => onCanvas?.(null);
  }, [onCanvas]);

  useEffect(() => {
    if (ref.current) draw(ref.current, src, copy, layout, showText, logo).catch(() => {});
  }, [src, copy.headline, copy.subhead, copy.cta, copy.body, copy.tagline, layout.position, layout.tone, layout.accent, layout.font, layout.panel, showText, logo]); // eslint-disable-line react-hooks/exhaustive-deps

  function download() {
    if (ref.current) canvasToJpeg(ref.current).then((b) => saveBlob(b, props.filename), () => {});
  }

  return (
    <div className="poster-canvas">
      <canvas ref={ref} />
      <button className="btn small" type="button" onClick={download}>
        Download poster
      </button>
    </div>
  );
}
