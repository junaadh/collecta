"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import type { NotificationItem, RealtimeEvent } from "@collecta/shared/types";
import { useAuth } from "@/context/auth";
import { useRealtimeEvents } from "@/hooks/realtime";
import { collecta } from "@/lib/api";

type RealtimeContextType = {
  connected: boolean;
  events: RealtimeEvent[];
  notifications: NotificationItem[];
  unreadCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
};

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const handleEvent = useCallback((event: RealtimeEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, 50));
    setNotifications((prev) => [
      event.payload.notification,
      ...prev.filter((item) => item.id !== event.payload.notification.id),
    ]);
  }, []);

  const loadNotifications = useCallback(async () => {
    const rows = await collecta.getNotifications();
    setNotifications(rows);
  }, []);

  useEffect(() => {
    if (isLoading || !user) {
      void Promise.resolve().then(() => {
        setNotifications([]);
        setEvents([]);
      });
      return;
    }

    void Promise.resolve().then(loadNotifications);
  }, [isLoading, loadNotifications, user]);

  const markNotificationRead = useCallback(async (id: string) => {
    const notification = await collecta.markNotificationRead(id);

    if (!notification) return;

    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? notification : item)),
    );
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    const response = await collecta.markAllNotificationsRead();
    const updated = new Map(
      response.notifications.map((notification) => [notification.id, notification]),
    );

    setNotifications((prev) =>
      prev.map((item) => updated.get(item.id) ?? item),
    );
  }, []);

  const { connected } = useRealtimeEvents({
    enabled: !isLoading && Boolean(user),
    action: handleEvent,
  });

  const unreadCount = notifications.filter((item) => !item.readAt).length;

  return (
    <RealtimeContext.Provider
      value={{
        connected,
        events,
        notifications,
        unreadCount,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);

  if (!ctx) {
    throw new Error("useRealtime must be used within RealtimeProvider");
  }

  return ctx;
}
