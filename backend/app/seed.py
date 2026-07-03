"""Seed demo matters with realistic contract text so the app is alive on first run.

The documents are written to contain concrete, screenable risk clauses (uncapped
indemnity, auto-renewal, non-compete, breach-notification windows, liquidation
preferences, etc.) so Screening and Research have rich material for a demo.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from . import db
from .ai import store

# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------

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

SAAS = """SOFTWARE-AS-A-SERVICE SUBSCRIPTION AGREEMENT

1. Subscription. Vendor grants Customer a non-exclusive, non-transferable subscription to access the hosted logistics platform (the "Service") during the Subscription Term, solely for Customer's internal business operations.

2. Service Levels. Vendor will use commercially reasonable efforts to make the Service available 99.5% of the time, measured monthly, excluding scheduled maintenance. Customer's sole remedy for failure to meet the service level is a service credit not to exceed 10% of the monthly fee.

3. Fees; Auto-Renewal. The subscription fee is billed annually in advance and is non-refundable. The Subscription Term renews automatically for successive twelve (12) month periods, and fees may increase by up to 7% upon each renewal, unless Customer gives sixty (60) days' written notice of non-renewal.

4. Data Security. Vendor shall maintain administrative, physical, and technical safeguards designed to protect Customer Data, including encryption of data in transit and at rest, consistent with SOC 2 Type II controls.

5. Warranty Disclaimer. EXCEPT AS EXPRESSLY PROVIDED, THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, AND VENDOR DISCLAIMS ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.

6. Limitation of Liability. Vendor's total aggregate liability under this Agreement shall not exceed the fees paid by Customer in the twelve (12) months preceding the event giving rise to the claim. In no event shall Vendor be liable for lost profits or data.

7. Termination for Convenience. Either party may terminate this Agreement for convenience upon thirty (30) days' written notice; provided that prepaid fees are non-refundable.

8. Governing Law. This Agreement is governed by the laws of the State of California.
"""

DPA = """DATA PROCESSING ADDENDUM

1. Roles. Customer is the Controller and Vendor is the Processor with respect to Personal Data processed under the Subscription Agreement. Vendor shall process Personal Data only on documented instructions from Customer.

2. Sub-processors. Vendor may engage sub-processors provided it maintains a current list and gives Customer at least ten (10) days' prior notice of any intended additions, during which Customer may object on reasonable data-protection grounds.

3. Security Measures. Vendor shall implement appropriate technical and organizational measures, including pseudonymization and encryption, to ensure a level of security appropriate to the risk.

4. Personal Data Breach. Vendor shall notify Customer without undue delay and in any event within seventy-two (72) hours after becoming aware of a Personal Data Breach, and shall provide sufficient information to allow Customer to meet its regulatory obligations.

5. International Transfers. Where Personal Data is transferred outside the EEA, the parties shall rely on the Standard Contractual Clauses, which are incorporated by reference.

6. Audit. Vendor shall make available information necessary to demonstrate compliance and allow for audits, including inspections, conducted by Customer or an independent auditor, no more than once per calendar year.

7. Return and Deletion. Upon termination, Vendor shall, at Customer's choice, delete or return all Personal Data and delete existing copies within ninety (90) days, unless retention is required by law.
"""

TERM_SHEET = """SERIES A PREFERRED STOCK — SUMMARY OF TERMS

1. Issuer. Vertex Robotics, Inc. (the "Company").

2. Amount and Valuation. Investors will invest $12,000,000 in Series A Preferred Stock at a pre-money valuation of $38,000,000, representing approximately 24% of the fully diluted capitalization.

3. Liquidation Preference. 1x non-participating liquidation preference. In a liquidation event, holders of Series A receive the greater of (a) their original purchase price plus declared but unpaid dividends, or (b) the amount they would receive on an as-converted basis.

4. Dividends. Non-cumulative dividends of 8% per annum, payable when and if declared by the Board.

5. Board of Directors. The Board shall consist of five (5) members: two (2) designated by the Investors, two (2) by the Founders, and one (1) independent director mutually agreed.

