import type { RealtimeEvent } from "@collecta/shared/types";
import type { AuthUser } from "./auth";

type Subscriber = {
  id: string;
  user: AuthUser;
  send: (event: RealtimeEvent) => void;
};

type PublishOptions = {
  targetUserIds: string[];
};

const subscribers = new Map<string, Subscriber>();

export function subscribe(
  user: AuthUser,
  send: (event: RealtimeEvent) => void,
): () => void {
  const id = crypto.randomUUID();

  subscribers.set(id, {
    id,
    user,
    send,
  });

  return () => {
    subscribers.delete(id);
  };
}

export function publish(
  event: Omit<RealtimeEvent, "createdAt">,
  options: PublishOptions,
): void {
  if (options.targetUserIds.length === 0) {
    return;
  }

  const fullEvent = {
    ...event,
    createdAt: new Date().toISOString(),
  } as RealtimeEvent;

  for (const subscriber of subscribers.values()) {
    if (!options.targetUserIds.includes(subscriber.user.id)) {
      continue;
    }

    subscriber.send(fullEvent);
  }
}
