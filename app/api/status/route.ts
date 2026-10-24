import { imageSettings } from "@/lib/openai";
import { route } from "@/lib/server";
import { isPersistent, listBrands } from "@/lib/store";

export const dynamic = "force-dynamic";

type Check = { name: string; ok: boolean; detail: string; fix?: string };

const BASE = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const VERCEL_ENV = "Vercel → your project → Settings → Environment Variables";
const REDEPLOY = "then Deployments → ⋯ → Redeploy.";

async function openaiError(res: Response) {
  const body = await res.json().catch(() => ({}));
  return { code: (body?.error?.code as string) || "", message: (body?.error?.message as string) || `HTTP ${res.status}` };
}

// Plain-language health check of everything the app depends on.
export const GET = route(async () => {
  const checks: Check[] = [];
  const key = process.env.OPENAI_API_KEY;
  const { model } = imageSettings();
  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  if (!key) {
    checks.push({
      name: "OpenAI key",
      ok: false,
      detail: "No OpenAI key has been added to the app.",
      fix: `In ${VERCEL_ENV}, add OPENAI_API_KEY with your key (starts with sk-), ${REDEPLOY}`,
    });
  } else {
    const models = await fetch(`${BASE}/models`, { headers, signal: AbortSignal.timeout(15000) }).catch(() => null);
    if (!models?.ok) {
      const err = models ? await openaiError(models) : { message: "Could not reach OpenAI." };
      checks.push({
        name: "OpenAI key",
        ok: false,
        detail: `OpenAI rejected the key: ${err.message}`,
        fix: `Create a new key at platform.openai.com/api-keys, replace OPENAI_API_KEY in ${VERCEL_ENV}, ${REDEPLOY} Make sure there are no spaces before or after the key.`,
      });
    } else {
      checks.push({ name: "OpenAI key", ok: true, detail: `Key accepted (…${key.slice(-4)}).` });

      const text = await fetch(`${BASE}/responses`, {
        method: "POST",
        signal: AbortSignal.timeout(30000),
        headers,
        body: JSON.stringify({ model: process.env.OPENAI_TEXT_MODEL || "gpt-4.1", input: "Reply with OK", max_output_tokens: 16 }),
      }).catch(() => null);
      if (text?.ok) {
        checks.push({ name: "OpenAI credit", ok: true, detail: "Test request succeeded, the account has credit." });
      } else {
        const err = text ? await openaiError(text) : { code: "", message: "OpenAI did not answer in time." };
        const noCredit = /quota|billing|credit/i.test(err.code + err.message);
        checks.push({
          name: "OpenAI credit",
          ok: false,
          detail: noCredit ? "The OpenAI account has no credit." : `Test request failed: ${err.message}`,
          fix: noCredit ? "Add credit at platform.openai.com → Settings → Billing (e.g. $10). It can take a few minutes to activate." : undefined,
        });
      }

      const ids: string[] = ((await models.json())?.data ?? []).map((m: { id: string }) => m.id);
      checks.push(
        ids.includes(model)
          ? { name: "Image model", ok: true, detail: `${model} is available.` }
          : {
              name: "Image model",
              ok: false,
              detail: `${model} is not listed for this OpenAI account, so posters will probably fail.`,
              fix: "On platform.openai.com go to Settings → Organization → Verify organization (image models are often locked until then). If it is verified, set OPENAI_IMAGE_MODEL in Vercel to an image model your account has.",
            },
      );
    }
  }

  if (isPersistent) {
    try {
      const n = (await listBrands()).length;
      checks.push({ name: "Team storage", ok: true, detail: `Redis connected, ${n} shared brand${n === 1 ? "" : "s"}.` });
    } catch (e) {
      checks.push({ name: "Team storage", ok: false, detail: (e as Error).message, fix: "Reconnect the Redis database in Vercel → Storage, then redeploy." });
    }
  } else {
    checks.push({
      name: "Team storage",
      ok: false,
      detail: "Not connected. Brands are saved in each person's browser only.",
      fix: `Vercel → Storage → connect a Redis database (Redis or Upstash for Redis) to this project, ${REDEPLOY}`,
    });
  }

  return { checks };
});
