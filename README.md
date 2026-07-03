# Legally — AI-native legal workspace

Screen documents for risk, draft & redline clauses, and research matters — every AI
answer grounded in your own files, with citations you can open and verify.

- **Embeddings:** Voyage AI (`voyage-law-2`, legal-domain tuned)
- **Generation:** OpenAI (`gpt-4o`)
- **Backend:** FastAPI · SQLite · in-Python vector search (zero-infra local MVP)
- **Frontend:** Next.js 15 · TypeScript · Tailwind v4 · Motion — "Ink & Parchment" design

The three workflows (Screening, Drafting/Redlining, Research) follow the plans in
[`docs/`](./docs). This repo is a lean, runnable MVP of that architecture — it swaps the
enterprise plumbing (K8s, Celery, pgvector, SSO) for a laptop-friendly stack while keeping
the same API shape and workflow model.

## Run it

**1 — Backend** (terminal 1)

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env               # paste your VOYAGE_API_KEY + OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000
```

**2 — Frontend** (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**.

> First boot seeds a demo matter ("Northwind Logistics") with an MSA + NDA already
> ingested, so every screen has data immediately.
>
> No keys yet? Set `LEGALLY_OFFLINE=1` in `backend/.env` to run end-to-end with
> deterministic stub output (no tokens spent) while you work on the UI.

## Layout

```
docs/       architecture + delivery plans (source of truth for scope)
backend/    FastAPI app — see backend/README.md
frontend/   Next.js app — see frontend/README.md
```
