import type { MiddlewareHandler } from "hono";
import type { AuthRole } from "../lib/auth";
import type { AppBindings } from "../types/hono";
import { fail } from "../lib/responses";

export function requireRole(role: AuthRole): MiddlewareHandler<AppBindings> {
  return async (c, next) => {
    const user = c.get("user");

    if (user.role != role) {
      return c.json(fail(403, "Forbidden"), 403);
    }

    await next();
  };
}
