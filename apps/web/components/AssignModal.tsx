"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";

import type { AgentItem } from "@collecta/shared/types";

import { collecta } from "@/lib/api";
import { Button, Modal, Select } from "@/components/ui";

type AssignModalProps = {
  loanNumber: string;
  currentAgentId?: string;
  closeAction: () => void;
  assignAction: (agentId: string) => Promise<void>;
};

export function AssignModal({
  loanNumber,
  currentAgentId,
  closeAction: onClose,
  assignAction: onAssign,
}: AssignModalProps) {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [selectedAgent, setSelectedAgent] = useState(currentAgentId ?? "");

  const [loadingAgents, setLoadingAgents] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAgents = async () => {
      try {
        setError("");

        const data = await collecta.getAgents();
        setAgents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load agents");
      } finally {
        setLoadingAgents(false);
      }
    };

    void Promise.resolve().then(loadAgents);
  }, []);

  const handleSubmit = async () => {
    if (!selectedAgent || submitting) return;

    try {
      setSubmitting(true);
      setError("");

      await onAssign(selectedAgent);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign loan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={`Assign Loan — ${loanNumber}`}
      onClose={onClose}
      className="max-w-md"
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-[#e4e4e7] bg-zinc-50 p-4 dark:border-[#27272a] dark:bg-[#18181b]">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:bg-amber-500/10 dark:text-amber-400">
              <UserPlus className="h-4 w-4" />
            </div>

            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-600">
                Loan Number
              </div>

              <div className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                {loanNumber}
              </div>
            </div>
          </div>

          <div className="text-[12px] text-zinc-600 dark:text-zinc-500">
            Assign this loan to a collection agent.
          </div>
        </div>

        <Select
          label="Select Agent"
          value={selectedAgent}
          onChange={setSelectedAgent}
          placeholder={
            loadingAgents ? "Loading agents..." : "Choose an agent..."
          }
          disabled={loadingAgents || submitting}
          options={agents.map((agent) => ({
            value: agent.id,
            label: `${agent.name} · ${agent.email}`,
          }))}
        />

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-[#e4e4e7] pt-4 dark:border-[#27272a]">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!selectedAgent || submitting}
          >
            {submitting ? "Assigning…" : "Assign Loan"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
