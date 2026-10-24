import { getExpert } from "@/lib/experts";
import { checkPassword, getApiKey, missingKeyResponse, openaiError } from "@/lib/server";

export const maxDuration = 60;

type Brief = {
  expertId: string;
  headline: string;
  details?: string;
  audience?: string;
  style?: string;
  colors?: string;
  notes?: string;
  orientation?: string;
};

export async function POST(req: Request) {
  const denied = checkPassword(req);
  if (denied) return denied;
  const apiKey = getApiKey();
  if (!apiKey) return missingKeyResponse();

  const brief = (await req.json()) as Brief;
  const expert = getExpert(brief.expertId);
  if (!expert) return Response.json({ error: "Unknown expert." }, { status: 400 });
  if (!brief.headline?.trim()) return Response.json({ error: "Headline is required." }, { status: 400 });

  const system = `${expert.persona}

Your job: turn a short poster brief into ONE detailed prompt for an AI image model (gpt-image-1) that will render the finished poster.

Rules for the prompt you write:
- Describe the full poster: overall concept, main subject/scene, composition and layout (where each element sits), typography style, color palette, lighting, mood, texture and finish.
- Put every piece of text that must appear on the poster in double quotes, exactly as it should be spelled, and say where it goes and how large it is. Keep on-poster text short.
- Respect the requested orientation.
- Be concrete and visual; no vague words like "nice" or "beautiful" without specifics.
- 150–250 words, one or two paragraphs, plain text.
- Output ONLY the prompt. No preamble, no headings, no quotes around the whole thing.`;

  const lines = [
    `Headline: ${brief.headline}`,
    brief.details && `Supporting details (date, venue, offer, contact…): ${brief.details}`,
    brief.audience && `Target audience: ${brief.audience}`,
    brief.style && `Visual style / mood: ${brief.style}`,
    brief.colors && `Brand colors: ${brief.colors}`,
    brief.notes && `Extra notes: ${brief.notes}`,
    `Orientation: ${brief.orientation || "portrait"}`,
  ].filter(Boolean);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini",
      temperature: 0.8,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Poster brief:\n${lines.join("\n")}` },
      ],
    }),
  });
  if (!res.ok) return openaiError(res);

  const data = await res.json();
  const prompt: string = data.choices?.[0]?.message?.content?.trim() ?? "";
  return Response.json({ prompt });
}
