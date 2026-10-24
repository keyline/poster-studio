import { AppError, generateImage } from "@/lib/openai";
import { route } from "@/lib/server";

// High-quality images can take well over a minute.
export const maxDuration = 300;

// One image per request keeps responses under serverless body limits;
// the browser fires several requests in parallel.
export const POST = route(async (req) => {
  const { prompt, orientation, quality } = (await req.json()) as {
    prompt: string;
    orientation?: string;
    quality?: string;
  };
  if (!prompt?.trim()) throw new AppError("Prompt is required.", 400);
  return generateImage(prompt, orientation ?? "portrait", quality ?? "auto");
});
