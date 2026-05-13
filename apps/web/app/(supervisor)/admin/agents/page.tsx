"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";

import type { AgentDetail, AgentItem } from "@collecta/shared/types";

import { collecta } from "@/lib/api";
import { EmptyState, LoadingSpinner, formatMoney } from "@/components/ui";
import { useRealtime } from "@/context/realtime";

type AgentCardItem = AgentItem & {
  detail?: AgentDetail;
};

export default function AgentsPage() {
  const router = useRouter();
  const { events } = useRealtime();

  const [agents, setAgents] = useState<AgentCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAgents = useCallback(async () => {
    try {
      setError("");

      const list = await collecta.getAgents();

      const details = await Promise.allSettled(
        list.map((agent) => collecta.getAgent(agent.id)),
      );

      const rows: AgentCardItem[] = list.map((agent, index) => {
        const result = details[index];

        return {
          ...agent,
          detail: result?.status === "fulfilled" ? result.value : undefined,
        };
      });

      setAgents(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadAgents);
  }, [loadAgents]);

  useEffect(() => {
    const notificationType = events[0]?.payload.notification.type;

    if (
      notificationType === "LOAN_ASSIGNED" ||
      notificationType === "COLLECTION_UPDATE_CREATED"
    ) {
      void Promise.resolve().then(loadAgents);
    }
  }, [events, loadAgents]);

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

  return (
    <div className="w-full space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Agents
        </h1>

        <p className="mt-0.5 font-mono text-[12px] text-zinc-500 dark:text-zinc-600">
          {agents.length} agents in team
        </p>
      </div>

      {agents.length === 0 ? (
        <EmptyState message="No agents found" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => {
            const detail = agent.detail;

            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => router.push(`/admin/agents/${agent.id}`)}
                className="group rounded-lg border border-[#e4e4e7] bg-white p-5 text-left transition-colors hover:border-[#a1a1aa] dark:border-[#27272a] dark:bg-[#111113] dark:hover:border-[#3f3f46]"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 font-mono text-[12px] font-bold text-orange-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                        {agent.name.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-medium text-zinc-900 dark:text-zinc-200">
                          {agent.name}
                        </div>
                      </div>
                    </div>

                    <div className="ml-10 flex min-w-0 items-center gap-1.5 font-mono text-[12px] text-zinc-500 dark:text-zinc-600">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{agent.email}</span>
                    </div>
                  </div>

                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-zinc-400 transition-colors group-hover:text-orange-500 dark:text-zinc-700 dark:group-hover:text-amber-500" />
                </div>

                {detail ? (
                  <div className="grid grid-cols-2 gap-3 border-t border-[#e4e4e7] pt-3 dark:border-[#1e1e21]">
                    <Metric
                      label="Active Loans"
                      value={detail.summary.activeAssignments}
                      className="text-blue-600 dark:text-blue-400"
                    />

                    <Metric
                      label="Collected"
                      value={formatMoney(detail.summary.totalCollected)}
                      className="text-green-600 dark:text-green-400"
                    />

                    <Metric
                      label="PTP Count"
                      value={detail.summary.promisedToPayCount}
                      className="text-purple-600 dark:text-purple-400"
                    />

                    <Metric
                      label="Follow-ups"
                      value={detail.summary.followUpsDue}
                      className={
                        detail.summary.followUpsDue > 0
                          ? "text-orange-600 dark:text-amber-400"
                          : "text-zinc-500 dark:text-zinc-500"
                      }
                    />
                  </div>
                ) : (
                  <div className="border-t border-[#e4e4e7] pt-3 text-[12px] text-zinc-500 dark:border-[#1e1e21] dark:text-zinc-600">
                    Summary unavailable
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number;
  className: string;
}) {
  return (
    <div>
      <div className="mb-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-700">
        {label}
      </div>

      <div
        className={`font-mono text-[15px] font-medium tabular-nums ${className}`}
      >
        {value}
      </div>
    </div>
  );
}
