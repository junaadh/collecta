import type { Context } from "hono";

export function getRequestMeta(c: Context) {
  return {
    ipAddress:
      c.req.header("X-Forward-For")?.split(",")[0]?.trim() ??
      c.req.header("X-Real-Ip") ??
      null,

    userAgent: c.req.header("User-Agent") ?? null,
  };
}
