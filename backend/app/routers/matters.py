from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from .. import db
from ..schemas import Activity, Matter, MatterCreate

router = APIRouter(prefix="/api/v1/matters", tags=["matters"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def log_activity(matter_id: str, kind: str, title: str, detail: str | None = None) -> None:
    with db.connect() as conn:
        conn.execute(
            "INSERT INTO activity (id, matter_id, kind, title, detail, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), matter_id, kind, title, detail, _now()),
        )


@router.get("", response_model=list[Matter])
def list_matters() -> list[Matter]:
    with db.connect() as conn:
        rows = conn.execute(
            """
            SELECT m.*,
              (SELECT COUNT(*) FROM documents d WHERE d.matter_id = m.id) AS document_count,
              (SELECT COUNT(*) FROM screening_findings f
                 WHERE f.matter_id = m.id AND f.status = 'open') AS finding_count
            FROM matters m ORDER BY m.created_at DESC
            """
        ).fetchall()
    return [Matter(**r) for r in rows]


@router.post("", response_model=Matter, status_code=201)
def create_matter(payload: MatterCreate) -> Matter:
    matter_id = str(uuid.uuid4())
    now = _now()
    with db.connect() as conn:
        conn.execute(
            "INSERT INTO matters (id, title, client, practice_area, status, summary, created_at) "
            "VALUES (?, ?, ?, ?, 'active', ?, ?)",
            (matter_id, payload.title, payload.client, payload.practice_area, payload.summary, now),
        )
    log_activity(matter_id, "matter", "Matter created", payload.title)
    return Matter(
        id=matter_id,
        title=payload.title,
        client=payload.client,
        practice_area=payload.practice_area,
        summary=payload.summary,
        created_at=now,
    )


@router.get("/{matter_id}", response_model=Matter)
def get_matter(matter_id: str) -> Matter:
    with db.connect() as conn:
        row = conn.execute(
            """
            SELECT m.*,
              (SELECT COUNT(*) FROM documents d WHERE d.matter_id = m.id) AS document_count,
              (SELECT COUNT(*) FROM screening_findings f
                 WHERE f.matter_id = m.id AND f.status = 'open') AS finding_count
            FROM matters m WHERE m.id = ?
            """,
            (matter_id,),
        ).fetchone()
    if not row:
        raise HTTPException(404, "Matter not found")
    return Matter(**row)


@router.get("/{matter_id}/activity", response_model=list[Activity])
def get_activity(matter_id: str) -> list[Activity]:
    with db.connect() as conn:
        rows = conn.execute(
            "SELECT * FROM activity WHERE matter_id = ? ORDER BY created_at DESC LIMIT 50",
            (matter_id,),
        ).fetchall()
    return [Activity(**r) for r in rows]
