import React, { ReactNode } from "react";
import type {
  AuditSeverity,
  CollectionUpdateStatus,
  CollectionUpdateType,
  DelinquencyBucket,
  LoanStatus,
  UserRole,
} from "@collecta/shared/types";
import { X } from "lucide-react";

// Button

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  children,
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-40";

  const variants: Record<ButtonVariant, string> = {
    primary: `
      bg-orange-500 text-white
      hover:bg-orange-400
      active:bg-orange-600

      dark:bg-amber-500 dark:text-zinc-950
      dark:hover:bg-amber-400
      dark:active:bg-amber-600
    `,

    secondary: `
      bg-white text-zinc-900 border border-zinc-200
      hover:bg-zinc-100 hover:border-zinc-300

      dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700
      dark:hover:bg-zinc-700 dark:hover:border-zinc-600
    `,

    danger: `
      bg-red-500 text-white
      hover:bg-red-400
      active:bg-red-600

      dark:bg-red-950 dark:text-red-400 dark:border dark:border-red-900
      dark:hover:bg-red-900
    `,

    ghost: `
      text-zinc-600
      hover:text-zinc-900
      hover:bg-zinc-100

      dark:text-zinc-400
      dark:hover:text-zinc-200
      dark:hover:bg-zinc-800
    `,
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[12px]",
    md: "px-4 py-2 text-[13px]",
    lg: "px-5 py-2.5 text-sm",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Button

type BadgeProps = {
  className?: string;
};

const BADGE_BASE =
  "inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide";

const TEXT_BADGE_BASE = "text-[12px] font-medium";

const STATUS_STYLES = {
  OVERDUE:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
  ASSIGNED:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900",
  IN_PROGRESS:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
  PROMISED_TO_PAY:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900",
  PARTIALLY_PAID:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900",
  PAID: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900",
  CLOSED:
    "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800",
} satisfies Record<LoanStatus, string>;

const STATUS_LABELS = {
  OVERDUE: "Overdue",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  PROMISED_TO_PAY: "Promised",
  PARTIALLY_PAID: "Partial",
  PAID: "Paid",
  CLOSED: "Closed",
} satisfies Record<LoanStatus, string>;

export function StatusBadge({
  status,
  className = "",
}: BadgeProps & { status: LoanStatus }) {
  return (
    <span className={`${BADGE_BASE} ${STATUS_STYLES[status]} ${className}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

const BUCKET_STYLES = {
  CURRENT:
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900",
  DPD_1_30:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
  DPD_31_60:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900",
  DPD_61_90:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
  DPD_90_PLUS:
    "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-500 dark:border-red-800",
  LEGAL_REVIEW:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900",
} satisfies Record<DelinquencyBucket, string>;

const BUCKET_LABELS = {
  CURRENT: "Current",
  DPD_1_30: "1–30 DPD",
  DPD_31_60: "31–60 DPD",
  DPD_61_90: "61–90 DPD",
  DPD_90_PLUS: "90+ DPD",
  LEGAL_REVIEW: "Legal",
} satisfies Record<DelinquencyBucket, string>;

export function BucketBadge({
  bucket,
  className = "",
}: BadgeProps & { bucket: DelinquencyBucket }) {
  return (
    <span className={`${BADGE_BASE} ${BUCKET_STYLES[bucket]} ${className}`}>
      {BUCKET_LABELS[bucket]}
    </span>
  );
}

const SEVERITY_STYLES = {
  INFO: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800",
  WARNING:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
  SECURITY:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
} satisfies Record<AuditSeverity, string>;

export function SeverityBadge({
  severity,
  className = "",
}: BadgeProps & { severity: AuditSeverity }) {
  return (
    <span className={`${BADGE_BASE} ${SEVERITY_STYLES[severity]} ${className}`}>
      {severity}
    </span>
  );
}

const ROLE_STYLES = {
  SUPERVISOR:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
  AGENT:
    "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800",
} satisfies Record<UserRole, string>;

const ROLE_LABELS = {
  SUPERVISOR: "Supervisor",
  AGENT: "Agent",
} satisfies Record<UserRole, string>;

export function RoleBadge({
  role,
  className = "",
}: BadgeProps & { role: UserRole }) {
  return (
    <span className={`${BADGE_BASE} ${ROLE_STYLES[role]} ${className}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}

const UPDATE_TYPE_STYLES = {
  CALL: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900",
  VISIT:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
  PAYMENT:
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900",
  NOTE: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800",
} satisfies Record<CollectionUpdateType, string>;

export function UpdateTypeBadge({
  type,
  className = "",
}: BadgeProps & { type: CollectionUpdateType }) {
  return (
    <span className={`${BADGE_BASE} ${UPDATE_TYPE_STYLES[type]} ${className}`}>
      {type}
    </span>
  );
}

const UPDATE_STATUS_STYLES = {
  CONTACTED: "text-blue-700 dark:text-blue-400",
  VISITED: "text-amber-700 dark:text-amber-400",
  PROMISED_TO_PAY: "text-purple-700 dark:text-purple-400",
  PARTIAL_PAYMENT: "text-orange-700 dark:text-orange-400",
  PAID: "text-green-700 dark:text-green-400",
  UNREACHABLE: "text-red-700 dark:text-red-400",
  FOLLOW_UP_REQUIRED: "text-amber-700 dark:text-amber-400",
} satisfies Record<CollectionUpdateStatus, string>;

const UPDATE_STATUS_LABELS = {
  CONTACTED: "Contacted",
  VISITED: "Visited",
  PROMISED_TO_PAY: "Promised to Pay",
  PARTIAL_PAYMENT: "Partial Payment",
  PAID: "Paid",
  UNREACHABLE: "Unreachable",
  FOLLOW_UP_REQUIRED: "Follow-up Required",
} satisfies Record<CollectionUpdateStatus, string>;

export function UpdateStatusBadge({
  status,
  className = "",
}: BadgeProps & { status: CollectionUpdateStatus }) {
  return (
    <span
      className={`${TEXT_BADGE_BASE} ${UPDATE_STATUS_STYLES[status]} ${className}`}
    >
      {UPDATE_STATUS_LABELS[status]}
    </span>
  );
}

// Card

type CardProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-lg border border-[#e4e4e7] bg-white
        dark:border-[#27272a] dark:bg-[#111113]
        ${
          onClick
            ? "cursor-pointer transition-colors hover:border-[#a1a1aa] dark:hover:border-[#3f3f46]"
            : ""
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Loading

export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-orange-500 dark:border-zinc-700 dark:border-t-amber-500" />
    </div>
  );
}

// Formatters

export function formatMoney(
  amount: string | number | null | undefined,
): string {
  const n = Number(amount ?? 0);

  if (!Number.isFinite(n)) return "MVR 0";

  if (n >= 1_000_000) return `MVR ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `MVR ${(n / 1_000).toFixed(1)}K`;

  return `MVR ${n.toLocaleString("en-MV")}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-MV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-MV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Stat Card

type StatCardAccent = "amber" | "red" | "green" | "blue";

type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  accent?: StatCardAccent;
  className?: string;
};

const STAT_CARD_ACCENTS = {
  amber: "text-orange-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
  green: "text-green-600 dark:text-green-400",
  blue: "text-blue-600 dark:text-blue-400",
} satisfies Record<StatCardAccent, string>;

export function StatCard({
  label,
  value,
  sub,
  accent = "amber",
  className = "",
}: StatCardProps) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
        {label}
      </div>

      <div
        className={`
          font-display text-2xl font-bold tabular-nums
          ${STAT_CARD_ACCENTS[accent]}
        `}
      >
        {value}
      </div>

      {sub ? (
        <div className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-500">
          {sub}
        </div>
      ) : null}
    </Card>
  );
}

// Empty State

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-3xl mb-3">◉</div>
      <div className="text-zinc-500 text-sm">{message}</div>
    </div>
  );
}

