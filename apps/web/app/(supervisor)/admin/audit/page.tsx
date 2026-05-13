"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";

import type { AuditItem } from "@collecta/shared/types";

import { collecta } from "@/lib/api";
import { useRealtime } from "@/context/realtime";

import {
  formatDateTime,
  LoadingSpinner,
  Modal,
  SeverityBadge,
} from "@/components/ui";

export default function AuditPage() {
  const { events } = useRealtime();

  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AuditItem | null>(null);

  const loadAuditLogs = useCallback(async () => {
    try {
      setError("");

      const data = await collecta.getAuditLogs();
      setLogs(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load audit logs",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadAuditLogs);
  }, [loadAuditLogs]);

  useEffect(() => {
    const notificationType = events[0]?.payload.notification.type;

    if (
      notificationType === "LOAN_ASSIGNED" ||
      notificationType === "COLLECTION_UPDATE_CREATED"
    ) {
      void Promise.resolve().then(loadAuditLogs);
    }
  }, [events, loadAuditLogs]);

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
          Audit Trail
        </h1>

        <p className="mt-0.5 font-mono text-[12px] text-zinc-500 dark:text-zinc-600">
          {logs.length} events · System activity log
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#111113]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-245 border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#e4e4e7] dark:border-[#1e1e21]">
                {[
                  "Severity",
                  "Action",
                  "Actor",
                  "Entity",
                  "IP Address",
                  "Timestamp",
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
              {logs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelected(log)}
                  className="group cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-[#16161a]"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    <SeverityBadge severity={log.severity} />
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-zinc-800 dark:text-zinc-300">
                    {log.action.replaceAll("_", " ")}
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-[13px] text-zinc-900 dark:text-zinc-300">
                      {log.actor.name}
                    </div>

                    <div className="text-[11px] text-zinc-500 dark:text-zinc-600">
                      {log.actor.email}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-mono text-[12px] text-zinc-600 dark:text-zinc-500">
                      {log.entityType}
                    </div>

                    <div className="max-w-30 truncate font-mono text-[11px] text-zinc-400 dark:text-zinc-700">
                      {log.entityId}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-zinc-500 dark:text-zinc-600">
                    {log.ipAddress ?? "—"}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-zinc-500 dark:text-zinc-500">
                    {formatDateTime(log.createdAt)}
                  </td>

                  <td className="px-4 py-3">
                    <ChevronRight className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-orange-500 dark:text-zinc-700 dark:group-hover:text-amber-500" />
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-600"
                  >
                    No audit logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? (
        <Modal
          title={`Audit Event — ${selected.action}`}
          onClose={() => setSelected(null)}
        >
          <div className="space-y-3">
            {[
              {
                label: "Action",
                value: selected.action,
              },
              {
                label: "Severity",
                value: selected.severity,
              },
              {
                label: "Actor",
                value: `${selected.actor.name} (${selected.actor.email})`,
              },
              {
                label: "Entity Type",
                value: selected.entityType,
              },
              {
                label: "Entity ID",
                value: selected.entityId,
              },
              {
                label: "IP Address",
                value: selected.ipAddress ?? "N/A",
              },
              {
                label: "Timestamp",
                value: formatDateTime(selected.createdAt),
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4 border-b border-[#e4e4e7] py-2 dark:border-[#1e1e21]"
              >
                <span className="shrink-0 font-mono text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-600">
                  {label}
                </span>

                <span className="text-right font-mono text-[13px] text-zinc-800 dark:text-zinc-300">
                  {value}
                </span>
              </div>
            ))}

            <div className="pt-2">
              <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-600">
                Metadata
              </div>

              <pre className="max-h-64 overflow-auto rounded-lg border border-[#e4e4e7] bg-[#f4f4f5] p-3 font-mono text-[12px] text-zinc-800 dark:border-[#27272a] dark:bg-[#18181b] dark:text-zinc-300">
                {JSON.stringify(selected.metadata, null, 2)}
              </pre>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
