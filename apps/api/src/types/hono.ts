import type { AuthUser } from "../lib/auth";

export type AppBindings = {
  Variables: {
    user: AuthUser;
  };
};
