"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import { api } from "@/lib/api";
import { TopBar } from "@/components/topbar";
import { WorkspaceNav } from "@/components/workspace-nav";
import { Badge } from "@/components/ui";

export default function MatterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = use(params);
  const { data: matter } = useQuery({
    queryKey: ["matter", matterId],
    queryFn: () => api.getMatter(matterId),
  });

  return (
    <div className="min-h-screen">
      <TopBar />

      <div className="border-b border-border-soft bg-paper/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center gap-2 pt-6 font-mono text-[0.66rem] uppercase tracking-wider text-ink-faint">
            <Link href="/" className="transition-colors hover:text-oxblood">
              Matters
            </Link>
            <span>/</span>
            <span className="text-ink-soft">{matter?.practice_area ?? "…"}</span>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4 pt-3 pb-5">
            <div>
              <h1 className="font-display text-3xl font-medium tracking-tight text-ink">
                {matter?.title ?? "Loading matter…"}
              </h1>
              {matter?.client && (
                <p className="mt-1 text-sm text-ink-soft">{matter.client}</p>
              )}
            </div>
            {matter && (
              <div className="flex items-center gap-2">
                <Badge>{matter.document_count} documents</Badge>
                {matter.finding_count > 0 && (
                  <Badge className="border-sev-high/30 text-sev-high">
                    {matter.finding_count} open findings
                  </Badge>
                )}
              </div>
            )}
          </div>

          <WorkspaceNav matterId={matterId} />
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
