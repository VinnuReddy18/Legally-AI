"use client";

import { useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import { use, useState } from "react";
import { api } from "@/lib/api";
import type { RedlineResponse } from "@/lib/types";
import { Button, Card, SectionHeading, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";

const CLAUSE_TYPES = [
  "Confidentiality",
  "Indemnification",
  "Limitation of Liability",
  "Termination",
  "Governing Law",
  "Intellectual Property",
  "Payment Terms",
  "Non-Solicitation",
];

export default function DraftingPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = use(params);

  const [clauseType, setClauseType] = useState(CLAUSE_TYPES[0]);
  const [instructions, setInstructions] = useState("");
  const [draft, setDraft] = useState("");

  const [redlineInstruction, setRedlineInstruction] = useState("");
  const [redline, setRedline] = useState<RedlineResponse | null>(null);

  const generate = useMutation({
    mutationFn: () =>
      api.generateClause({ matter_id: matterId, clause_type: clauseType, instructions }),
    onSuccess: (data) => {
      setDraft(data.text);
      setRedline(null);
    },
  });

  const doRedline = useMutation({
    mutationFn: () => api.redline({ original: draft, instructions: redlineInstruction }),
    onSuccess: (data) => setRedline(data),
  });

  const field =
    "w-full rounded-lg border border-border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-oxblood focus:outline-none focus:ring-2 focus:ring-oxblood/20";

  return (
    <div className="space-y-8">
      <SectionHeading
        index="Section 03 — Drafting"
        title="Draft & redline"
        desc="Generate a clause with OpenAI, then issue a revision instruction to see a tracked, word-level redline you can review before accepting."
      />

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        {/* Left: controls */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-4 font-mono text-[0.66rem] uppercase tracking-wider text-ink-faint">
              Generate clause
            </div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Clause type</label>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {CLAUSE_TYPES.map((c) => (
                <button
                  key={c}
                  onClick={() => setClauseType(c)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    clauseType === c
                      ? "border-oxblood bg-oxblood text-[#fbf6ec]"
                      : "border-border-line text-ink-soft hover:border-oxblood/50"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">
              Instructions <span className="text-ink-faint">(optional)</span>
            </label>
            <textarea
              className={field}
              rows={3}
              placeholder="e.g. mutual, 3-year survival, carve-out for compelled disclosure"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
            <Button
              className="mt-4 w-full"
              disabled={generate.isPending}
              onClick={() => generate.mutate()}
            >
              {generate.isPending ? <Spinner /> : null}
              {generate.isPending ? "Drafting…" : "Generate clause"}
            </Button>
          </Card>

          {draft && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-5">
                <div className="mb-3 font-mono text-[0.66rem] uppercase tracking-wider text-ink-faint">
                  Redline instruction
                </div>
                <textarea
                  className={field}
                  rows={3}
                  placeholder="e.g. make the cap 12 months of fees and add a mutual carve-out"
                  value={redlineInstruction}
                  onChange={(e) => setRedlineInstruction(e.target.value)}
                />
                <Button
                  variant="outline"
                  className="mt-3 w-full"
                  disabled={doRedline.isPending || !redlineInstruction.trim()}
                  onClick={() => doRedline.mutate()}
                >
                  {doRedline.isPending ? <Spinner /> : null}
                  {doRedline.isPending ? "Revising…" : "Propose redline"}
                </Button>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right: editor / diff */}
        <div>
          {!draft ? (
            <Card className="grid h-full min-h-[24rem] place-items-center p-10 text-center">
              <div>
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-gold-tint text-gold">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 20h16M4 20l1-4 11-11 3 3-11 11z" />
                  </svg>
                </div>
                <p className="font-display text-lg text-ink">Your draft appears here</p>
                <p className="mt-1 text-sm text-ink-faint">
                  Choose a clause type and generate to begin.
                </p>
              </div>
            </Card>
          ) : redline ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="font-mono text-[0.66rem] uppercase tracking-wider text-ink-faint">
                    Proposed redline
                  </div>
                  <div className="flex items-center gap-4 font-mono text-[0.62rem] uppercase tracking-wider">
                    <span className="text-ins">+ inserted</span>
                    <span className="text-del">− deleted</span>
                  </div>
                </div>
                <div className="prose-legal whitespace-pre-wrap font-display text-[0.95rem] leading-relaxed text-ink">
                  {redline.segments.map((seg, i) => {
                    if (seg.op === "equal") return <span key={i}>{seg.text}</span>;
                    if (seg.op === "insert")
                      return (
                        <span key={i} className="rounded bg-ins-bg px-0.5 text-ins">
                          {seg.text}
                        </span>
                      );
                    return (
                      <span key={i} className="rounded bg-del-bg px-0.5 text-del line-through">
                        {seg.text}
                      </span>
                    );
                  })}
                </div>
                {redline.rationale && (
                  <div className="mt-5 rounded-lg border border-border-soft bg-surface-2/60 p-4">
                    <div className="mb-1 font-mono text-[0.62rem] uppercase tracking-wider text-ink-faint">
                      Rationale
                    </div>
                    <p className="text-sm text-ink-soft">{redline.rationale}</p>
                  </div>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setRedline(null)}>
                    Discard
                  </Button>
                  <Button
                    onClick={() => {
                      setDraft(redline.revised);
                      setRedline(null);
                      setRedlineInstruction("");
                    }}
                  >
                    Accept revision
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="p-6">
                <div className="mb-4 font-mono text-[0.66rem] uppercase tracking-wider text-ink-faint">
                  {clauseType} · draft
                </div>
                <textarea
                  className="min-h-[22rem] w-full resize-y bg-transparent font-display text-[0.95rem] leading-relaxed text-ink focus:outline-none"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
