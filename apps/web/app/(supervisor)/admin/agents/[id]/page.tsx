"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";

import type { AgentDetail } from "@collecta/shared/types";

import { collecta } from "@/lib/api";
import { useRealtime } from "@/context/realtime";
import { formatMoney, LoadingSpinner } from "@/components/ui";
import { LoanTable } from "@/components/LoanTable";
import { UpdateTimeline } from "@/components/UpdateTimeline";

type Tab = "loans" | "updates";

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { events } = useRealtime();

  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("loans");

  const loadAgent = useCallback(async () => {
    try {
      setError("");
      const data = await collecta.getAgent(id);
      setAgent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agent");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(loadAgent);
  }, [loadAgent]);

  useEffect(() => {
    const notificationType = events[0]?.payload.notification.type;

    if (
      notificationType === "LOAN_ASSIGNED" ||
      notificationType === "COLLECTION_UPDATE_CREATED"
    ) {
      void Promise.resolve().then(loadAgent);
    }
  }, [events, loadAgent]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-4 text-zinc-500 dark:text-zinc-500 sm:p-6">
        Agent not found
      </div>
    );
  }

  const metrics = [
    {
      label: "Active Loans",
      value: agent.summary.activeAssignments,
      className: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Total Collected",
      value: formatMoney(agent.summary.totalCollected),
      className: "text-green-600 dark:text-green-400",
    },
    {
      label: "Promised to Pay",
      value: agent.summary.promisedToPayCount,
      className: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Follow-ups Due",
      value: agent.summary.followUpsDue,
      className:
        agent.summary.followUpsDue > 0
          ? "text-orange-600 dark:text-amber-400"
          : "text-zinc-500 dark:text-zinc-500",
    },
  ];

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      <div>
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Agents
        </button>

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 font-mono text-xl font-bold text-orange-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
            {agent.name.charAt(0)}
          </div>

          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {agent.name}
            </h1>

            <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-zinc-500 dark:text-zinc-600">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{agent.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map(({ label, value, className }) => (
          <div
            key={label}
            className="rounded-lg border border-[#e4e4e7] bg-white p-4 dark:border-[#27272a] dark:bg-[#111113]"
          >
            <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-600">
              {label}
            </div>

            <div
              className={`font-mono text-xl font-medium tabular-nums ${className}`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex gap-1 border-b border-[#e4e4e7] dark:border-[#27272a]">
          {(["loans", "updates"] as const).map((value) => {
            const active = tab === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`-mb-px border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                  active
                    ? "border-orange-500 text-orange-600 dark:border-amber-500 dark:text-amber-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-300"
                }`}
              >
                {value === "loans"
                  ? `Assigned Loans (${agent.assignedLoans.length})`
                  : `Recent Updates (${agent.recentUpdates.length})`}
              </button>
            );
          })}
        </div>

        {tab === "loans" ? (
          <div className="overflow-hidden rounded-lg border border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#111113]">
            <LoanTable loans={agent.assignedLoans} basePath="/admin/loans" />
          </div>
        ) : (
          <UpdateTimeline updates={agent.recentUpdates} />
        )}
      </section>
    </div>
  );
}
