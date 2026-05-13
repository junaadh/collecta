import { serve } from "@hono/node-server";

import { app } from "./app";
import { config } from "./config";

serve({
  fetch: app.fetch,
  port: config.app.port,
  hostname: "0.0.0.0",
});

console.log(`Collecta API running on http://localhost:${config.app.port}`);
