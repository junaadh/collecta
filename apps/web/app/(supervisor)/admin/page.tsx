"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  DashboardSummary,
  DelinquencyBucket,
  LoanStatus,
} from "@collecta/shared/types";

import { collecta } from "@/lib/api";
import { useAuth } from "@/context/auth";
import { useRealtime } from "@/context/realtime";
import { formatMoney, LoadingSpinner, StatCard } from "@/components/ui";

const BUCKET_LABELS = {
  CURRENT: "Current",
  DPD_1_30: "1–30 DPD",
  DPD_31_60: "31–60 DPD",
  DPD_61_90: "61–90 DPD",
  DPD_90_PLUS: "90+ DPD",
  LEGAL_REVIEW: "Legal",
} satisfies Record<DelinquencyBucket, string>;

const BUCKET_COLORS = {
  CURRENT: "bg-green-500/70 dark:bg-green-500",
  DPD_1_30: "bg-amber-400/70 dark:bg-amber-400",
  DPD_31_60: "bg-orange-400/70 dark:bg-orange-400",
  DPD_61_90: "bg-red-400/70 dark:bg-red-400",
  DPD_90_PLUS: "bg-red-600/70 dark:bg-red-600",
  LEGAL_REVIEW: "bg-purple-500/70 dark:bg-purple-500",
} satisfies Record<DelinquencyBucket, string>;

const STATUS_LABELS = {
  OVERDUE: "Overdue",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  PROMISED_TO_PAY: "Promised",
  PARTIALLY_PAID: "Partial",
  PAID: "Paid",
  CLOSED: "Closed",
} satisfies Record<LoanStatus, string>;

export default function AdminDashboard() {
  const { user } = useAuth();
  const { events } = useRealtime();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setError("");
      const data = await collecta.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadDashboard);
  }, [loadDashboard]);

  useEffect(() => {
    const notificationType = events[0]?.payload.notification.type;

    if (
      notificationType === "LOAN_ASSIGNED" ||
      notificationType === "COLLECTION_UPDATE_CREATED"
    ) {
      void Promise.resolve().then(loadDashboard);
    }
  }, [events, loadDashboard]);

  const maxBucketCount = useMemo(() => {
    return Math.max(
      1,
      ...(summary?.loansByDelinquencyBucket.map((b) => b.count) ?? []),
    );
  }, [summary]);

  const maxStatusCount = useMemo(() => {
    return Math.max(1, ...(summary?.loansByStatus.map((s) => s.count) ?? []));
  }, [summary]);

  const recoveryRate = useMemo(() => {
    if (!summary) return "0.0";

    const collected = Number(summary.totalCollectedAmount);
    const overdue = Number(summary.totalOverdueAmount);
    const delinquentExposure = collected + overdue;

    if (!delinquentExposure) return "0.0";

    return ((collected / delinquentExposure) * 100).toFixed(1);
  }, [summary]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Good morning, {user?.name?.split(" ")[0]}
        </h1>

        <p className="mt-0.5 font-mono text-[13px] text-zinc-500 dark:text-zinc-600">
          Operations overview ·{" "}
          {new Date().toLocaleDateString("en-MV", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Total Overdue"
          value={formatMoney(summary.totalOverdueAmount)}
          sub="across all portfolios"
          accent="red"
        />
        <StatCard
          label="Total Outstanding"
          value={formatMoney(summary.totalOutstandingAmount)}
          accent="amber"
        />
        <StatCard
          label="Active Assignments"
          value={summary.activeAssignments}
          sub={`of ${summary.totalLoans} total loans`}
          accent="blue"
        />
        <StatCard
          label="Promised to Pay"
          value={summary.promisedToPayCount}
          accent="amber"
        />
        <StatCard
          label="Follow-ups Due"
          value={summary.followUpsDue}
          sub="today"
          accent="red"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-[#e4e4e7] bg-white p-5 dark:border-[#27272a] dark:bg-[#111113]">
          <h2 className="mb-5 font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
            Loans by Delinquency Bucket
          </h2>

          <div className="space-y-3">
            {summary.loansByDelinquencyBucket.map(({ bucket, count }) => (
              <div key={bucket} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-right font-mono text-[12px] text-zinc-500 dark:text-zinc-500">
                  {BUCKET_LABELS[bucket]}
                </span>

                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#eeeeef] dark:bg-[#1a1a1c]">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${BUCKET_COLORS[bucket]}`}
                    style={{
                      width: `${(count / maxBucketCount) * 100}%`,
                    }}
                  />
                </div>

                <span className="w-8 text-right font-mono text-[12px] tabular-nums text-zinc-600 dark:text-zinc-400">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[#e4e4e7] bg-white p-5 dark:border-[#27272a] dark:bg-[#111113]">
          <h2 className="mb-5 font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
            Loans by Status
          </h2>

          <div className="space-y-3">
            {summary.loansByStatus.map(({ status, count }) => (
              <div key={status} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-right font-mono text-[12px] text-zinc-500 dark:text-zinc-500">
                  {STATUS_LABELS[status]}
                </span>

                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#eeeeef] dark:bg-[#1a1a1c]">
                  <div
                    className="h-full rounded-full bg-orange-500/70 transition-all duration-700 dark:bg-amber-500"
                    style={{
                      width: `${(count / maxStatusCount) * 100}%`,
                      opacity: 0.35 + 0.65 * (count / maxStatusCount),
                    }}
                  />
                </div>

                <span className="w-8 text-right font-mono text-[12px] tabular-nums text-zinc-600 dark:text-zinc-400">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="flex items-center justify-between rounded-lg border border-[#e4e4e7] bg-white p-5 dark:border-[#27272a] dark:bg-[#111113]">
        <div>
          <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
            Total Collected
          </div>

          <div className="font-display text-3xl font-bold tabular-nums text-green-600 dark:text-green-400">
            {formatMoney(summary.totalCollectedAmount)}
          </div>
        </div>

        <div className="text-right">
          <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
            Recovery Rate
          </div>

          <div className="font-mono text-xl text-zinc-700 dark:text-zinc-300">
            {recoveryRate}%
          </div>
        </div>
      </section>
    </div>
  );
}
