"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, Phone, Plus, User } from "lucide-react";

import type {
  CollectionUpdateStatus,
  CollectionUpdateType,
  CreateCollectionUpdateRequest,
  LoanDetail,
} from "@collecta/shared/types";

import { collecta } from "@/lib/api";
import {
  BucketBadge,
  Button,
  Card,
  formatDate,
  formatMoney,
  Input,
  LoadingSpinner,
  Select,
  StatusBadge,
  Textarea,
} from "@/components/ui";
import { UpdateTimeline } from "@/components/UpdateTimeline";
import { useRealtime } from "@/context/realtime";

const UPDATE_TYPES = [
  { value: "CALL", label: "Call" },
  { value: "VISIT", label: "Visit" },
  { value: "PAYMENT", label: "Payment" },
  { value: "NOTE", label: "Note" },
] satisfies { value: CollectionUpdateType; label: string }[];

const STATUS_BY_TYPE = {
  CALL: [
    { value: "CONTACTED", label: "Contacted" },
    { value: "UNREACHABLE", label: "Unreachable" },
    { value: "PROMISED_TO_PAY", label: "Promised to Pay" },
    { value: "FOLLOW_UP_REQUIRED", label: "Follow-up Required" },
  ],
  VISIT: [
    { value: "VISITED", label: "Visited" },
    { value: "CONTACTED", label: "Contacted" },
    { value: "UNREACHABLE", label: "Unreachable" },
    { value: "PROMISED_TO_PAY", label: "Promised to Pay" },
    { value: "FOLLOW_UP_REQUIRED", label: "Follow-up Required" },
  ],
  PAYMENT: [
    { value: "PAID", label: "Fully Paid" },
    { value: "PARTIAL_PAYMENT", label: "Partial Payment" },
  ],
  NOTE: [
    { value: "FOLLOW_UP_REQUIRED", label: "Follow-up Required" },
    { value: "CONTACTED", label: "General Note" },
  ],
} satisfies Record<
  CollectionUpdateType,
  { value: CollectionUpdateStatus; label: string }[]
>;

const INITIAL_FORM: CreateCollectionUpdateRequest = {
  updateType: "CALL",
  status: "CONTACTED",
  amountPaid: null,
  promisedPaymentDate: null,
  promisedAmount: null,
  followUpDate: null,
  remarks: "",
};