// Modal

type ModalProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
};

export function Modal({
  title,
  children,
  onClose,
  className = "",
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm dark:bg-black/70"
      />

      {/* Modal */}
      <div
        className={`
          relative
          w-full
          max-w-lg
          overflow-hidden
          rounded-2xl
          border
          border-[#e4e4e7]
          bg-white
          shadow-2xl
          animate-in
          fade-in-0
          zoom-in-95
          duration-200

          dark:border-[#27272a]
          dark:bg-[#111113]

          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e4e4e7] px-5 py-4 dark:border-[#27272a]">
          <h3 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-md
              p-1.5
              text-zinc-500
              transition-colors

              hover:bg-zinc-100
              hover:text-zinc-900

              dark:text-zinc-500
              dark:hover:bg-zinc-800
              dark:hover:text-zinc-200
            "
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// Select

import { ChevronDown } from "lucide-react";

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
  className = "",
}: SelectProps) {
  return (
    <div className={className}>
      {label ? (
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          disabled={disabled}
          className="
            w-full
            appearance-none
            rounded-lg
            border
            border-[#e4e4e7]
            bg-white
            px-3
            py-2
            pr-10
            text-sm
            text-zinc-900
            transition-colors
            cursor-pointer

            focus:outline-none
            focus:border-orange-500

            disabled:cursor-not-allowed
            disabled:opacity-50

            dark:border-[#27272a]
            dark:bg-[#18181b]
            dark:text-zinc-100
            dark:focus:border-amber-600
          "
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          className="
            pointer-events-none
            absolute
            right-3
            top-1/2
            h-4
            w-4
            -translate-y-1/2
            text-zinc-400

            dark:text-zinc-600
          "
        />
      </div>
    </div>
  );
}

// Shared Field Styles

const LABEL_STYLES =
  "mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400";

const FIELD_STYLES = `
  w-full rounded-lg border px-3 py-2 text-sm transition-colors
  bg-white text-zinc-900 border-zinc-300
  placeholder:text-zinc-400

  focus:outline-none
  focus:border-orange-500
  focus:ring-2
  focus:ring-orange-500/10

  disabled:cursor-not-allowed
  disabled:opacity-50

  dark:bg-[#18181b]
  dark:text-zinc-100
  dark:border-[#27272a]
  dark:placeholder:text-zinc-600
  dark:focus:border-amber-600
  dark:focus:ring-amber-500/10
`;

// Input

type InputProps = {
  label?: string;
  type?: React.HTMLInputTypeAttribute;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  min?: string | number;
  max?: string | number;
  disabled?: boolean;
  autoComplete?: string;
  className?: string;
  inputClassName?: string;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  | "value"
  | "onChange"
  | "type"
  | "placeholder"
  | "required"
  | "min"
  | "max"
  | "disabled"
  | "className"
>;

export function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  min,
  max,
  disabled,
  autoComplete,
  className = "",
  inputClassName = "",
  ...props
}: InputProps) {
  return (
    <div className={className}>
      {label ? <label className={LABEL_STYLES}>{label}</label> : null}

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`${FIELD_STYLES} ${inputClassName}`}
        {...props}
      />
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────

type TextareaProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  className?: string;
  textareaClassName?: string;
} & Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  | "value"
  | "onChange"
  | "placeholder"
  | "required"
  | "disabled"
  | "rows"
  | "className"
>;

export function Textarea({
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  rows = 3,
  className = "",
  textareaClassName = "",
  ...props
}: TextareaProps) {
  return (
    <div className={className}>
      {label ? <label className={LABEL_STYLES}>{label}</label> : null}

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        className={`
          ${FIELD_STYLES}
          resize-none
          leading-relaxed
          ${textareaClassName}
        `}
        {...props}
      />
    </div>
  );
}
