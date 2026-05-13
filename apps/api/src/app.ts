import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { cors } from "hono/cors";
import type { AppBindings } from "./types/hono";
import { authRoutes } from "./routes/auth";
import { loanRoutes } from "./routes/loans";
import { fail, ok } from "./lib/responses";
import { productRoutes } from "./routes/products";
import { agentRoutes } from "./routes/agents";
import { assignmentRoutes } from "./routes/assignments";
import { auditRoutes } from "./routes/audit";
import { dashboardRoutes } from "./routes/dashboard";
import { eventRoutes } from "./routes/events";
import { notificationRoutes } from "./routes/notifications";

export const app = new Hono<AppBindings>().basePath("/api/v1");

app.use(
  "*",
  cors({
    credentials: true,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.get("/health", (c) => {
  return c.json(
    ok({
      ok: true,
      service: "collecta-api",
    }),
  );
});

app.route("/auth", authRoutes);
app.route("/loans", loanRoutes);
app.route("/products", productRoutes);
app.route("/agents", agentRoutes);
app.route("/assignments", assignmentRoutes);
app.route("/audit", auditRoutes);
app.route("/dashboard", dashboardRoutes);
app.route("/events", eventRoutes);
app.route("/notifications", notificationRoutes);

app.notFound((c) => {
  return c.json(fail(404, "Route not found"), 404);
});

app.onError((err, c) => {
  console.error(err);

  if (err instanceof HTTPException) {
    return c.json(
      fail(err.status, err.message, err.cause as string),
      err.status,
    );
  }

  return c.json(fail(500, "Internal server error"), 500);
});
