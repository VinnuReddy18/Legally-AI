"""Embedding provider — Voyage AI (voyage-law-2), with a deterministic offline fallback."""
from __future__ import annotations

import hashlib
from functools import lru_cache

import numpy as np

from ..config import get_settings

_OFFLINE_DIM = 512


@lru_cache
def _client():
    import voyageai

    return voyageai.Client(api_key=get_settings().voyage_api_key)


def _offline_embed(texts: list[str]) -> list[list[float]]:
    """Hash-based bag-of-words vectors. Not semantic, but stable and dependency-free
    so the whole RAG pipeline runs without a Voyage key."""
    vectors = []
    for text in texts:
        vec = np.zeros(_OFFLINE_DIM, dtype=np.float32)
        for token in text.lower().split():
            h = int(hashlib.md5(token.encode()).hexdigest(), 16)
            vec[h % _OFFLINE_DIM] += 1.0
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        vectors.append(vec.tolist())
    return vectors


def embed(texts: list[str], input_type: str = "document") -> list[list[float]]:
    """Embed a batch of texts. input_type is 'document' or 'query' (Voyage optimizes each)."""
    if not texts:
        return []
    settings = get_settings()
    if settings.legally_offline or not settings.voyage_api_key:
        return _offline_embed(texts)

    result = _client().embed(
        texts,
        model=settings.voyage_embed_model,
        input_type=input_type,
    )
    return result.embeddings


def embed_query(text: str) -> list[float]:
    return embed([text], input_type="query")[0]
