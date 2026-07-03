"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Matter } from "@/lib/types";
import { relativeTime } from "@/lib/utils";
import { TopBar } from "@/components/topbar";
import { NewMatterDialog } from "@/components/new-matter-dialog";
import { Badge, Card, EmptyState } from "@/components/ui";

export default function DashboardPage() {
  const { data: matters, isLoading } = useQuery({
    queryKey: ["matters"],
    queryFn: api.listMatters,
  });

  const openFindings = matters?.reduce((s, m) => s + m.finding_count, 0) ?? 0;
  const totalDocs = matters?.reduce((s, m) => s + m.document_count, 0) ?? 0;

  return (
    <div className="min-h-screen">
      <TopBar />

      <main className="mx-auto max-w-7xl px-6 pb-24">
        {/* Hero */}
        <section className="rise relative overflow-hidden pt-16 pb-14">
          <div className="kicker mb-4">AI-native legal workspace</div>
          <h1 className="max-w-4xl font-display text-5xl font-medium leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Do the work of counsel, {" "}
            <span className="italic text-oxblood">with the receipts.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Screen documents for risk, draft and redline clauses, and research your matters —
            every answer grounded in your own files, with citations you can open and verify.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <NewMatterDialog />
            <div className="flex items-center gap-6 font-mono text-xs text-ink-faint">
              <Stat value={matters?.length ?? 0} label="matters" />
              <span className="text-border-line">·</span>
              <Stat value={totalDocs} label="documents" />
              <span className="text-border-line">·</span>
              <Stat value={openFindings} label="open findings" />
            </div>
          </div>
        </section>

        {/* Matters */}
        <section>
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-2xl font-medium text-ink">Your matters</h2>
            <span className="font-mono text-xs uppercase tracking-wider text-ink-faint">
              {matters?.length ?? 0} active
            </span>
          </div>

          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-52 rounded-xl" />
              ))}
            </div>
          ) : matters && matters.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {matters.map((m, i) => (
                <MatterCard key={m.id} matter={m} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No matters yet"
              hint="Open your first matter to start uploading documents and running AI workflows."
              action={<NewMatterDialog />}
            />
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <span>
      <span className="text-ink">{value}</span> {label}
    </span>
  );
}

function MatterCard({ matter, index }: { matter: Matter; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/matters/${matter.id}`}>
        <Card className="group h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:border-oxblood/40 hover:shadow-[var(--shadow)]">
          <div className="flex items-start justify-between gap-3">
            <Badge>{matter.practice_area ?? "General"}</Badge>
            {matter.finding_count > 0 && (
              <span className="inline-flex items-center gap-1 font-mono text-[0.62rem] uppercase tracking-wider text-sev-high">
                <span className="h-1.5 w-1.5 rounded-full bg-sev-high" />
                {matter.finding_count} open
              </span>
            )}
          </div>

          <h3 className="mt-4 font-display text-xl font-medium leading-snug text-ink transition-colors group-hover:text-oxblood">
            {matter.title}
          </h3>
          {matter.client && (
            <p className="mt-1 text-sm text-ink-faint">{matter.client}</p>
          )}
          {matter.summary && (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-soft">
              {matter.summary}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-border-soft pt-4 font-mono text-[0.66rem] uppercase tracking-wider text-ink-faint">
            <span>{matter.document_count} docs</span>
            <span>{relativeTime(matter.created_at)}</span>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
