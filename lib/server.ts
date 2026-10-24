// Server-only helpers shared by the API routes.
import { AppError } from "./openai";

export function checkPassword(req: Request) {
  const required = process.env.APP_PASSWORD;
  if (required && req.headers.get("x-app-password") !== required) {
    throw new AppError("Wrong or missing team password.", 401);
  }
}

// Wraps a route handler with the password check and uniform JSON errors.
export function route<C>(handler: (req: Request, ctx: C) => Promise<unknown>) {
  return async (req: Request, ctx: C) => {
    try {
      checkPassword(req);
      return Response.json(await handler(req, ctx));
    } catch (e) {
      const status = e instanceof AppError ? e.status : 500;
      const message = e instanceof Error ? e.message : "Something went wrong.";
      if (status >= 500) console.error(e);
      return Response.json({ error: message }, { status });
    }
  };
}
