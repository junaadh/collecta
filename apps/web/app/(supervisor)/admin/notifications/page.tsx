"use client";

import { Bell } from "lucide-react";

import { useRealtime } from "@/context/realtime";
import { formatDateTime } from "@/components/ui";

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } =
    useRealtime();

  return (
    <div className="w-full space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Notifications
        </h1>

        <p className="mt-0.5 font-mono text-[12px] text-zinc-500 dark:text-zinc-600">
          System alerts and collection workflow updates
        </p>
      </div>

      {notifications.some((notification) => !notification.readAt) ? (
        <button
          type="button"
          onClick={() => void markAllNotificationsRead()}
          className="rounded-lg border border-[#e4e4e7] px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-orange-600 dark:border-[#27272a] dark:text-amber-400"
        >
          Mark all read
        </button>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#111113]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="mx-auto mb-3 h-7 w-7 text-zinc-400 dark:text-zinc-700" />

            <div className="text-sm text-zinc-500 dark:text-zinc-500">
              No new notifications
            </div>

            <div className="mt-1 font-mono text-[12px] text-zinc-400 dark:text-zinc-700">
              Notification history will appear here
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-[#e4e4e7] dark:divide-[#1a1a1c]">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className="p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-[12px] font-medium uppercase text-zinc-900 dark:text-zinc-200">
                      {notification.title}
                    </div>

                    <div className="mt-1 text-[13px] text-zinc-600 dark:text-zinc-400">
                      {notification.message}
                    </div>

                    <div className="mt-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-600">
                      {formatDateTime(notification.createdAt)}
                    </div>
                  </div>

                  {!notification.readAt ? (
                    <button
                      type="button"
                      onClick={() => void markNotificationRead(notification.id)}
                      className="rounded-full bg-orange-500/10 px-2 py-0.5 font-mono text-[10px] uppercase text-orange-600 dark:bg-amber-500/10 dark:text-amber-400"
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
