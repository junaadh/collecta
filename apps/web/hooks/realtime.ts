"use client";

import { useEffect, useRef, useState } from "react";
import { CollectaClientError, collecta, dispatchUnauthorized } from "@/lib/api";
import type { RealtimeEvent } from "@collecta/shared/types";

type UseRealtimeEventsOptions = {
  enabled?: boolean;
  action?: (event: RealtimeEvent) => void;
};

export function useRealtimeEvents({
  enabled,
  action,
}: UseRealtimeEventsOptions = {}) {
  const [connected, setConnected] = useState(false);
  const authCheckInFlight = useRef(false);
  const authInvalidated = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let closedByUs = false;

    const source = collecta.subscribeToEvents(
      (event) => {
        setConnected(true);
        action?.(event);
      },
      () => {
        if (closedByUs) return;

        setConnected(false);

        if (authCheckInFlight.current || authInvalidated.current) return;

        authCheckInFlight.current = true;

        void collecta
          .me()
          .then(() => {
            authCheckInFlight.current = false;
            authInvalidated.current = false;
          })
          .catch((error) => {
            authCheckInFlight.current = false;

            if (error instanceof CollectaClientError && error.status === 401) {
              authInvalidated.current = true;
              dispatchUnauthorized();
            }
          });
      },
    );

    source.onopen = () => {
      if (!closedByUs) setConnected(true);
    };

    return () => {
      closedByUs = true;
      source.close();
      setConnected(false);
    };
  }, [action, enabled]);

  return {
    connected,
  };
}
