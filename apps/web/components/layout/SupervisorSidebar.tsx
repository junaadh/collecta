"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/auth";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/loans", label: "Loans", icon: FileText },
  { href: "/admin/agents", label: "Agents", icon: Users },
  { href: "/admin/audit", label: "Audit Trail", icon: ShieldAlert },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
] satisfies NavItem[];

export function SupervisorSidebar({ menuOpen }: { menuOpen: boolean }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className={`fixed h-full flex w-52 shrink-0 flex-col border-r border-[#e4e4e7] bg-[#fafafa] dark:border-[#1e1e21] dark:bg-[#09090b] transition-transform duration-200 sm:static sm:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <nav className="flex-1 py-4">
        <div className="mb-2 px-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-700">
            Supervisor
          </span>
        </div>

        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname.startsWith(href);

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 rounded px-3 py-2 text-[13px] transition-all ${
                    active
                      ? "border-l-2 border-orange-500 bg-orange-500/10 pl-2.5 text-orange-600 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-400"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
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