function InfoBox({
  label,
  value,
  accent = "text-zinc-800 dark:text-zinc-300",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg bg-[#f4f4f5] p-3 dark:bg-[#18181b]">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-600">
        {label}
      </div>

      <div
        className={`font-mono text-[14px] font-medium tabular-nums ${accent}`}
      >
        {value}
      </div>
    </div>
  );
}

function FieldValue({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-0.5 font-mono text-[10px] uppercase text-zinc-500 dark:text-zinc-700">
        {label}
      </div>

      <div className="text-[13px] text-zinc-800 dark:text-zinc-200">
        {children}
      </div>
    </div>
  );
}

export default function AgentLoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { events } = useRealtime();

  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateCollectionUpdateRequest>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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

  useEffect(() => {
    const notificationType = events[0]?.payload.notification.type;

    if (
      notificationType === "LOAN_ASSIGNED" ||
      notificationType === "COLLECTION_UPDATE_CREATED"
    ) {
      void Promise.resolve().then(loadLoan);
    }
  }, [events, loadLoan]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.remarks.trim()) {
      setSubmitError("Remarks are required.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");

      await collecta.addCollectionUpdate(id, form);
      await loadLoan();

      setForm(INITIAL_FORM);
      setShowForm(false);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save update",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const showAmountPaid =
    form.updateType === "PAYMENT" &&
    (form.status === "PAID" || form.status === "PARTIAL_PAYMENT");

  const showPromised = form.status === "PROMISED_TO_PAY";

  const showFollowUp =
    form.status === "FOLLOW_UP_REQUIRED" ||
    form.status === "PROMISED_TO_PAY" ||
    form.status === "UNREACHABLE";

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

  if (!loan) {
    return (
      <div className="p-4 text-zinc-500 dark:text-zinc-500 sm:p-6">
        Loan not found
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Loans
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {loan.customer.businessName}
            </h1>

            <StatusBadge status={loan.status} />
            <BucketBadge bucket={loan.delinquencyBucket} />
          </div>

          <p className="font-mono text-[13px] text-orange-600 dark:text-amber-400">
            {loan.loanNumber}
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowForm((value) => !value)}
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Add Update"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <InfoBox
          label="Outstanding"
          value={formatMoney(loan.outstandingAmount)}
          accent="text-orange-600 dark:text-amber-400"
        />
        <InfoBox
          label="Overdue Amount"
          value={formatMoney(loan.overdueAmount)}
          accent="text-red-600 dark:text-red-400"
        />
        <InfoBox
          label="Days Past Due"
          value={`${loan.daysPastDue}d`}
          accent={
            loan.daysPastDue > 60
              ? "text-red-600 dark:text-red-400"
              : "text-orange-600 dark:text-amber-400"
          }
        />
        <InfoBox
          label="Monthly EMI"
          value={formatMoney(loan.monthlyInstallmentAmount)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="space-y-3 p-4">
          <div className="flex items-center gap-2 border-b border-[#e4e4e7] pb-2 dark:border-[#1e1e21]">
            <User className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-600" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
              Customer
            </span>
          </div>

          <div className="space-y-2">
            <FieldValue label="Business">
              {loan.customer.businessName}
            </FieldValue>

            <FieldValue label="Contact">
              {loan.customer.contactPerson}
            </FieldValue>

            <FieldValue label="Phone">
              <a
                href={`tel:${loan.customer.phone}`}
                className="flex items-center gap-1.5 font-mono text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Phone className="h-3 w-3" />
                {loan.customer.phone}
              </a>
            </FieldValue>
          </div>
        </Card>

        <Card className="space-y-3 p-4">
          <div className="flex items-center gap-2 border-b border-[#e4e4e7] pb-2 dark:border-[#1e1e21]">
            <Package className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-600" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
              Loan Details
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Product", value: loan.product.name },
              { label: "Principal", value: formatMoney(loan.principalAmount) },
              { label: "Due Day", value: `${loan.installmentDueDay}th` },
              {
                label: "Next Due",
                value: formatDate(loan.nextInstallmentDate),
              },
              { label: "Missed EMIs", value: `${loan.missedInstallmentCount}` },
            ].map(({ label, value }) => (
              <FieldValue key={label} label={label}>
                <span className="font-mono">{value}</span>
              </FieldValue>
            ))}
          </div>
        </Card>
      </div>

      {showForm ? (
        <Card className="border-orange-200 p-5 dark:border-amber-900/40">
          <h2 className="mb-5 font-mono text-[12px] uppercase tracking-widest text-orange-600 dark:text-amber-400">
            New Collection Update
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Update Type"
                value={form.updateType}
                onChange={(value) =>
                  setForm((current) => {
                    const updateType = value as CollectionUpdateType;

                    return {
                      ...current,
                      updateType,
                      status: STATUS_BY_TYPE[updateType][0].value,
                    };
                  })
                }
                options={UPDATE_TYPES}
                required
              />

              <Select
                label="Status / Outcome"
                value={form.status}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    status: value as CollectionUpdateStatus,
                  }))
                }
                options={STATUS_BY_TYPE[form.updateType]}
                required
              />
            </div>

            {showAmountPaid ? (
              <Input
                label="Amount Paid (MVR)"
                type="number"
                value={form.amountPaid ?? ""}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    amountPaid: value || null,
                  }))
                }
                placeholder="0.00"
                min="0"
              />
            ) : null}

            {showPromised ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Promised Amount (MVR)"
                  type="number"
                  value={form.promisedAmount ?? ""}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      promisedAmount: value || null,
                    }))
                  }
                  placeholder="0.00"
                  min="0"
                />

                <Input
                  label="Promised Payment Date"
                  type="date"
                  value={form.promisedPaymentDate ?? ""}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      promisedPaymentDate: value || null,
                    }))
                  }
                />
              </div>
            ) : null}

            {showFollowUp ? (
              <Input
                label="Follow-up Date"
                type="date"
                value={form.followUpDate ?? ""}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    followUpDate: value || null,
                  }))
                }
              />
            ) : null}

            <Textarea
              label="Remarks *"
              value={form.remarks}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  remarks: value,
                }))
              }
              placeholder="Describe the interaction, outcome, or any relevant notes…"
              required
              rows={3}
            />

            {submitError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
                {submitError}
              </div>
            ) : null}

            <div className="flex justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setForm(INITIAL_FORM);
                }}
              >
                Cancel
              </Button>

              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Saving…" : "Save Update"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div>
        <h2 className="mb-4 font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
          Collection History ({loan.updates.length})
        </h2>

        <UpdateTimeline updates={loan.updates} />
      </div>
    </div>
  );
}
