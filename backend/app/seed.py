"""Seed a demo matter with real contract text so the app is alive on first run."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from . import db
from .ai import store

MSA = """MASTER SERVICES AGREEMENT

1. Services. Provider shall perform the professional services described in each Statement of Work executed by the parties. Each Statement of Work shall reference this Agreement and be governed by its terms.

2. Fees and Payment. Client shall pay all fees within thirty (30) days of the invoice date. Late payments shall accrue interest at the rate of 1.5% per month or the maximum rate permitted by law, whichever is lower.

3. Term and Termination. This Agreement commences on the Effective Date and shall renew automatically for successive one-year periods unless either party provides written notice of non-renewal at least ninety (90) days prior to the end of the then-current term.

4. Confidentiality. Each party shall protect the Confidential Information of the other party using at least the same degree of care it uses to protect its own confidential information, and in no event less than reasonable care.

5. Indemnification. Provider shall indemnify, defend, and hold harmless Client from and against any and all claims, damages, liabilities, costs, and expenses arising out of Provider's performance of the Services. This indemnification obligation shall be uncapped and shall survive termination of this Agreement.

6. Limitation of Liability. Except for the indemnification obligations set forth in Section 5, in no event shall either party be liable for any indirect, incidental, or consequential damages. The aggregate liability of Provider shall not exceed the fees paid in the twelve (12) months preceding the claim.

7. Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of laws principles.

8. Intellectual Property. All work product created by Provider in the course of performing the Services shall be the exclusive property of Client upon full payment of the applicable fees.
"""

NDA = """MUTUAL NON-DISCLOSURE AGREEMENT

1. Purpose. The parties wish to explore a potential business relationship and, in connection with this, may disclose Confidential Information to one another.

2. Definition. "Confidential Information" means any non-public information disclosed by one party to the other, whether orally, in writing, or by inspection of tangible objects.

3. Obligations. The receiving party shall not disclose Confidential Information to any third party and shall use it solely for the Purpose. The receiving party may disclose Confidential Information to its employees on a need-to-know basis.

4. Term. The obligations of confidentiality shall survive for a period of five (5) years from the date of disclosure.

5. Return of Materials. Upon written request, the receiving party shall promptly return or destroy all Confidential Information.

6. Governing Law. This Agreement shall be governed by the laws of the State of New York.
"""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def seed_demo() -> None:
    matter_id = str(uuid.uuid4())
    now = _now()
    with db.connect() as conn:
        conn.execute(
            "INSERT INTO matters (id, title, client, practice_area, status, summary, created_at) "
            "VALUES (?,?,?,?, 'active', ?, ?)",
            (
                matter_id,
                "Northwind Logistics — Vendor Onboarding",
                "Northwind Logistics, Inc.",
                "Commercial Contracts",
                "Review and negotiate the master services agreement and NDA for a new "
                "logistics-software vendor. Flag liability and renewal risks before partner sign-off.",
                now,
            ),
        )
        conn.execute(
            "INSERT INTO activity (id, matter_id, kind, title, detail, created_at) VALUES (?,?,?,?,?,?)",
            (str(uuid.uuid4()), matter_id, "matter", "Matter created",
             "Northwind Logistics — Vendor Onboarding", now),
        )

    for name, text, kind in [
        ("Master Services Agreement.txt", MSA, "txt"),
        ("Mutual NDA.txt", NDA, "txt"),
    ]:
        doc_id = str(uuid.uuid4())
        pages = max(1, text.count("\n") // 10)
        with db.connect() as conn:
            conn.execute(
                "INSERT INTO documents (id, matter_id, name, kind, status, pages, text, created_at) "
                "VALUES (?,?,?,?, 'ready', ?, ?, ?)",
                (doc_id, matter_id, name, kind, pages, text, _now()),
            )
        store.index_document(doc_id, matter_id, text)
        with db.connect() as conn:
            conn.execute(
                "INSERT INTO activity (id, matter_id, kind, title, detail, created_at) VALUES (?,?,?,?,?,?)",
                (str(uuid.uuid4()), matter_id, "document", "Document ingested", name, _now()),
            )
