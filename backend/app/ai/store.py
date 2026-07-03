"""Chunking + a lightweight SQLite-backed vector store with in-Python cosine search.

For MVP scale (thousands of chunks) an in-memory numpy scan is fast and avoids a
pgvector/Docker dependency on Windows. Swap this module for pgvector later without
touching the routers.
"""
from __future__ import annotations

import uuid

import numpy as np

from .. import db
from . import embeddings


def chunk_text(text: str, target_words: int = 220, overlap: int = 40) -> list[str]:
    """Split on paragraph boundaries, packing into ~target_words windows with overlap."""
    paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
    chunks: list[str] = []
    buffer: list[str] = []
    count = 0
    for para in paragraphs:
        words = para.split()
        if count + len(words) > target_words and buffer:
            chunks.append(" ".join(buffer))
            tail = " ".join(buffer).split()[-overlap:]
            buffer = tail + words
            count = len(buffer)
        else:
            buffer.extend(words)
            count += len(words)
    if buffer:
        chunks.append(" ".join(buffer))
    return chunks or ([text.strip()] if text.strip() else [])


def index_document(document_id: str, matter_id: str, text: str) -> int:
    pieces = chunk_text(text)
    vectors = embeddings.embed(pieces, input_type="document")
    with db.connect() as conn:
        for seq, (content, vec) in enumerate(zip(pieces, vectors)):
            conn.execute(
                "INSERT INTO chunks (id, document_id, matter_id, seq, content, embedding) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (
                    str(uuid.uuid4()),
                    document_id,
                    matter_id,
                    seq,
                    content,
                    np.asarray(vec, dtype=np.float32).tobytes(),
                ),
            )
    return len(pieces)


def search(matter_id: str, query: str, k: int = 6) -> list[dict]:
    """Return top-k chunks for a matter, each with a similarity score and source doc name."""
    qvec = np.asarray(embeddings.embed_query(query), dtype=np.float32)
    qnorm = np.linalg.norm(qvec) or 1.0

    with db.connect() as conn:
        rows = conn.execute(
            "SELECT c.id, c.document_id, c.content, c.embedding, d.name AS document_name "
            "FROM chunks c JOIN documents d ON d.id = c.document_id "
            "WHERE c.matter_id = ?",
            (matter_id,),
        ).fetchall()

    scored = []
    for row in rows:
        vec = np.frombuffer(row["embedding"], dtype=np.float32)
        if vec.shape != qvec.shape:
            continue
        score = float(np.dot(vec, qvec) / ((np.linalg.norm(vec) or 1.0) * qnorm))
        scored.append((score, row))

    scored.sort(key=lambda t: t[0], reverse=True)
    results = []
    for score, row in scored[:k]:
        results.append(
            {
                "chunk_id": row["id"],
                "document_id": row["document_id"],
                "document_name": row["document_name"],
                "content": row["content"],
                "score": round(score, 4),
            }
        )
    return results
