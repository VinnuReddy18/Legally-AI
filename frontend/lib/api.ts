import type {
  Activity,
  DocumentItem,
  Health,
  Matter,
  RedlineResponse,
  ResearchAnswer,
  ScreeningFinding,
} from "./types";

// Same-origin: next.config.mjs rewrites /api/* to the FastAPI backend.
const BASE = "/api/v1";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${detail ? ` — ${detail}` : ""}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  health: () => req<Health>("/health"),

  // Matters
  listMatters: () => req<Matter[]>("/matters"),
  getMatter: (id: string) => req<Matter>(`/matters/${id}`),
  createMatter: (body: {
    title: string;
    client?: string;
    practice_area?: string;
    summary?: string;
  }) => req<Matter>("/matters", { method: "POST", body: JSON.stringify(body) }),
  getActivity: (id: string) => req<Activity[]>(`/matters/${id}/activity`),

  // Documents
  listDocuments: (matterId: string) =>
    req<DocumentItem[]>(`/documents?matter_id=${matterId}`),
  uploadDocument: (matterId: string, file: File) => {
    const fd = new FormData();
    fd.append("matter_id", matterId);
    fd.append("file", file);
    return req<DocumentItem>("/documents/upload", { method: "POST", body: fd });
  },

  // Research
  research: (body: { matter_id: string; question: string; jurisdiction?: string }) =>
    req<ResearchAnswer>("/research", { method: "POST", body: JSON.stringify(body) }),

  // Screening
  listFindings: (matterId: string) =>
    req<ScreeningFinding[]>(`/screening/findings?matter_id=${matterId}`),
  runScreening: (matterId: string, documentId: string) =>
    req<ScreeningFinding[]>(
      `/screening/runs?matter_id=${matterId}&document_id=${documentId}`,
      { method: "POST" }
    ),
  updateFinding: (findingId: string, status: string) =>
    req<ScreeningFinding>(`/screening/findings/${findingId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Drafting
  generateClause: (body: {
    matter_id: string;
    clause_type: string;
    instructions?: string;
    party_a?: string;
    party_b?: string;
  }) => req<{ clause_type: string; text: string }>("/drafting/generate", {
    method: "POST",
    body: JSON.stringify(body),
  }),
  redline: (body: { original: string; instructions: string }) =>
    req<RedlineResponse>("/drafting/redline", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// Streaming research over SSE. Calls onCitations once, then onToken per chunk.
export async function researchStream(
  body: { matter_id: string; question: string; jurisdiction?: string },
  handlers: {
    onCitations?: (c: unknown) => void;
    onToken?: (t: string) => void;
    onError?: (message: string) => void;
    onDone?: () => void;
    signal?: AbortSignal;
  }
): Promise<void> {
  const res = await fetch(`${BASE}/research/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: handlers.signal,
  });
  if (!res.ok || !res.body) throw new Error(`Stream failed: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const raw of events) {
      const lines = raw.split("\n");
      const evLine = lines.find((l) => l.startsWith("event:"));
      const dataLine = lines.find((l) => l.startsWith("data:"));
      if (!evLine || !dataLine) continue;
      const event = evLine.slice(6).trim();
      const data = dataLine.slice(5).trim();
      if (event === "citations") handlers.onCitations?.(JSON.parse(data));
      else if (event === "token") handlers.onToken?.(JSON.parse(data));
      else if (event === "error") handlers.onError?.(JSON.parse(data));
      else if (event === "done") handlers.onDone?.();
    }
  }
}
