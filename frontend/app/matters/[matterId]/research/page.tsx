"use client";

import { motion } from "motion/react";
import { use, useRef, useState } from "react";
import { researchStream } from "@/lib/api";
import type { Citation } from "@/lib/types";
import { Button, Card, SectionHeading, Spinner } from "@/components/ui";

const SUGGESTIONS = [
  "What are the indemnification obligations and are they capped?",
  "Summarize the termination and auto-renewal terms.",
  "Which governing law applies and where are disputes resolved?",
];

export default function ResearchPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = use(params);
  const [question, setQuestion] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function ask(q: string) {
    if (!q.trim() || streaming) return;
    setStreaming(true);
    setAnswer("");
    setCitations([]);
    setError(null);
    abortRef.current = new AbortController();
    try {
      await researchStream(
        { matter_id: matterId, question: q, jurisdiction: jurisdiction || undefined },
        {
          onCitations: (c) => setCitations(c as Citation[]),
          onToken: (t) => setAnswer((prev) => prev + t),
          onError: (msg) => {
            setError(msg);
            setStreaming(false);
          },
          onDone: () => setStreaming(false),
          signal: abortRef.current.signal,
        }
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        index="Section 04 — Research"
        title="Cited research"
        desc="Ask a question. Voyage retrieves the most relevant passages from this matter's documents, and OpenAI answers with inline citations you can trace back to the source."
      />

      {/* Composer */}
      <Card className="p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
        >
          <textarea
            className="w-full resize-none bg-transparent font-display text-xl leading-relaxed text-ink placeholder:text-ink-faint focus:outline-none"
            rows={2}
            placeholder="Ask anything about this matter's documents…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask(question);
            }}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-3">
            <input
              className="rounded-lg border border-border-line bg-surface px-3 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:border-oxblood focus:outline-none"
              placeholder="Jurisdiction (optional)"
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <span className="hidden font-mono text-[0.62rem] uppercase tracking-wider text-ink-faint sm:inline">
                ⌘ + ↵
              </span>
              <Button type="submit" disabled={streaming || !question.trim()}>
                {streaming ? <Spinner /> : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                )}
                {streaming ? "Researching…" : "Research"}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Suggestions */}
      {!answer && !streaming && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setQuestion(s);
                ask(s);
              }}
              className="rounded-full border border-border-line bg-surface/60 px-3.5 py-2 text-left text-xs text-ink-soft transition-colors hover:border-oxblood/50 hover:text-oxblood"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-sev-high">{error}</p>}

      {/* Answer + citations */}
      {(answer || streaming) && (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-7">
              <div className="mb-4 flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-wider text-ink-faint">
                <span className="h-1.5 w-1.5 rounded-full bg-oxblood" />
                Answer
              </div>
              <AnswerBody text={answer} />
              {streaming && (
                <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-oxblood align-middle" />
              )}
            </Card>
          </motion.div>

          <aside className="space-y-3">
            <div className="font-mono text-[0.66rem] uppercase tracking-wider text-ink-faint">
              Sources · {citations.length}
            </div>
            {citations.map((c, i) => (
              <motion.div
                key={c.index}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-4" id={`cite-${c.index}`}>
                  <div className="flex items-center justify-between">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-oxblood font-mono text-xs text-[#fbf6ec]">
                      {c.index}
                    </span>
                    <span className="font-mono text-[0.6rem] uppercase tracking-wider text-ink-faint">
                      {(c.score * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <p className="mt-2.5 truncate text-sm font-medium text-ink">
                    {c.document_name}
                  </p>
                  <p className="mt-1.5 line-clamp-4 text-xs leading-relaxed text-ink-soft">
                    {c.snippet}
                  </p>
                </Card>
              </motion.div>
            ))}
          </aside>
        </div>
      )}
    </div>
  );
}

// Render answer text: **bold** + inline [n] citation chips.
function AnswerBody({ text }: { text: string }) {
  const parts = text.split(/(\[\d+\]|\*\*[^*]+\*\*)/g);
  return (
    <div className="prose-legal whitespace-pre-wrap text-[0.98rem] text-ink-soft">
      {parts.map((part, i) => {
        const cite = part.match(/^\[(\d+)\]$/);
        if (cite) {
          return (
            <a
              key={i}
              href={`#cite-${cite[1]}`}
              className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-oxblood-tint px-1 align-super font-mono text-[0.62rem] font-medium text-oxblood no-underline transition-colors hover:bg-oxblood hover:text-[#fbf6ec]"
            >
              {cite[1]}
            </a>
          );
        }
        const bold = part.match(/^\*\*([^*]+)\*\*$/);
        if (bold) return <strong key={i}>{bold[1]}</strong>;
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
