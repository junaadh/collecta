import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

import type { AppBindings } from "../types/hono";
import { requireAuth } from "../middleware/require-auth";
import { subscribe } from "../lib/events";

const events = new Hono<AppBindings>();

events.get("/", requireAuth, async (c) => {
  return streamSSE(c, async (stream) => {
    const user = c.get("user");
    const unsubscribe = subscribe(user, async (event) => {
      await stream.writeSSE({
        event: event.type,
        data: JSON.stringify(event),
      });
    });

    stream.onAbort(() => {
      unsubscribe();
    });

    await stream.writeSSE({
      event: "CONNECTED",
      data: JSON.stringify({
        ok: true,
        createdAt: new Date().toISOString(),
      }),
      retry: 5000,
    });

    while (true) {
      await stream.sleep(30_000);

      await stream.writeSSE({
        event: "PING",
        data: JSON.stringify({
          createdAt: new Date().toISOString(),
        }),
      });
    }
  });
});

export const eventRoutes = events;
