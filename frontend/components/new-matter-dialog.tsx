"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button, Spinner } from "./ui";

export function NewMatterDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", client: "", practice_area: "", summary: "" });
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.createMatter(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matters"] });
      setOpen(false);
      setForm({ title: "", client: "", practice_area: "", summary: "" });
    },
  });

  const field =
    "w-full rounded-lg border border-border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-oxblood focus:outline-none focus:ring-2 focus:ring-oxblood/20";

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New matter
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-[#100c06]/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="relative w-full max-w-lg rounded-xl border border-border-line bg-surface p-7 shadow-2xl"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
            >
              <div className="kicker mb-2">New engagement</div>
              <h2 className="font-display text-2xl font-medium text-ink">Open a matter</h2>
              <p className="mt-1 text-sm text-ink-faint">
                A matter is the workspace for one engagement — its documents, findings, drafts and research.
              </p>

              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (form.title.trim()) mutation.mutate();
                }}
              >
                <div>
                  <label className="mb-1.5 block font-mono text-[0.66rem] uppercase tracking-wider text-ink-faint">
                    Matter title
                  </label>
                  <input
                    autoFocus
                    className={field}
                    placeholder="Acme Corp — Series B Financing"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block font-mono text-[0.66rem] uppercase tracking-wider text-ink-faint">
                      Client
                    </label>
                    <input
                      className={field}
                      placeholder="Acme Corp"
                      value={form.client}
                      onChange={(e) => setForm({ ...form, client: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block font-mono text-[0.66rem] uppercase tracking-wider text-ink-faint">
                      Practice area
                    </label>
                    <input
                      className={field}
                      placeholder="Corporate / M&A"
                      value={form.practice_area}
                      onChange={(e) => setForm({ ...form, practice_area: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[0.66rem] uppercase tracking-wider text-ink-faint">
                    Summary
                  </label>
                  <textarea
                    className={field}
                    rows={3}
                    placeholder="What is this engagement about?"
                    value={form.summary}
                    onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  />
                </div>

                {mutation.isError && (
                  <p className="text-sm text-sev-high">{(mutation.error as Error).message}</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!form.title.trim() || mutation.isPending}>
                    {mutation.isPending && <Spinner />}
                    Create matter
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
