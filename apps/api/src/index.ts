import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { customers, db, loanProducts, loans } from "@collecta/db";
import { eq } from "drizzle-orm";

const app = new Hono();

app.get("/health", (c) => {
  return c.json({
    ok: true,
    service: "collecta-api",
  });
});

app.get("/loans", async (c) => {
  const rows = await db
    .select({
      id: loans.id,
      loanNumber: loans.loanNumber,
      status: loans.status,
      principalAmount: loans.principalAmount,
      outstandingAmount: loans.outstandingAmount,
      overdueAmount: loans.overdueAmount,
      dueDate: loans.dueDate,
      customerName: customers.businessName,
      contactPerson: customers.contactPerson,
      productName: loanProducts.name,
    })
    .from(loans)
    .innerJoin(customers, eq(loans.customerId, customers.id))
    .innerJoin(loanProducts, eq(loans.productId, loanProducts.id));

  return c.json({
    data: rows,
  });
});

const port = Number(process.env.PORT ?? 4000);

serve({
  fetch: app.fetch,
  port,
  hostname: "0.0.0.0",
});

console.log(`Collecta API running on http://localhost:${port}`);
