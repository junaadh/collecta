import type {
  CollectionUpdateItem,
  CollectionUpdateType,
} from "@collecta/shared/types";

import {
  FileText,
  CreditCard,
  MapPin,
  Phone,
  type LucideIcon,
} from "lucide-react";

import {
  formatDate,
  formatDateTime,
  formatMoney,
  UpdateStatusBadge,
  UpdateTypeBadge,
} from "@/components/ui";

const TYPE_ICONS = {
  CALL: Phone,
  VISIT: MapPin,
  PAYMENT: CreditCard,
  NOTE: FileText,
} satisfies Record<CollectionUpdateType, LucideIcon>;

type UpdateTimelineProps = {
  updates: CollectionUpdateItem[];
};

export function UpdateTimeline({ updates }: UpdateTimelineProps) {
  if (updates.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-600">
        No collection updates yet
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute bottom-2 left-5 top-2 w-px bg-[#e4e4e7] dark:bg-[#27272a]" />

      <ul className="space-y-4">
        {updates.map((update, index) => {
          const Icon = TYPE_ICONS[update.updateType];

          return (
            <li
              key={update.id}
              className="flex gap-4"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e4e4e7] bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#18181b]">
                <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-500" />
              </div>

              <article className="min-w-0 flex-1 rounded-lg border border-[#e4e4e7] bg-white p-4 dark:border-[#27272a] dark:bg-[#111113]">
                <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <UpdateTypeBadge type={update.updateType} />
                    <UpdateStatusBadge status={update.status} />
                  </div>

                  <span className="whitespace-nowrap font-mono text-[11px] text-zinc-500 dark:text-zinc-600">
                    {formatDateTime(update.createdAt)}
                  </span>
                </div>

                <p className="mb-3 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {update.remarks}
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-600">
                  <span>
                    Agent:{" "}
                    <span className="text-zinc-700 dark:text-zinc-400">
                      {update.agent.name}
                    </span>
                  </span>

                  {update.amountPaid ? (
                    <span>
                      Paid:{" "}
                      <span className="text-green-600 dark:text-green-400">
                        {formatMoney(update.amountPaid)}
                      </span>
                    </span>
                  ) : null}

                  {update.promisedAmount ? (
                    <span>
                      Promised:{" "}
                      <span className="text-purple-600 dark:text-purple-400">
                        {formatMoney(update.promisedAmount)}
                      </span>
                    </span>
                  ) : null}

                  {update.promisedPaymentDate ? (
                    <span>
                      PTP Date:{" "}
                      <span className="text-orange-600 dark:text-amber-400">
                        {formatDate(update.promisedPaymentDate)}
                      </span>
                    </span>
                  ) : null}

                  {update.followUpDate ? (
                    <span>
                      Follow-up:{" "}
                      <span className="text-blue-600 dark:text-blue-400">
                        {formatDate(update.followUpDate)}
                      </span>
                    </span>
                  ) : null}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
