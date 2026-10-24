import { imageSettings } from "@/lib/openai";
import { route } from "@/lib/server";

export const dynamic = "force-dynamic";

export const GET = route(async () => imageSettings());
