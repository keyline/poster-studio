import { imageSettings } from "@/lib/openai";
import { route } from "@/lib/server";
import { isPersistent } from "@/lib/store";

export const dynamic = "force-dynamic";

export const GET = route(async () => ({
  ...imageSettings(),
  openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
  sharedStorage: isPersistent,
}));
