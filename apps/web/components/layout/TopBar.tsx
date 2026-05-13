"use client";

import { Bell, ChevronRight, Menu, Wifi, WifiOff } from "lucide-react";
import React, { useState } from "react";

import { useAuth } from "@/context/auth";
import { RoleBadge } from "@/components/ui";
import { useRealtime } from "@/context/realtime";

export function TopBar({
  menuOpen,
  menuOpenAction,
}: {
  menuOpen: boolean;
  menuOpenAction: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { user } = useAuth();
  const { connected, notifications, unreadCount, markAllNotificationsRead } =
    useRealtime();
  const [notifOpen, setNotifOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="sticky top-0 h-12 bg-[#fafafa] dark:bg-[#09090b] border-b border-[#e4e4e7] dark:border-[#1e1e21] flex items-center justify-between px-4 shrink-0 z-20">
      {/* Menu Toggle */}
      <button
        type="button"
        onClick={() => menuOpenAction(!menuOpen)}
        aria-label="Toggle sidebar"
        className="inline-flex items-center rounded-sm border border-[#e4e4e7] dark:border-[#27272a] px-2 py-0.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors sm:hidden"
      >
        <Menu className="h-3.5 w-3.5" />
      </button>
      {/* Left: Logo / system name */}
      <div className="flex items-center gap-2">
        <span className="text-orange-500 dark:text-amber-500 font-display font-700 text-sm tracking-wider">
          COLLECTA
        </span>

        <ChevronRight className="w-3 h-3 text-zinc-400 dark:text-zinc-700" />

        <span className="text-[11px] text-zinc-500 dark:text-zinc-500 font-mono uppercase tracking-widest">
          {user.role === "SUPERVISOR" ? "Operations" : "Field Agent"}
        </span>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-3">
        {/* SSE status */}
        <div className="flex items-center gap-1.5">
          {connected ? (
            <>
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full pulse-dot" />
              <Wifi className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-600" />
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <WifiOff className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-600" />
            </>
          )}
        </div>

        {/* Notification bell */}
        <button
          type="button"
          onClick={() => setNotifOpen((v) => !v)}
          className="relative p-1.5 text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-orange-500 dark:bg-amber-500 rounded-full" />
          )}
        </button>

        {/* User info */}
        <div className="flex items-center gap-2 pl-3 border-l border-[#e4e4e7] dark:border-[#27272a]">
          <RoleBadge role={user.role} />
        </div>
      </div>

      {/* Notification dropdown */}
      {notifOpen && (
        <div className="absolute top-12 right-4 w-80 bg-white dark:bg-[#111113] border border-[#e4e4e7] dark:border-[#27272a] rounded-lg shadow-xl z-50 slide-in-right">
          <div className="px-4 py-3 border-b border-[#e4e4e7] dark:border-[#27272a]">
            <span className="text-[12px] font-mono uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
              Notifications
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="p-4 text-[12px] text-zinc-500 dark:text-zinc-500 text-center">
              No new notifications
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-[#e4e4e7] dark:divide-[#1a1a1c]">
              {notifications.slice(0, 6).map((notification) => (
                <div key={notification.id} className="p-3">
                  <div className="text-[12px] font-medium text-zinc-900 dark:text-zinc-200">
                    {notification.title}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-500">
                    {notification.message}
                  </div>
                </div>
              ))}
            </div>
          )}

          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => void markAllNotificationsRead()}
              className="w-full border-t border-[#e4e4e7] px-4 py-2 text-left font-mono text-[11px] uppercase tracking-widest text-orange-600 dark:border-[#27272a] dark:text-amber-400"
            >
              Mark all read
            </button>
          ) : null}
        </div>
      )}
    </header>
  );
}
