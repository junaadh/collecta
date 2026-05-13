"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ClipboardList, LayoutDashboard, LogOut } from "lucide-react";

import { useAuth } from "@/context/auth";

const NAV_ITEMS = [
  { href: "/agent", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/agent/loans", label: "My Loans", icon: ClipboardList },
  { href: "/agent/notifications", label: "Notifications", icon: Bell },
];

export function AgentSidebar({ menuOpen }: { menuOpen: boolean }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className={`fixed h-full w-52 bg-[#fafafa] dark:bg-[#09090b] border-r border-[#e4e4e7] dark:border-[#1e1e21] flex flex-col shrink-0 transition-transform duration-200 sm:static sm:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <nav className="flex-1 py-4">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-700 uppercase tracking-[0.15em]">
            Agent
          </span>
        </div>

        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded text-[13px] transition-all ${
                    active
                      ? "bg-orange-500/10 dark:bg-amber-500/10 text-orange-600 dark:text-amber-400 border-l-2 border-orange-500 dark:border-amber-500 pl-2.5"
                      : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-[#e4e4e7] dark:border-[#1e1e21] space-y-3">
        {user && (
          <div>
            <div className="text-[12px] font-medium text-zinc-900 dark:text-zinc-200">
              {user.name}
            </div>
            <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-700">
              {user.email}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
