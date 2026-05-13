import { Hono } from "hono";
import type { AppBindings } from "../types/hono";
import { requireAuth } from "../middleware/require-auth";
import { db, loanProducts } from "@collecta/db";
import type { ProductDetail, ProductItem } from "@collecta/shared/types";
import { fail, ok } from "../lib/responses";
import { eq } from "drizzle-orm";

const products = new Hono<AppBindings>();

products.get("/", requireAuth, async (c) => {
  const rawRows = await db.select().from(loanProducts);

  const rows: ProductItem[] = rawRows.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
  }));

  return c.json(ok(rows));
});

products.get("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");

  const [product] = await db
    .select()
    .from(loanProducts)
    .where(eq(loanProducts.id, id))
    .limit(1);

  if (!product) {
    return c.json(fail(404, "Product not found"), 404);
  }

  const detail: ProductDetail = {
    id: product.id,
    name: product.name,
    description: product.description,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };

  return c.json(ok(detail));
});

export const productRoutes = products;
