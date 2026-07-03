"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { use, useState } from "react";
import { api } from "@/lib/api";
import type { ScreeningFinding, Severity } from "@/lib/types";
import { Badge, Button, Card, EmptyState, SectionHeading, SeverityPill, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ key: Severity | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

export default function ScreeningPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = use(params);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Severity | "all">("all");

  const { data: docs } = useQuery({
    queryKey: ["documents", matterId],
    queryFn: () => api.listDocuments(matterId),
  });
  const { data: findings, isLoading } = useQuery({
    queryKey: ["findings", matterId],
    queryFn: () => api.listFindings(matterId),
  });

  const run = useMutation({
    mutationFn: (documentId: string) => api.runScreening(matterId, documentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["findings", matterId] });
      qc.invalidateQueries({ queryKey: ["matter", matterId] });
      qc.invalidateQueries({ queryKey: ["activity", matterId] });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateFinding(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["findings", matterId] });
      qc.invalidateQueries({ queryKey: ["matter", matterId] });
    },
  });

  const visible = (findings ?? []).filter((f) => filter === "all" || f.severity === filter);
  const counts = {
    high: findings?.filter((f) => f.severity === "high").length ?? 0,
    medium: findings?.filter((f) => f.severity === "medium").length ?? 0,
    low: findings?.filter((f) => f.severity === "low").length ?? 0,
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        index="Section 02 — Screening"
        title="Risk findings"
        desc="Run each document through the OpenAI screening engine to extract liability, term, and compliance risks — then accept or dismiss with a review trail."
      />

      {/* Run controls */}
      <Card className="p-5">
        <div className="mb-3 font-mono text-[0.66rem] uppercase tracking-wider text-ink-faint">
          Screen a document
        </div>
        {docs && docs.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {docs.map((d) => (
              <Button
                key={d.id}
                variant="outline"
                size="sm"
                disabled={run.isPending}
                onClick={() => run.mutate(d.id)}
              >
                {run.isPending && run.variables === d.id ? <Spinner /> : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" />
                  </svg>
                )}
                {d.name}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-faint">Upload a document first to screen it.</p>
        )}
        {run.isError && (
          <p className="mt-3 text-sm text-sev-high">{(run.error as Error).message}</p>
        )}
      </Card>

      {/* Severity summary + filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <SummaryStat label="High" value={counts.high} color="var(--sev-high)" />
          <SummaryStat label="Medium" value={counts.medium} color="var(--sev-med)" />
          <SummaryStat label="Low" value={counts.low} color="var(--sev-low)" />
        </div>
        <div className="flex gap-1 rounded-full border border-border-line bg-surface p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                filter === f.key ? "bg-oxblood text-[#fbf6ec]" : "text-ink-soft hover:text-ink"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Findings */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      ) : visible.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {visible.map((f, i) => (
              <FindingCard
                key={f.id}
                finding={f}
                index={i}
                onUpdate={(status) => update.mutate({ id: f.id, status })}
                busy={update.isPending && update.variables?.id === f.id}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState
          title={findings?.length ? "Nothing at this severity" : "No findings yet"}
          hint={
            findings?.length
              ? "Try a different severity filter."
              : "Screen a document above to generate risk findings."
          }
        />
      )}
    </div>
  );
}

function SummaryStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink-faint">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-ink">{value}</span> {label}
    </div>
  );
}

function FindingCard({
  finding,
  index,
  onUpdate,
  busy,
}: {
  finding: ScreeningFinding;
  index: number;
  onUpdate: (status: string) => void;
  busy: boolean;
}) {
  const resolved = finding.status !== "open";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: resolved ? 0.6 : 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <SeverityPill severity={finding.severity} />
            <Badge>{finding.category}</Badge>
            {resolved && (
              <span className="font-mono text-[0.62rem] uppercase tracking-wider text-ink-faint">
                {finding.status}
              </span>
            )}
          </div>
          {!resolved && (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => onUpdate("dismissed")}>
                Dismiss
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => onUpdate("accepted")}>
                {busy ? <Spinner /> : "Accept"}
              </Button>
            </div>
          )}
        </div>

        <h3 className={cn("mt-3 font-display text-lg font-medium text-ink", resolved && "line-through decoration-ink-faint/40")}>
          {finding.title}
        </h3>
        {finding.detail && <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{finding.detail}</p>}
        {finding.excerpt && (
          <blockquote className="mt-3 border-l-2 border-oxblood/40 bg-surface-2/60 py-2 pl-4 pr-3 font-display text-sm italic text-ink-soft">
            “{finding.excerpt}”
          </blockquote>
        )}
      </Card>
    </motion.div>
  );
}
