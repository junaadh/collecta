"use client";

import { useCallback, useEffect, useState } from "react";
import { Filter, Search, SlidersHorizontal } from "lucide-react";

import type {
  DelinquencyBucket,
  LoanListItem,
  LoanStatus,
} from "@collecta/shared/types";

import { collecta } from "@/lib/api";
import { useRealtime } from "@/context/realtime";
import { LoanTable } from "@/components/LoanTable";
import { AssignModal } from "@/components/AssignModal";
import { LoadingSpinner } from "@/components/ui";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "PROMISED_TO_PAY", label: "Promised to Pay" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" },
  { value: "PAID", label: "Paid" },
  { value: "CLOSED", label: "Closed" },
] satisfies { value: LoanStatus | ""; label: string }[];

const BUCKET_OPTIONS = [
  { value: "", label: "All Buckets" },
  { value: "CURRENT", label: "Current" },
  { value: "DPD_1_30", label: "1–30 DPD" },
  { value: "DPD_31_60", label: "31–60 DPD" },
  { value: "DPD_61_90", label: "61–90 DPD" },
  { value: "DPD_90_PLUS", label: "90+ DPD" },
  { value: "LEGAL_REVIEW", label: "Legal Review" },
] satisfies { value: DelinquencyBucket | ""; label: string }[];

export default function LoansPage() {
  const { events } = useRealtime();

  const [loans, setLoans] = useState<LoanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LoanStatus | "">("");
  const [bucket, setBucket] = useState<DelinquencyBucket | "">("");
  const [assignTarget, setAssignTarget] = useState<LoanListItem | null>(null);

  const loadLoans = useCallback(async () => {
    try {
      setError("");

      const data = await collecta.getLoans({
        search: search || undefined,
        status: status || undefined,
        delinquencyBucket: bucket || undefined,
      });

      setLoans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load loans");
    } finally {
      setLoading(false);
    }
  }, [search, status, bucket]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLoans();
    }, 250);

    return () => window.clearTimeout(timer);
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

  const handleAssign = async (agentId: string) => {
    if (!assignTarget) return;

    await collecta.assignLoan({
      loanId: assignTarget.id,
      agentId,
    });

    setAssignTarget(null);
    await loadLoans();
  };

  return (
    <div className="w-full space-y-5 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Loan Portfolio
          </h1>

          <p className="mt-0.5 font-mono text-[12px] text-zinc-500 dark:text-zinc-600">
            {loans.length} loans · Manage and assign
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-55 flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-600" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search business / loan #"
            className="w-full rounded border border-[#e4e4e7] bg-white px-3 py-2 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-orange-500 focus:outline-none dark:border-[#27272a] dark:bg-[#18181b] dark:text-zinc-100 dark:placeholder:text-zinc-700 dark:focus:border-amber-600"
          />
        </div>

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

        <div className="relative">
          <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500 dark:text-zinc-600" />

          <select
            value={bucket}
            onChange={(event) =>
              setBucket(event.target.value as DelinquencyBucket | "")
            }
            className="cursor-pointer appearance-none rounded border border-[#e4e4e7] bg-white px-3 py-2 pl-8 pr-7 text-sm text-zinc-900 transition-colors focus:border-orange-500 focus:outline-none dark:border-[#27272a] dark:bg-[#18181b] dark:text-zinc-100 dark:focus:border-amber-600"
          >
            {BUCKET_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
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
          <LoanTable loans={loans} basePath="/admin/loans" showAssignment />
        )}
      </div>

      {assignTarget ? (
        <AssignModal
          loanNumber={assignTarget.loanNumber}
          closeAction={() => setAssignTarget(null)}
          assignAction={handleAssign}
        />
      ) : null}
    </div>
  );
}
