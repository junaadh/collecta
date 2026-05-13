"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import type { LoanListItem } from "@collecta/shared/types";

import { BucketBadge, StatusBadge, formatMoney } from "@/components/ui";

type LoanTableProps = {
  loans: LoanListItem[];
  basePath: string;
  showAssignment?: boolean;
  emptyMessage?: string;
};

type Column = {
  key: string;
  label: string;
  className?: string;
};

export function LoanTable({
  loans,
  basePath,
  showAssignment = false,
  emptyMessage = "No loans found",
}: LoanTableProps) {
  const router = useRouter();

  const columns = useMemo<Column[]>(() => {
    return [
      {
        key: "loan",
        label: "Loan #",
      },
      {
        key: "business",
        label: "Business",
      },
      {
        key: "product",
        label: "Product",
      },
      {
        key: "outstanding",
        label: "Outstanding",
      },
      {
        key: "overdue",
        label: "Overdue",
      },
      {
        key: "dpd",
        label: "DPD",
      },
      {
        key: "bucket",
        label: "Bucket",
      },
      {
        key: "status",
        label: "Status",
      },
      ...(showAssignment
        ? [
            {
              key: "assignment",
              label: "Agent",
            },
          ]
        : []),
      {
        key: "action",
        label: "",
        className: "w-10",
      },
    ];
  }, [showAssignment]);

  if (loans.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-zinc-500 dark:text-zinc-600">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-240 border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#e4e4e7] dark:border-[#1e1e21]">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`whitespace-nowrap px-4 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600 ${column.className ?? ""}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-[#eeeeef] dark:divide-[#1a1a1c]">
          {loans.map((loan) => (
            <tr
              key={loan.id}
              onClick={() => router.push(`${basePath}/${loan.id}`)}
              className="group cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-[#16161a]"
            >
              <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-orange-600 dark:text-amber-400">
                {loan.loanNumber}
              </td>

              <td className="px-4 py-3">
                <div className="max-w-55 truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-200">
                  {loan.customer.businessName}
                </div>

                <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-600">
                  {loan.customer.contactPerson}
                </div>
              </td>

              <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-600 dark:text-zinc-500">
                {loan.product.name}
              </td>

              <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] tabular-nums text-zinc-800 dark:text-zinc-300">
                {formatMoney(loan.outstandingAmount)}
              </td>

              <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] tabular-nums text-red-600 dark:text-red-400">
                {formatMoney(loan.overdueAmount)}
              </td>

              <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-zinc-600 dark:text-zinc-400">
                {loan.daysPastDue}d
              </td>

              <td className="whitespace-nowrap px-4 py-3">
                <BucketBadge bucket={loan.delinquencyBucket} />
              </td>

              <td className="whitespace-nowrap px-4 py-3">
                <StatusBadge status={loan.status} />
              </td>

              {showAssignment && (
                <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-500 dark:text-zinc-600">
                  —
                </td>
              )}

              <td className="px-4 py-3 text-right">
                <ArrowRight className="ml-auto h-4 w-4 text-zinc-400 transition-colors group-hover:text-orange-500 dark:text-zinc-700 dark:group-hover:text-amber-500" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
