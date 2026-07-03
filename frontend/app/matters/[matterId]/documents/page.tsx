"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { use, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { DocumentItem } from "@/lib/types";
import { relativeTime } from "@/lib/utils";
import { Badge, Card, EmptyState, SectionHeading, Spinner } from "@/components/ui";

export default function DocumentsPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = use(params);
  const qc = useQueryClient();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: docs, isLoading } = useQuery({
    queryKey: ["documents", matterId],
    queryFn: () => api.listDocuments(matterId),
  });

  const upload = useMutation({
    mutationFn: (file: File) => api.uploadDocument(matterId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", matterId] });
      qc.invalidateQueries({ queryKey: ["matter", matterId] });
      qc.invalidateQueries({ queryKey: ["activity", matterId] });
    },
  });

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((f) => upload.mutate(f));
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        index="Section 01 — Intake"
        title="Documents"
        desc="Upload contracts and filings. Each file is parsed, chunked, and embedded with Voyage so it becomes searchable and screenable."
      />

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
          dragging
            ? "border-oxblood bg-oxblood-tint/40"
            : "border-border-line bg-surface/40 hover:border-oxblood/50 hover:bg-surface/70"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-oxblood-tint text-oxblood">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4M6 10l6-6 6 6M4 20h16" />
          </svg>
        </div>
        <p className="font-display text-lg text-ink">Drop documents here</p>
        <p className="mt-1 text-sm text-ink-faint">PDF, DOCX, TXT or Markdown · or click to browse</p>
        {upload.isPending && (
          <p className="mt-3 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-oxblood">
            <Spinner /> Ingesting & embedding…
          </p>
        )}
        {upload.isError && (
          <p className="mt-3 text-sm text-sev-high">{(upload.error as Error).message}</p>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : docs && docs.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {docs.map((d, i) => (
              <DocumentRow key={d.id} doc={d} index={i} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState title="No documents yet" hint="Upload a file above to get started." />
      )}
    </div>
  );
}

function DocumentRow({ doc, index }: { doc: DocumentItem; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card className="flex items-center gap-4 p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-surface-2 font-mono text-[0.6rem] uppercase text-ink-faint">
          {(doc.kind ?? "doc").slice(0, 4)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{doc.name}</p>
          <p className="mt-0.5 font-mono text-[0.66rem] uppercase tracking-wider text-ink-faint">
            {doc.pages} pages · {relativeTime(doc.created_at)}
          </p>
        </div>
        <Badge
          className={
            doc.status === "ready"
              ? "border-sev-low/30 text-sev-low"
              : "border-sev-med/30 text-sev-med"
          }
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              doc.status === "ready" ? "bg-sev-low" : "animate-pulse bg-sev-med"
            }`}
          />
          {doc.status}
        </Badge>
      </Card>
    </motion.div>
  );
}
