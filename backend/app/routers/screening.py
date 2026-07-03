from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from .. import db
from ..ai import llm
from ..schemas import FindingStatusUpdate, ScreeningFinding
from .matters import log_activity

router = APIRouter(prefix="/api/v1/screening", tags=["screening"])

SYSTEM = (
    "You are a contract risk-screening engine for a law firm. Given a legal document, "
    "identify concrete risk findings. Return STRICT JSON of the form "
    '{"findings": [{"severity": "high|medium|low", "category": str, "title": str, '
    '"detail": str, "excerpt": str}]}. severity reflects legal/financial exposure. '
    "category is a short label (e.g. Liability, Indemnity, Term, Governing Law, Confidentiality, "
    "Payment, IP). excerpt quotes the offending language verbatim when possible. Find 3-8 findings."
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/findings", response_model=list[ScreeningFinding])
def list_findings(matter_id: str) -> list[ScreeningFinding]:
    with db.connect() as conn:
        rows = conn.execute(
            "SELECT * FROM screening_findings WHERE matter_id = ? "
            "ORDER BY CASE severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, created_at DESC",
            (matter_id,),
        ).fetchall()
    return [ScreeningFinding(**r) for r in rows]


@router.post("/runs", response_model=list[ScreeningFinding], status_code=201)
def run_screening(matter_id: str, document_id: str) -> list[ScreeningFinding]:
    with db.connect() as conn:
        doc = conn.execute(
            "SELECT name, text FROM documents WHERE id = ? AND matter_id = ?",
            (document_id, matter_id),
        ).fetchone()
    if not doc:
        raise HTTPException(404, "Document not found for this matter")

    text = doc["text"] or ""
    user = f"Document: {doc['name']}\n\n{text[:12000]}"
    try:
        result = llm.complete_json(SYSTEM, user)
    except Exception as e:
        raise HTTPException(502, llm.describe_error(e))
    findings = result.get("findings", []) if isinstance(result, dict) else []

    created: list[ScreeningFinding] = []
    now = _now()
    with db.connect() as conn:
        # Clear prior findings for this document so re-runs are idempotent.
        conn.execute("DELETE FROM screening_findings WHERE document_id = ?", (document_id,))
        for f in findings:
            fid = str(uuid.uuid4())
            row = ScreeningFinding(
                id=fid, matter_id=matter_id, document_id=document_id,
                severity=(f.get("severity") or "low").lower(),
                category=f.get("category") or "General",
                title=f.get("title") or "Finding",
                detail=f.get("detail"), excerpt=f.get("excerpt"),
                status="open", created_at=now,
            )
            conn.execute(
                "INSERT INTO screening_findings (id, matter_id, document_id, severity, category, "
                "title, detail, excerpt, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
                (row.id, row.matter_id, row.document_id, row.severity, row.category,
                 row.title, row.detail, row.excerpt, row.status, row.created_at),
            )
            created.append(row)

    log_activity(matter_id, "screening", "Document screened", f"{doc['name']} · {len(created)} findings")
    return created


@router.patch("/findings/{finding_id}", response_model=ScreeningFinding)
def update_finding(finding_id: str, payload: FindingStatusUpdate) -> ScreeningFinding:
    with db.connect() as conn:
        conn.execute(
            "UPDATE screening_findings SET status = ? WHERE id = ?",
            (payload.status, finding_id),
        )
        row = conn.execute("SELECT * FROM screening_findings WHERE id = ?", (finding_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Finding not found")
    log_activity(row["matter_id"], "screening", f"Finding {payload.status}", row["title"])
    return ScreeningFinding(**row)