6. Protective Provisions. So long as the Series A remains outstanding, the Company shall not, without the approval of the Series A majority, (a) alter the rights of the Series A, (b) create senior securities, or (c) incur indebtedness in excess of $1,000,000.

7. Pro Rata Rights. Major Investors shall have the right to participate pro rata in future financings to maintain their ownership percentage.

8. No-Shop. For a period of thirty (30) days, the Company shall not solicit or negotiate competing financing proposals.

9. Governing Law. Delaware. This term sheet is non-binding except for the No-Shop and Confidentiality provisions.
"""

EMPLOYMENT = """EXECUTIVE EMPLOYMENT AGREEMENT

1. Position. The Company employs the Executive as Chief Technology Officer, reporting to the Chief Executive Officer. The Executive shall devote substantially all business time to the Company.

2. Compensation. Base salary of $265,000 per annum, reviewed annually, plus a target annual bonus of 30% of base salary based on performance milestones.

3. Equity. The Executive shall be granted options to purchase 400,000 shares, vesting over four (4) years with a one (1) year cliff, subject to the Company's equity incentive plan.

4. Intellectual Property Assignment. The Executive irrevocably assigns to the Company all right, title, and interest in any inventions, works of authorship, and intellectual property conceived during employment that relate to the Company's business.

5. Non-Competition. During employment and for twelve (12) months thereafter, the Executive shall not engage in any business that competes with the Company within any jurisdiction where the Company operates.

6. Non-Solicitation. For twenty-four (24) months following termination, the Executive shall not solicit any employee or customer of the Company.

7. Termination for Cause. The Company may terminate for Cause, including material breach, gross negligence, or conviction of a felony, without severance.

8. Severance. If terminated without Cause, the Executive shall receive six (6) months of base salary continuation, subject to execution of a release of claims.

9. Governing Law. This Agreement is governed by the laws of the State of California. The parties acknowledge that non-competition covenants may be unenforceable under California law.
"""

# ---------------------------------------------------------------------------
# Matters
# ---------------------------------------------------------------------------

MATTERS = [
    {
        "title": "Northwind Logistics — Vendor Onboarding",
        "client": "Northwind Logistics, Inc.",
        "practice_area": "Commercial Contracts",
        "summary": (
            "Review and negotiate the vendor package for a new logistics-software provider — "
            "master services agreement, NDA, SaaS subscription, and data processing addendum. "
            "Flag liability, auto-renewal, and data-breach risks before partner sign-off."
        ),
        "documents": [
            ("Master Services Agreement.txt", MSA, "txt"),
            ("Mutual NDA.txt", NDA, "txt"),
            ("SaaS Subscription Agreement.txt", SAAS, "txt"),
            ("Data Processing Addendum.txt", DPA, "txt"),
        ],
    },
    {
        "title": "Vertex Robotics — Series A Financing",
        "client": "Vertex Robotics, Inc.",
        "practice_area": "Corporate / M&A",
        "summary": (
            "Represent the company on its $12M Series A. Review the term sheet economics and "
            "control provisions, and paper the incoming CTO's employment agreement. Watch "
            "liquidation preference, protective provisions, and non-compete enforceability."
        ),
        "documents": [
            ("Series A Term Sheet.txt", TERM_SHEET, "txt"),
            ("Executive Employment Agreement — CTO.txt", EMPLOYMENT, "txt"),
        ],
    },
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def seed_demo() -> None:
    for matter in MATTERS:
        matter_id = str(uuid.uuid4())
        with db.connect() as conn:
            conn.execute(
                "INSERT INTO matters (id, title, client, practice_area, status, summary, created_at) "
                "VALUES (?,?,?,?, 'active', ?, ?)",
                (
                    matter_id,
                    matter["title"],
                    matter["client"],
                    matter["practice_area"],
                    matter["summary"],
                    _now(),
                ),
            )
            conn.execute(
                "INSERT INTO activity (id, matter_id, kind, title, detail, created_at) VALUES (?,?,?,?,?,?)",
                (str(uuid.uuid4()), matter_id, "matter", "Matter created", matter["title"], _now()),
            )

        for name, text, kind in matter["documents"]:
            doc_id = str(uuid.uuid4())
            pages = max(1, text.count("\n") // 6)
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
