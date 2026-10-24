import { DEFAULT_IMAGE_MODEL, DEFAULT_MAX_COST, QUALITIES, allowed, bestQualityWithin, estimateCost, type Quality } from "./imageCost";

// Thin wrapper around the OpenAI Responses API (text, images, PDFs, web search).

export class AppError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

export type Part =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string }
  | { type: "input_file"; filename: string; file_data: string };

const BASE = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

function apiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new AppError("OPENAI_API_KEY is not set on the server. Add it to your environment variables.");
  return key;
}

async function errorMessage(res: Response) {
  try {
    const body = await res.json();
    if (body?.error?.message) return body.error.message as string;
  } catch {}
  return `OpenAI request failed (${res.status})`;
}

function outputText(data: {
  output_text?: string;
  output?: { type: string; content?: { type: string; text?: string }[] }[];
}): string {
  if (typeof data.output_text === "string") return data.output_text;
  return (data.output ?? [])
    .filter((o) => o.type === "message")
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text ?? "")
    .join("\n");
}

export async function respond(opts: {
  system: string;
  content: string | Part[];
  json?: boolean;
  webSearch?: boolean;
}): Promise<{ text: string; usedWebSearch: boolean }> {
  const content: Part[] =
    typeof opts.content === "string" ? [{ type: "input_text", text: opts.content }] : opts.content;

  const call = async (webSearch: boolean) =>
    fetch(`${BASE}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey()}` },
      body: JSON.stringify({
        model: process.env.OPENAI_TEXT_MODEL || "gpt-4.1",
        instructions: opts.system,
        input: [{ role: "user", content }],
        ...(webSearch ? { tools: [{ type: "web_search" }] } : {}),
        ...(opts.json && !webSearch ? { text: { format: { type: "json_object" } } } : {}),
      }),
    });

  let usedWebSearch = Boolean(opts.webSearch);
  let res = await call(usedWebSearch);
  // Some models/accounts don't support the web search tool — fall back to model knowledge.
  if (!res.ok && usedWebSearch && res.status === 400) {
    usedWebSearch = false;
    res = await call(false);
  }
  if (!res.ok) throw new AppError(await errorMessage(res), res.status === 401 ? 500 : res.status);

  return { text: outputText(await res.json()).trim(), usedWebSearch };
}

export function parseJson<T>(text: string): T {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {}
    }
    throw new AppError("The AI returned an unexpected format. Please try again.", 502);
  }
}

const SIZES: Record<string, string> = {
  portrait: "1024x1536",
  square: "1024x1024",
  landscape: "1536x1024",
};

export function imageSettings() {
  const max = Number(process.env.MAX_IMAGE_COST_USD);
  return {
    model: process.env.OPENAI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL,
    maxCost: Number.isFinite(max) && max > 0 ? max : DEFAULT_MAX_COST,
  };
}

// The budget is enforced here, on the server: a quality that would cost more than
// MAX_IMAGE_COST_USD is automatically lowered to the best one that fits.
export async function generateImage(prompt: string, orientation: string, requested: string) {
  const { model, maxCost } = imageSettings();
  const quality =
    QUALITIES.includes(requested as Quality) && allowed(model, orientation, requested as Quality, maxCost)
      ? (requested as Quality)
      : bestQualityWithin(model, orientation, maxCost);

  const res = await fetch(`${BASE}/images/generations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey()}` },
    body: JSON.stringify({
      model,
      prompt,
      size: SIZES[orientation] ?? SIZES.portrait,
      quality,
      n: 1,
      output_format: "jpeg",
      output_compression: 92,
    }),
  });
  if (!res.ok) {
    let message = await errorMessage(res);
    if (/model|deprecat|not found|does not exist/i.test(message)) {
      message += ` (Image model "${model}". Set OPENAI_IMAGE_MODEL in Vercel to a current OpenAI image model.)`;
    }
    throw new AppError(message, res.status === 401 ? 500 : res.status);
  }
  const data = await res.json();
  const item = data.data?.[0];
  const image = item?.b64_json ? `data:image/jpeg;base64,${item.b64_json}` : item?.url;
  if (!image) throw new AppError("No image returned.", 502);
  return { image, quality, estimatedCost: estimateCost(model, orientation, quality) };
}
