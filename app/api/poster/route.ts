import { checkPassword, getApiKey, missingKeyResponse, openaiError } from "@/lib/server";

// Image generation can take a while; allow up to 2 minutes where the host permits.
export const maxDuration = 120;

const SIZES: Record<string, string> = {
  portrait: "1024x1536",
  square: "1024x1024",
  landscape: "1536x1024",
};
const QUALITIES = ["low", "medium", "high"];

export async function POST(req: Request) {
  const denied = checkPassword(req);
  if (denied) return denied;
  const apiKey = getApiKey();
  if (!apiKey) return missingKeyResponse();

  // One image per request keeps responses under serverless body limits;
  // the browser fires several requests in parallel for variations.
  const { prompt, orientation, quality } = (await req.json()) as {
    prompt: string;
    orientation?: string;
    quality?: string;
  };
  if (!prompt?.trim()) return Response.json({ error: "Prompt is required." }, { status: 400 });

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt,
      size: SIZES[orientation ?? ""] ?? SIZES.portrait,
      quality: QUALITIES.includes(quality ?? "") ? quality : "medium",
      n: 1,
      output_format: "jpeg",
      output_compression: 90,
    }),
  });
  if (!res.ok) return openaiError(res);

  const data = await res.json();
  const item = data.data?.[0];
  const image = item?.b64_json ? `data:image/jpeg;base64,${item.b64_json}` : item?.url;
  if (!image) return Response.json({ error: "No image returned." }, { status: 502 });
  return Response.json({ image });
}
