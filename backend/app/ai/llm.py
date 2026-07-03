"""Generation provider — OpenAI, with a deterministic offline fallback.

Exposes both a blocking `complete()` and a streaming `stream()` generator so the
frontend can render tokens as they arrive for long legal analyses.
"""
from __future__ import annotations

import json
from functools import lru_cache
from typing import Iterator

from ..config import get_settings


@lru_cache
def _client():
    from openai import OpenAI

    return OpenAI(api_key=get_settings().openai_api_key)


def _use_offline() -> bool:
    s = get_settings()
    return s.legally_offline or not s.openai_api_key


def describe_error(e: Exception) -> str:
    """Turn an OpenAI/network exception into a short, actionable message for the UI."""
    try:
        from openai import (
            APIConnectionError,
            AuthenticationError,
            PermissionDeniedError,
            RateLimitError,
        )
    except Exception:
        return f"Generation failed: {e}"

    if isinstance(e, AuthenticationError):
        return "OpenAI rejected the API key — check OPENAI_API_KEY in backend/.env."
    if isinstance(e, PermissionDeniedError):
        return "OpenAI denied access for this key/model. Verify the model and account access."
    if isinstance(e, RateLimitError):
        return "OpenAI rate limit or quota reached. Wait a moment and retry."
    if isinstance(e, APIConnectionError):
        return (
            "Couldn't reach OpenAI (network / DNS / proxy). Check your internet connection, "
            "or set LEGALLY_OFFLINE=1 in backend/.env to run with local stub output."
        )
    return f"Generation failed: {e}"


def complete(system: str, user: str, temperature: float = 0.2) -> str:
    if _use_offline():
        return _offline_answer(user)
    resp = _client().chat.completions.create(
        model=get_settings().openai_model,
        temperature=temperature,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return resp.choices[0].message.content or ""


def complete_json(system: str, user: str, temperature: float = 0.1) -> dict:
    if _use_offline():
        return _offline_json(user)
    resp = _client().chat.completions.create(
        model=get_settings().openai_model,
        temperature=temperature,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    try:
        return json.loads(resp.choices[0].message.content or "{}")
    except json.JSONDecodeError:
        return {}


def stream(system: str, user: str, temperature: float = 0.2) -> Iterator[str]:
    if _use_offline():
        for token in _offline_answer(user).split(" "):
            yield token + " "
        return
    events = _client().chat.completions.create(
        model=get_settings().openai_model,
        temperature=temperature,
        stream=True,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    for event in events:
        delta = event.choices[0].delta.content
        if delta:
            yield delta


# --- Offline fallbacks -----------------------------------------------------

def _offline_answer(user: str) -> str:
    return (
        "**[Offline mode]** No OpenAI key is configured, so this is a placeholder "
        "analysis generated locally.\n\n"
        "Based on the retrieved context, the relevant provisions appear to address the "
        "question raised. Key considerations include the obligations of each party, the "
        "governing jurisdiction, and any limitation-of-liability terms. Please supply an "
        "`OPENAI_API_KEY` in the backend `.env` to enable full analysis. [1]"
    )


def _offline_json(user: str) -> dict:
    return {
        "findings": [
            {
                "severity": "high",
                "category": "Liability",
                "title": "Uncapped indemnification obligation",
                "detail": "The indemnity clause does not appear to cap the indemnifying "
                "party's exposure, creating open-ended financial risk.",
                "excerpt": "…shall indemnify and hold harmless…",
            },
            {
                "severity": "medium",
                "category": "Term & Termination",
                "title": "Auto-renewal without notice window",
                "detail": "Agreement renews automatically; confirm the notice period for "
                "non-renewal is workable.",
                "excerpt": "…renew automatically for successive periods…",
            },
            {
                "severity": "low",
                "category": "Governing Law",
                "title": "Jurisdiction should be confirmed",
                "detail": "Governing-law clause references a jurisdiction that should be "
                "confirmed against the client's preference.",
                "excerpt": "…governed by the laws of…",
            },
        ]
    }
