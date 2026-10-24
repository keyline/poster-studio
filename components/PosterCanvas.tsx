"use client";

import { useEffect, useRef } from "react";
import { loadImage } from "@/lib/client";
import type { Layout } from "@/lib/types";

const FONTS = {
  serif: '"Playfair Display", Georgia, serif',
  sans: '"Inter", Helvetica, Arial, sans-serif',
  condensed: '"Oswald", "Arial Narrow", sans-serif',
};
const BODY_FONT = FONTS.sans;

export type Copy = { headline: string; subhead: string; cta: string; body?: string; tagline?: string };

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

// Typesets the copy over the photograph the way an art director would in a layout tool,
// so the lettering is crisp and real rather than AI-rendered.
async function draw(
  canvas: HTMLCanvasElement,
  src: string,
  copy: Copy,
  layout: Layout,
  showText: boolean,
  logo?: string,
) {
  const [img] = await Promise.all([loadImage(src), ensureFonts()]);
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const { position, tone, accent, font } = layout;
  const pad = Math.round(W * 0.07);

  if (showText && (copy.headline || copy.subhead || copy.cta)) {
    const side = position === "left" || position === "right";
    const center = position === "center";
    const boxW = side ? W * 0.5 - pad * 1.5 : W - pad * 2;
    const x0 = position === "right" ? W * 0.5 + pad * 0.5 : pad;
    const tx = center ? W / 2 : x0;
    ctx.textAlign = center ? "center" : "left";
    ctx.textBaseline = "top";

    const hSize = Math.round(W * (side ? 0.064 : 0.078));
    const sSize = Math.round(W * 0.03);
    const cSize = Math.round(W * 0.026);
    const headline = font === "condensed" ? copy.headline.toUpperCase() : copy.headline;
    const hFont = `700 ${hSize}px ${FONTS[font]}`;
    const sFont = `400 ${sSize}px ${BODY_FONT}`;
    const cFont = `600 ${cSize}px ${BODY_FONT}`;
    const bSize = Math.round(W * 0.021);
    const bFont = `400 ${bSize}px ${BODY_FONT}`;

    ctx.font = hFont;
    const hLines = wrap(ctx, headline, boxW);
    ctx.font = sFont;
    const sLines = copy.subhead ? wrap(ctx, copy.subhead, boxW) : [];
    ctx.font = bFont;
    const bLines = copy.body ? wrap(ctx, copy.body, Math.min(boxW, W * 0.62)) : [];
    const bLead = bSize * 1.5;
    const gapB = bLines.length ? sSize * 0.7 : 0;
    const hLead = hSize * (font === "condensed" ? 1.02 : 1.1);
    const sLead = sSize * 1.4;
    const gap1 = sLines.length ? hSize * 0.45 : 0;
    const ctaH = copy.cta ? cSize * 2.3 : 0;
    const gap2 = copy.cta ? sSize * 1.1 : 0;
    const total = hLines.length * hLead + gap1 + sLines.length * sLead + gapB + bLines.length * bLead + gap2 + ctaH;

    const y0 =
      position === "top" ? pad : position === "bottom" ? H - pad - total : Math.max(pad, (H - total) / 2);

    // Soft scrim so type stays legible without looking like a template box.
    const shade = tone === "light" ? "0,0,0" : "255,255,255";
    let g: CanvasGradient;
    if (position === "top") g = ctx.createLinearGradient(0, 0, 0, y0 + total + pad * 2);
    else if (position === "bottom") g = ctx.createLinearGradient(0, H, 0, y0 - pad * 2);
    else if (position === "left") g = ctx.createLinearGradient(0, 0, x0 + boxW + pad * 2, 0);
    else if (position === "right") g = ctx.createLinearGradient(W, 0, x0 - pad * 2, 0);
    else g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
    g.addColorStop(0, `rgba(${shade},${center ? 0.35 : 0.5})`);
    g.addColorStop(1, `rgba(${shade},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const ink = tone === "light" ? "#ffffff" : "#141414";
    let y = y0;
    ctx.fillStyle = ink;
    ctx.font = hFont;
    for (const line of hLines) {
      ctx.fillText(line, tx, y);
      y += hLead;
    }
    y += gap1;
    ctx.font = sFont;
    ctx.globalAlpha = 0.92;
    for (const line of sLines) {
      ctx.fillText(line, tx, y);
      y += sLead;
    }
    y += gapB;
    ctx.font = bFont;
    ctx.globalAlpha = 0.85;
    for (const line of bLines) {
      ctx.fillText(line, tx, y);
      y += bLead;
    }
    ctx.globalAlpha = 1;
    y += gap2;

    if (copy.cta) {
      ctx.font = cFont;
      const pw = ctx.measureText(copy.cta).width + cSize * 2;
      const px = center ? W / 2 - pw / 2 : x0;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.roundRect(px, y, pw, ctaH, ctaH / 2);
      ctx.fill();
      ctx.fillStyle = isLight(accent) ? "#141414" : "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(copy.cta, px + pw / 2, y + ctaH / 2 + 1);
    }
  }

  // Sign-off: logo with the tagline beneath, in the corner furthest from the type.
  const tagline = showText ? copy.tagline?.trim() : "";
  const l = logo ? await loadImage(logo).catch(() => null) : null;
  if (l || tagline) {
    const m = W * 0.05;
    const bottom = !showText || position === "top" || position === "left" || position === "right";
    const right = !(showText && position === "right");
    let lw = 0;
    let lh = 0;
    if (l) {
      lw = W * 0.16;
      lh = (lw * l.naturalHeight) / l.naturalWidth;
      if (lh > H * 0.08) {
        lh = H * 0.08;
        lw = (lh * l.naturalWidth) / l.naturalHeight;
      }
    }
    const tSize = Math.round(W * 0.019);
    const tH = tagline ? tSize * 1.6 : 0;
    const blockH = lh + tH;
    const top = bottom ? H - m - blockH : m;
    if (l) ctx.drawImage(l, right ? W - m - lw : m, top, lw, lh);
    if (tagline) {
      ctx.font = `500 ${tSize}px ${BODY_FONT}`;
      ctx.textAlign = right ? "right" : "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = tone === "light" ? "#ffffff" : "#141414";
      ctx.shadowColor = tone === "light" ? "rgba(0,0,0,.45)" : "rgba(255,255,255,.5)";
      ctx.shadowBlur = tSize * 0.6;
      ctx.fillText(tagline, right ? W - m : m, top + lh + tSize * 0.4);
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
    }
  }
}

export default function PosterCanvas(props: {
  src: string;
  copy: Copy;
  layout: Layout;
  showText: boolean;
  logo?: string;
  filename: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { src, copy, layout, showText, logo } = props;

  useEffect(() => {
    if (ref.current) draw(ref.current, src, copy, layout, showText, logo).catch(() => {});
  }, [src, copy.headline, copy.subhead, copy.cta, copy.body, copy.tagline, layout.position, layout.tone, layout.accent, layout.font, showText, logo]); // eslint-disable-line react-hooks/exhaustive-deps

  function download() {
    ref.current?.toBlob(
      (blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = props.filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      },
      "image/jpeg",
      0.95,
    );
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
