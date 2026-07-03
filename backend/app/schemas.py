from __future__ import annotations

from pydantic import BaseModel


# ---- Matters -------------------------------------------------------------
class MatterCreate(BaseModel):
    title: str
    client: str | None = None
    practice_area: str | None = None
    summary: str | None = None


class Matter(BaseModel):
    id: str
    title: str
    client: str | None = None
    practice_area: str | None = None
    status: str = "active"
    summary: str | None = None
    created_at: str
    document_count: int = 0
    finding_count: int = 0


class Activity(BaseModel):
    id: str
    matter_id: str
    kind: str
    title: str
    detail: str | None = None
    created_at: str


# ---- Documents -----------------------------------------------------------
class Document(BaseModel):
    id: str
    matter_id: str
    name: str
    kind: str | None = None
    status: str
    pages: int
    created_at: str


# ---- Research ------------------------------------------------------------
class ResearchQuery(BaseModel):
    matter_id: str
    question: str
    jurisdiction: str | None = None


class Citation(BaseModel):
    index: int
    document_id: str
    document_name: str
    snippet: str
    score: float


class ResearchAnswer(BaseModel):
    answer: str
    citations: list[Citation]


# ---- Screening -----------------------------------------------------------
class ScreeningFinding(BaseModel):
    id: str
    matter_id: str
    document_id: str | None = None
    severity: str
    category: str
    title: str
    detail: str | None = None
    excerpt: str | None = None
    status: str = "open"
    created_at: str


class FindingStatusUpdate(BaseModel):
    status: str  # open | accepted | dismissed


# ---- Drafting ------------------------------------------------------------
class DraftRequest(BaseModel):
    matter_id: str
    clause_type: str
    instructions: str | None = None
    party_a: str | None = None
    party_b: str | None = None


class RedlineRequest(BaseModel):
    original: str
    instructions: str


class RedlineSegment(BaseModel):
    op: str  # equal | insert | delete
    text: str


class RedlineResponse(BaseModel):
    revised: str
    segments: list[RedlineSegment]
    rationale: str
