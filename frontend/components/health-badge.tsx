"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function HealthBadge() {
  const { data } = useQuery({ queryKey: ["health"], queryFn: api.health });
  if (!data) return null;

  const live = data.voyage_configured && data.openai_configured && !data.offline;
  return (
    <div
      className="hidden items-center gap-2 rounded-full border border-border-line bg-surface/60 px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-wider text-ink-soft sm:flex"
      title={`Embeddings: ${data.embed_model} · LLM: ${data.llm_model}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${live ? "bg-sev-low" : "bg-sev-med"} ${
          live ? "" : "animate-pulse"
        }`}
      />
      {live ? "Live" : "Offline mode"}
    </div>
  );
}
