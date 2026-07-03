# Legally — Backend (FastAPI)

AI-native legal platform API. Voyage AI for embeddings (`voyage-law-2`), OpenAI for
generation. SQLite + in-Python vector search for a zero-infra local MVP.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows PowerShell:  .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

copy .env.example .env          # then paste your real keys into .env
```

Put your keys in `.env`:

```
VOYAGE_API_KEY=...
OPENAI_API_KEY=...
```

> Leave keys blank (or set `LEGALLY_OFFLINE=1`) to run fully offline with deterministic
> stub output — useful for UI work without spending tokens.

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- Health:   http://localhost:8000/api/v1/health

On first boot it seeds a demo matter ("Northwind Logistics") with an MSA + NDA already
ingested and embedded, so every screen has data immediately.

## Workflows

| Workflow  | Endpoint(s)                                             | AI |
|-----------|---------------------------------------------------------|----|
| Research  | `POST /api/v1/research`, `/research/stream` (SSE)        | Voyage retrieval → OpenAI synthesis w/ citations |
| Screening | `POST /api/v1/screening/runs`, `GET /screening/findings` | OpenAI JSON risk extraction |
| Drafting  | `POST /api/v1/drafting/generate`, `/drafting/redline`   | OpenAI generation + server-side diff |

## Layout

```
app/
  main.py            FastAPI app + CORS + router mounts
  config.py          env settings
  db.py              SQLite schema + connection
  seed.py            demo matter/documents
  schemas.py         Pydantic request/response models
  ai/
    embeddings.py    Voyage AI (voyage-law-2) + offline fallback
    llm.py           OpenAI chat/stream/json + offline fallback
    store.py         chunking + cosine vector search
  routers/           matters, documents, research, screening, drafting
```
