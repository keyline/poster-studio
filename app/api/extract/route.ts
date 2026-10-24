import { AppError, respond, type Part } from "@/lib/openai";
import { route } from "@/lib/server";

export const maxDuration = 120;

const SYSTEM = `You are a brand strategist reviewing client material for an advertising agency.
Extract everything useful for a brand & competitor study and for designing ads:
brand name, products/services, offers and prices, claims, tone of voice, visual style (colours with approximate hex, typography, photography/illustration style), audience cues, content themes, engagement signals (followers, likes, comments), notable campaigns, contact details.
Be factual and concise. Bullet points, max 300 words. Do not invent anything not visible in the material.`;

export const POST = route(async (req) => {
  const { kind, label, dataUrl, filename } = (await req.json()) as {
    kind: "image" | "pdf";
    label: string;
    dataUrl: string;
    filename?: string;
  };
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) throw new AppError("No file received.", 400);

  const file: Part =
    kind === "pdf"
      ? { type: "input_file", filename: filename || "document.pdf", file_data: dataUrl }
      : { type: "input_image", image_url: dataUrl };

  const { text } = await respond({
    system: SYSTEM,
    content: [{ type: "input_text", text: `Material: ${label}${filename ? ` (${filename})` : ""}` }, file],
  });
  return { text };
});
