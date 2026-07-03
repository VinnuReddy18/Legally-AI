from __future__ import annotations

import difflib
import re

from fastapi import APIRouter, HTTPException

from ..ai import llm
from ..schemas import DraftRequest, RedlineRequest, RedlineResponse, RedlineSegment
from .matters import log_activity

router = APIRouter(prefix="/api/v1/drafting", tags=["drafting"])

DRAFT_SYSTEM = (
    "You are a senior transactional attorney drafting clean, enforceable contract language. "
    "Produce a single well-formed clause in formal legal style. Use defined terms consistently. "
    "Return only the clause text, no commentary."
)

REDLINE_SYSTEM = (
    "You are a contracts attorney revising a clause per the instruction. Return the fully "
    "revised clause text only — no commentary, no markdown, no preamble."
)


@router.post("/generate")
def generate_clause(payload: DraftRequest) -> dict:
    parties = ""
    if payload.party_a or payload.party_b:
        parties = f" Parties: {payload.party_a or 'Party A'} and {payload.party_b or 'Party B'}."
    user = (
        f"Draft a '{payload.clause_type}' clause.{parties} "
        f"Additional instructions: {payload.instructions or 'standard, balanced terms'}."
    )
    try:
        text = llm.complete(DRAFT_SYSTEM, user, temperature=0.3)
    except Exception as e:
        raise HTTPException(502, llm.describe_error(e))
    log_activity(payload.matter_id, "drafting", "Clause drafted", payload.clause_type)
    return {"clause_type": payload.clause_type, "text": text}


def _tokenize(text: str) -> list[str]:
    # Keep words and whitespace as separate tokens for readable word-level diffs.
    return re.findall(r"\S+|\s+", text)


def _diff_segments(original: str, revised: str) -> list[RedlineSegment]:
    a, b = _tokenize(original), _tokenize(revised)
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    segments: list[RedlineSegment] = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            segments.append(RedlineSegment(op="equal", text="".join(a[i1:i2])))
        elif tag == "delete":
            segments.append(RedlineSegment(op="delete", text="".join(a[i1:i2])))
        elif tag == "insert":
            segments.append(RedlineSegment(op="insert", text="".join(b[j1:j2])))
        elif tag == "replace":
            segments.append(RedlineSegment(op="delete", text="".join(a[i1:i2])))
            segments.append(RedlineSegment(op="insert", text="".join(b[j1:j2])))
    return segments


@router.post("/redline", response_model=RedlineResponse)
def redline(payload: RedlineRequest) -> RedlineResponse:
    try:
        revised = llm.complete(
            REDLINE_SYSTEM,
            f"Instruction: {payload.instructions}\n\nClause:\n{payload.original}",
        ).strip()
        rationale = llm.complete(
            "You are a contracts attorney. In 1-2 sentences, explain what changed and why.",
            f"Original:\n{payload.original}\n\nRevised:\n{revised}\n\nInstruction: {payload.instructions}",
            temperature=0.2,
        )
    except Exception as e:
        raise HTTPException(502, llm.describe_error(e))
    return RedlineResponse(
        revised=revised,
        segments=_diff_segments(payload.original, revised),
        rationale=rationale,
    )
