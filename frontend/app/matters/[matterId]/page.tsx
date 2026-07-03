"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import Link from "next/link";
import { use } from "react";
import { api } from "@/lib/api";
import type { Activity } from "@/lib/types";
import { relativeTime } from "@/lib/utils";
import { Card, SectionHeading } from "@/components/ui";

const WORKFLOWS = [
  {
    key: "screening",
    title: "Screening",
    desc: "Surface risk findings across intake documents.",
    accent: "var(--sev-high)",
  },
  {
    key: "drafting",
    title: "Drafting & Redline",
    desc: "Generate clauses and mark up revisions.",
    accent: "var(--gold)",
  },
  {
    key: "research",
    title: "Research",
    desc: "Ask questions, get cited answers from the file.",
    accent: "var(--oxblood)",
  },
];

const KIND_ICON: Record<string, string> = {
  matter: "M3 3h18v4H3zM3 10h18v11H3z",
  document: "M6 2h9l5 5v15H6zM15 2v5h5",
  screening: "M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z",
  research: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.5-4.5",
  drafting: "M4 20h16M4 20l1-4 11-11 3 3-11 11z",
};

export default function OverviewPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = use(params);
  const { data: matter } = useQuery({
    queryKey: ["matter", matterId],
    queryFn: () => api.getMatter(matterId),
  });
  const { data: activity } = useQuery({
    queryKey: ["activity", matterId],
    queryFn: () => api.getActivity(matterId),
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-8">
        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-7">
            <div className="kicker mb-3">Engagement brief</div>
            <p className="font-display text-xl leading-relaxed text-ink">
              {matter?.summary ?? "No summary provided for this matter yet."}
            </p>
          </Card>
        </motion.div>

        {/* Workflow launch tiles */}
        <div>
          <SectionHeading index="Workflows" title="Pick up where it matters" />
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {WORKFLOWS.map((w, i) => (
              <motion.div
                key={w.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.07 }}
              >
                <Link href={`/matters/${matterId}/${w.key}`}>
                  <Card className="group relative h-full overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow)]">
                    <span
                      className="absolute inset-x-0 top-0 h-1 opacity-70"
                      style={{ background: w.accent }}
                    />
                    <h3 className="mt-2 font-display text-lg font-medium text-ink transition-colors group-hover:text-oxblood">
                      {w.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{w.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1 font-mono text-[0.66rem] uppercase tracking-wider text-ink-faint transition-colors group-hover:text-oxblood">
                      Open
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity timeline */}
      <aside>
        <SectionHeading index="History" title="Activity" />
        <div className="mt-5">
          {activity && activity.length > 0 ? (
            <ol className="relative space-y-1 border-l border-border-line pl-5">
              {activity.map((a, i) => (
                <TimelineItem key={a.id} item={a} index={i} />
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink-faint">No activity recorded yet.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

function TimelineItem({ item, index }: { item: Activity; index: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="relative py-2.5"
    >
      <span className="absolute -left-[1.55rem] top-3.5 grid h-6 w-6 place-items-center rounded-full border border-border-line bg-surface text-ink-faint">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d={KIND_ICON[item.kind] ?? KIND_ICON.document} />
        </svg>
      </span>
      <p className="text-sm font-medium text-ink">{item.title}</p>
      {item.detail && <p className="mt-0.5 text-xs text-ink-soft">{item.detail}</p>}
      <p className="mt-0.5 font-mono text-[0.62rem] uppercase tracking-wider text-ink-faint">
        {relativeTime(item.created_at)}
      </p>
    </motion.li>
  );
}
