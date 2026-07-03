from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from typing import Iterator

from .config import get_settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS matters (
    id           TEXT PRIMARY KEY,
    title        TEXT NOT NULL,
    client       TEXT,
    practice_area TEXT,
    status       TEXT DEFAULT 'active',
    summary      TEXT,
    created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
    id          TEXT PRIMARY KEY,
    matter_id   TEXT NOT NULL,
    name        TEXT NOT NULL,
    kind        TEXT,
    status      TEXT DEFAULT 'processing',
    pages       INTEGER DEFAULT 0,
    text        TEXT,
    created_at  TEXT NOT NULL,
    FOREIGN KEY (matter_id) REFERENCES matters(id)
);

CREATE TABLE IF NOT EXISTS chunks (
    id          TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    matter_id   TEXT NOT NULL,
    seq         INTEGER NOT NULL,
    content     TEXT NOT NULL,
    embedding   BLOB,
    FOREIGN KEY (document_id) REFERENCES documents(id)
);

CREATE TABLE IF NOT EXISTS activity (
    id          TEXT PRIMARY KEY,
    matter_id   TEXT NOT NULL,
    kind        TEXT NOT NULL,
    title       TEXT NOT NULL,
    detail      TEXT,
    created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS screening_findings (
    id          TEXT PRIMARY KEY,
    matter_id   TEXT NOT NULL,
    document_id TEXT,
    severity    TEXT NOT NULL,
    category    TEXT NOT NULL,
    title       TEXT NOT NULL,
    detail      TEXT,
    excerpt     TEXT,
    status      TEXT DEFAULT 'open',
    created_at  TEXT NOT NULL
);
"""


def _dict_factory(cursor: sqlite3.Cursor, row: tuple) -> dict:
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    path = get_settings().sqlite_path
    os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = _dict_factory
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with connect() as conn:
        conn.executescript(SCHEMA)
    _seed_if_empty()


def _seed_if_empty() -> None:
    """Seed a demo matter with a couple of documents so the UI is alive on first run."""
    from .seed import seed_demo

    with connect() as conn:
        count = conn.execute("SELECT COUNT(*) AS c FROM matters").fetchone()["c"]
    if count == 0:
        seed_demo()
