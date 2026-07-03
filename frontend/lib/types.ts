export interface Matter {
  id: string;
  title: string;
  client?: string | null;
  practice_area?: string | null;
  status: string;
  summary?: string | null;
  created_at: string;
  document_count: number;
  finding_count: number;
}

export interface Activity {
  id: string;
  matter_id: string;
  kind: string;
  title: string;
  detail?: string | null;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  matter_id: string;
  name: string;
  kind?: string | null;
  status: string;
  pages: number;
  created_at: string;
}

export interface Citation {
  index: number;
  document_id: string;
  document_name: string;
  snippet: string;
  score: number;
}

export interface ResearchAnswer {
  answer: string;
  citations: Citation[];
}

export type Severity = "high" | "medium" | "low";

export interface ScreeningFinding {
  id: string;
  matter_id: string;
  document_id?: string | null;
  severity: Severity;
  category: string;
  title: string;
  detail?: string | null;
  excerpt?: string | null;
  status: "open" | "accepted" | "dismissed";
  created_at: string;
}

export interface RedlineSegment {
  op: "equal" | "insert" | "delete";
  text: string;
}

export interface RedlineResponse {
  revised: string;
  segments: RedlineSegment[];
  rationale: string;
}

export interface Health {
  status: string;
  offline: boolean;
  embed_model: string;
  llm_model: string;
  voyage_configured: boolean;
  openai_configured: boolean;
}
