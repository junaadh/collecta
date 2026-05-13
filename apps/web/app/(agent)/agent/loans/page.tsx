"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter } from "lucide-react";

import type { LoanListItem, LoanStatus } from "@collecta/shared/types";

import { collecta } from "@/lib/api";
import { useRealtime } from "@/context/realtime";
import { LoanTable } from "@/components/LoanTable";
import { LoadingSpinner } from "@/components/ui";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "PROMISED_TO_PAY", label: "Promised to Pay" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" },
] satisfies { value: LoanStatus | ""; label: string }[];

export default function AgentLoansPage() {
  const { events } = useRealtime();

  const [loans, setLoans] = useState<LoanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState<LoanStatus | "">("");
  const [followUpOnly, setFollowUpOnly] = useState(false);

  const loadLoans = useCallback(async () => {
    try {
      setError("");

      const data = await collecta.getLoans({
        status: status || undefined,
      });

      setLoans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load loans");
    } finally {
      setLoading(false);
    }
  }, [status]);

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

  const filteredLoans = useMemo(() => {
    if (!followUpOnly) return loans;

    const today = new Date();

    return loans.filter((loan) => {
      if (!loan.nextInstallmentDate) return false;

      return (
        loan.daysPastDue > 0 || new Date(loan.nextInstallmentDate) <= today
      );
    });
  }, [loans, followUpOnly]);

  return (
    <div className="w-full space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          My Loans
        </h1>

        <p className="mt-0.5 font-mono text-[12px] text-zinc-500 dark:text-zinc-600">
          {filteredLoans.length} loans assigned to you
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500 dark:text-zinc-600" />

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as LoanStatus | "")
            }
            className="cursor-pointer appearance-none rounded border border-[#e4e4e7] bg-white px-3 py-2 pl-8 pr-7 text-sm text-zinc-900 transition-colors focus:border-orange-500 focus:outline-none dark:border-[#27272a] dark:bg-[#18181b] dark:text-zinc-100 dark:focus:border-amber-600"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={followUpOnly}
            onChange={(event) => setFollowUpOnly(event.target.checked)}
            className="accent-orange-500 dark:accent-amber-500"
          />

          <span className="text-[13px] text-zinc-600 dark:text-zinc-400">
            Follow-up due only
          </span>
        </label>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#111113]">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <LoanTable loans={filteredLoans} basePath="/agent/loans" />
        )}
      </div>
    </div>
  );
}
