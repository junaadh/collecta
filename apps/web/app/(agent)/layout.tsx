"use client";

import { useState } from "react";
import { AgentSidebar } from "@/components/layout/AgentSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { RealtimeProvider } from "@/context/realtime";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <RealtimeProvider>
      <div className="h-screen flex flex-col bg-[#fafafa] dark:bg-[#09090b] overflow-hidden">
        <TopBar menuOpen={openMenu} menuOpenAction={setOpenMenu} />
        <div className="flex flex-1 overflow-hidden">
          <AgentSidebar menuOpen={openMenu} />
          <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </RealtimeProvider>
  );
}
