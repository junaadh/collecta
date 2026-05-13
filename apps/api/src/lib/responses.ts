import type { ApiResponse } from "@collecta/shared/types";

export function ok<T>(data: T): ApiResponse<T> {
  return {
    data,

    meta: {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    },
  };
}

export function fail(
  code: number,
  message: string,
  detail?: string,
): ApiResponse<never> {
  return {
    error: {
      code,
      message,
      detail,
    },

    meta: {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    },
  };
}
