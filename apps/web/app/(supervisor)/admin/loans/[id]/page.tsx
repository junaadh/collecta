"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, User, UserCheck } from "lucide-react";

import type { LoanDetail } from "@collecta/shared/types";

import { collecta } from "@/lib/api";

import {
  BucketBadge,
  Button,
  Card,
  formatDate,
  formatDateTime,
  formatMoney,
  LoadingSpinner,
  StatusBadge,
} from "@/components/ui";

import { UpdateTimeline } from "@/components/UpdateTimeline";
import { AssignModal } from "@/components/AssignModal";

type InfoRowProps = {
  label: string;
  value: string;
  mono?: boolean;
};

function InfoRow({ label, value, mono = false }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#e4e4e7] py-2.5 last:border-0 dark:border-[#1e1e21]">
      <span className="shrink-0 font-mono text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-600">
        {label}
      </span>

      <span
        className={`text-right text-[13px] text-zinc-900 dark:text-zinc-200 ${
          mono ? "font-mono tabular-nums" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();

  const router = useRouter();

  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [error, setError] = useState("");

  const loadLoan = useCallback(async () => {
    try {
      setError("");

      const data = await collecta.getLoan(id);
      setLoan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load loan");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(loadLoan);
  }, [loadLoan]);

  const handleAssign = async (agentId: string) => {
    await collecta.assignLoan({
      loanId: id,
      agentId,
    });

    await loadLoan();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="p-6 text-sm text-zinc-500 dark:text-zinc-500">
        Loan not found
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="
            mb-4
            flex
            items-center
            gap-1.5
            text-[13px]
            text-zinc-500
            transition-colors

            hover:text-zinc-900

            dark:text-zinc-600
            dark:hover:text-zinc-300
          "
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Loans
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                {loan.customer.businessName}
              </h1>

              <StatusBadge status={loan.status} />
              <BucketBadge bucket={loan.delinquencyBucket} />
            </div>

            <p className="font-mono text-[13px] text-orange-600 dark:text-amber-400">
              {loan.loanNumber}
            </p>
          </div>

          <Button variant="secondary" onClick={() => setShowAssign(true)}>
            <UserCheck className="h-4 w-4" />

            {loan.assignment ? "Reassign Agent" : "Assign Agent"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Outstanding",
            value: formatMoney(loan.outstandingAmount),
            accent: "text-orange-600 dark:text-amber-400",
          },
          {
            label: "Overdue Amount",
            value: formatMoney(loan.overdueAmount),
            accent: "text-red-600 dark:text-red-400",
          },
          {
            label: "Days Past Due",
            value: `${loan.daysPastDue} days`,
            accent: "text-red-600 dark:text-red-400",
          },
          {
            label: "Missed EMIs",
            value: `${loan.missedInstallmentCount} installments`,
            accent: "text-zinc-700 dark:text-zinc-300",
          },
        ].map(({ label, value, accent }) => (
          <Card key={label} className="p-4">
            <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-600">
              {label}
            </div>

            <div
              className={`font-mono text-lg font-medium tabular-nums ${accent}`}
            >
              {value}
            </div>
          </Card>
        ))}
      </div>

      {/* Detail Sections */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Customer */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2 border-b border-[#e4e4e7] pb-3 dark:border-[#1e1e21]">
            <User className="h-4 w-4 text-zinc-500 dark:text-zinc-600" />

            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
              Customer
            </span>
          </div>

          <InfoRow label="Business" value={loan.customer.businessName} />

          <InfoRow label="Contact" value={loan.customer.contactPerson} />

          <InfoRow label="Phone" value={loan.customer.phone} mono />
        </Card>

        {/* Product */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2 border-b border-[#e4e4e7] pb-3 dark:border-[#1e1e21]">
            <Package className="h-4 w-4 text-zinc-500 dark:text-zinc-600" />

            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
              Product & EMI
            </span>
          </div>

          <InfoRow label="Product" value={loan.product.name} />

          <InfoRow
            label="Principal"
            value={formatMoney(loan.principalAmount)}
            mono
          />

          <InfoRow
            label="Monthly EMI"
            value={formatMoney(loan.monthlyInstallmentAmount)}
            mono
          />

          <InfoRow
            label="Due Day"
            value={`${loan.installmentDueDay}th of month`}
          />

          <InfoRow
            label="Next Due"
            value={formatDate(loan.nextInstallmentDate)}
            mono
          />
        </Card>

        {/* Assignment */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2 border-b border-[#e4e4e7] pb-3 dark:border-[#1e1e21]">
            <UserCheck className="h-4 w-4 text-zinc-500 dark:text-zinc-600" />

            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
              Assignment
            </span>
          </div>

          {loan.assignment ? (
            <>
              <InfoRow label="Agent" value={loan.assignment.agentName} />

              <InfoRow
                label="Assigned At"
                value={formatDateTime(loan.assignment.assignedAt)}
                mono
              />
            </>
          ) : (
            <div className="py-6 text-center">
              <p className="mb-4 text-[13px] text-zinc-500 dark:text-zinc-600">
                No agent assigned
              </p>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAssign(true)}
              >
                Assign Now
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Timeline */}
      <div>
        <h2 className="mb-4 font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
          Collection History
        </h2>

        <UpdateTimeline updates={loan.updates} />
      </div>

      {showAssign ? (
        <AssignModal
          loanNumber={loan.loanNumber}
          currentAgentId={loan.assignment?.agentId}
          closeAction={() => setShowAssign(false)}
          assignAction={handleAssign}
        />
      ) : null}
    </div>
  );
}
