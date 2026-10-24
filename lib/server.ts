// Server-only helpers shared by the API routes.

export function checkPassword(req: Request): Response | null {
  const required = process.env.APP_PASSWORD;
  if (!required) return null;
  if (req.headers.get("x-app-password") === required) return null;
  return Response.json({ error: "Wrong or missing team password." }, { status: 401 });
}

export function getApiKey(): string | null {
  return process.env.OPENAI_API_KEY || null;
}

export function missingKeyResponse(): Response {
  return Response.json(
    { error: "OPENAI_API_KEY is not set on the server. Add it to your environment variables." },
    { status: 500 },
  );
}

export async function openaiError(res: Response): Promise<Response> {
  let message = `OpenAI request failed (${res.status})`;
  try {
    const body = await res.json();
    if (body?.error?.message) message = body.error.message;
  } catch {}
  return Response.json({ error: message }, { status: res.status === 401 ? 500 : res.status });
}
