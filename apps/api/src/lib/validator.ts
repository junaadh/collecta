import { zValidator } from "@hono/zod-validator";

import type { ZodSchema as ZodSchemaV3 } from "zod/v3";
import type { ZodType as ZodTypeV4 } from "zod";

import { fail } from "./responses";

type CompatibleSchema = ZodSchemaV3 | ZodTypeV4;

export const validator = <T extends CompatibleSchema>(schema: T) => {
  return zValidator("json", schema as any, (result, c) => {
    if (!result.success) {
      return c.json(fail(400, "Validation failed", result.error.message), 400);
    }
  });
};
