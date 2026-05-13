"use client";

import { useState } from "react";
import { SupervisorSidebar } from "@/components/layout/SupervisorSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { RealtimeProvider } from "@/context/realtime";

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <RealtimeProvider>
      <div className="flex h-screen flex-col bg-[#fafafa] dark:bg-[#09090b] overflow-hidden">
        <TopBar menuOpen={openMenu} menuOpenAction={setOpenMenu} />
        <div className="flex flex-1 overflow-hidden">
          <SupervisorSidebar menuOpen={openMenu} />
          <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </RealtimeProvider>
  );
}
