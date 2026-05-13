"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";

import type { LoanListItem } from "@collecta/shared/types";

import { collecta } from "@/lib/api";
import { useAuth } from "@/context/auth";
import { useRealtime } from "@/context/realtime";
import {
  BucketBadge,
  LoadingSpinner,
  StatCard,
  StatusBadge,
  formatMoney,
} from "@/components/ui";

export default function AgentDashboard() {
  const { user } = useAuth();
  const { events } = useRealtime();
  const router = useRouter();

  const [loans, setLoans] = useState<LoanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLoans = useCallback(async () => {
    try {
      setError("");
      const data = await collecta.getLoans();
      setLoans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load loans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadLoans);
  }, [loadLoans]);

  useEffect(() => {
    const notificationType = events[0]?.payload.notification.type;

    if (
      notificationType === "LOAN_ASSIGNED" ||
      notificationType === "COLLECTION_UPDATE_CREATED"
    ) {
      void Promise.resolve().then(loadLoans);
    }
  }, [events, loadLoans]);

  const summary = useMemo(() => {
    const activeAssignments = loans.length;

    const followUpsDue = loans.filter((loan) => {
      if (!loan.nextInstallmentDate) return false;
      return new Date(loan.nextInstallmentDate) <= new Date();
    }).length;

    const promisedToPayCount = loans.filter(
      (loan) => loan.status === "PROMISED_TO_PAY",
    ).length;

    const totalCollected = "0";

    return {
      activeAssignments,
      followUpsDue,
      promisedToPayCount,
      totalCollected,
    };
  }, [loans]);

  const priorityLoans = useMemo(() => {
    return loans.filter((loan) =>
      ["OVERDUE", "IN_PROGRESS", "PROMISED_TO_PAY", "ASSIGNED"].includes(
        loan.status,
      ),
    );
  }, [loans]);

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
    <div className="w-full space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          My Dashboard
        </h1>

        <p className="mt-0.5 font-mono text-[12px] text-zinc-500 dark:text-zinc-600">
          {user?.name} ·{" "}
          {new Date().toLocaleDateString("en-MV", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="My Assigned Loans"
          value={summary.activeAssignments}
          accent="blue"
        />
        <StatCard
          label="Follow-ups Due"
          value={summary.followUpsDue}
          sub="today"
          accent="amber"
        />
        <StatCard
          label="Promised Payments"
          value={summary.promisedToPayCount}
          accent="amber"
        />
        <StatCard
          label="Total Collected"
          value={formatMoney(summary.totalCollected)}
          accent="green"
        />
      </div>

      {priorityLoans.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <h2 className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                Priority — Overdue Loans
              </h2>
            </div>

            <button
              type="button"
              onClick={() => router.push("/agent/loans")}
              className="flex items-center gap-1 font-mono text-[12px] text-zinc-500 transition-colors hover:text-orange-600 dark:text-zinc-600 dark:hover:text-amber-400"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2">
            {priorityLoans.slice(0, 5).map((loan) => (
              <button
                key={loan.id}
                type="button"
                onClick={() => router.push(`/agent/loans/${loan.id}`)}
                className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg border border-[#e4e4e7] bg-white px-4 py-3 text-left transition-colors hover:border-red-200 dark:border-[#27272a] dark:bg-[#111113] dark:hover:border-red-900/50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-8 w-1 shrink-0 rounded-full bg-red-500" />

                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-200">
                      {loan.customer.businessName}
                    </div>

                    <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-600">
                      {loan.loanNumber} · {loan.daysPastDue}d overdue
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <div className="hidden text-right sm:block">
                    <div className="font-mono text-[13px] tabular-nums text-red-600 dark:text-red-400">
                      {formatMoney(loan.overdueAmount)}
                    </div>

                    <div className="font-mono text-[11px] text-zinc-400 dark:text-zinc-700">
                      overdue
                    </div>
                  </div>

                  <StatusBadge status={loan.status} />

                  <ArrowRight className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-orange-500 dark:text-zinc-700 dark:group-hover:text-amber-500" />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
          All Assigned Loans
        </h2>

        <div className="overflow-hidden rounded-lg border border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#111113]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[#e4e4e7] dark:border-[#1e1e21]">
                  {[
                    "Loan #",
                    "Business",
                    "Overdue",
                    "DPD",
                    "Bucket",
                    "Status",
                    "",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#eeeeef] dark:divide-[#1a1a1c]">
                {loans.map((loan) => (
                  <tr
                    key={loan.id}
                    onClick={() => router.push(`/agent/loans/${loan.id}`)}
                    className="group cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-[#16161a]"
                  >
                    <td className="px-4 py-3 font-mono text-[12px] text-orange-600 dark:text-amber-400">
                      {loan.loanNumber}
                    </td>

                    <td className="max-w-[180px] truncate px-4 py-3 text-[13px] text-zinc-800 dark:text-zinc-300">
                      {loan.customer.businessName}
                    </td>

                    <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-red-600 dark:text-red-400">
                      {formatMoney(loan.overdueAmount)}
                    </td>

                    <td className="px-4 py-3 font-mono text-[12px] text-zinc-600 dark:text-zinc-400">
                      {loan.daysPastDue}d
                    </td>

                    <td className="px-4 py-3">
                      <BucketBadge bucket={loan.delinquencyBucket} />
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={loan.status} />
                    </td>

                    <td className="px-4 py-3">
                      <ArrowRight className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-orange-500 dark:text-zinc-700 dark:group-hover:text-amber-500" />
                    </td>
                  </tr>
                ))}

                {loans.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-[13px] text-zinc-500 dark:text-zinc-600"
                    >
                      No loans assigned yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
