import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => {
  return c.json({
    ok: true,
    service: "collecta-api",
  });
});

const port = Number(process.env.PORT ?? 4000);

serve({
  fetch: app.fetch,
  port,
  hostname: "0.0.0.0",
});

console.log(`Collecta API running on http://localhost:${port}`);
