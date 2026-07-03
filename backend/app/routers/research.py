from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..ai import llm, store
from ..schemas import Citation, ResearchAnswer, ResearchQuery
from .matters import log_activity

router = APIRouter(prefix="/api/v1/research", tags=["research"])

SYSTEM = (
    "You are a meticulous legal research associate. Answer the question using ONLY the "
    "numbered context passages provided. Cite every factual claim inline with bracketed "
    "numbers like [1] or [2] that map to the passages. If the context is insufficient, say "
    "so plainly rather than inventing law. Be precise, structured, and neutral. Never "
    "fabricate citations."
)


def _build_prompt(question: str, jurisdiction: str | None, hits: list[dict]) -> str:
    context = "\n\n".join(
        f"[{i + 1}] (source: {h['document_name']})\n{h['content']}" for i, h in enumerate(hits)
    )
    juris = f"\nJurisdiction focus: {jurisdiction}" if jurisdiction else ""
    return (
        f"Question: {question}{juris}\n\n"
        f"Context passages:\n{context}\n\n"
        "Write a well-structured answer with inline [n] citations."
    )


def _citations(hits: list[dict]) -> list[Citation]:
    return [
        Citation(
            index=i + 1,
            document_id=h["document_id"],
            document_name=h["document_name"],
            snippet=(h["content"][:280] + "…") if len(h["content"]) > 280 else h["content"],
            score=h["score"],
        )
        for i, h in enumerate(hits)
    ]


@router.post("", response_model=ResearchAnswer)
def research(payload: ResearchQuery) -> ResearchAnswer:
    hits = store.search(payload.matter_id, payload.question, k=6)
    try:
        answer = llm.complete(SYSTEM, _build_prompt(payload.question, payload.jurisdiction, hits))
    except Exception as e:
        raise HTTPException(502, llm.describe_error(e))
    log_activity(payload.matter_id, "research", "Research query", payload.question[:120])
    return ResearchAnswer(answer=answer, citations=_citations(hits))


@router.post("/stream")
def research_stream(payload: ResearchQuery) -> StreamingResponse:
    """Server-Sent Events: emits citations first, then streams answer tokens."""
    hits = store.search(payload.matter_id, payload.question, k=6)
    citations = _citations(hits)
    prompt = _build_prompt(payload.question, payload.jurisdiction, hits)

    def gen():
        payload_c = [c.model_dump() for c in citations]
        yield f"event: citations\ndata: {json.dumps(payload_c)}\n\n"
        try:
            for token in llm.stream(SYSTEM, prompt):
                yield f"event: token\ndata: {json.dumps(token)}\n\n"
        except Exception as e:  # network/auth/rate-limit — surface to the UI, don't crash
            yield f"event: error\ndata: {json.dumps(llm.describe_error(e))}\n\n"
            return
        yield "event: done\ndata: {}\n\n"
        log_activity(payload.matter_id, "research", "Research query", payload.question[:120])

    return StreamingResponse(gen(), media_type="text/event-stream")
