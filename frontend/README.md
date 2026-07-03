# Legally — Frontend (Next.js 15)

AI-native legal workspace UI. App Router + TypeScript + Tailwind v4 + Motion.

## Aesthetic

"**Ink & Parchment**" — a legal-chambers look, deliberately *not* the default AI style:

- **Type:** Fraunces (display serif) · Hanken Grotesk (UI) · Spline Sans Mono (legal metadata)
- **Palette:** warm bone paper, deep ink, oxblood accent, aged gold — light **and** dark themes
- **Atmosphere:** layered radial washes + a faint paper-grain noise backdrop
- **Motion:** staggered page-load reveals, a shared-layout tab underline, spring dialogs

## Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # optional — defaults to http://localhost:8000
npm run dev
```

Open http://localhost:3000. The backend must be running on port 8000
(`/api/*` is proxied there via `next.config.mjs`).

## Structure

```
app/
  layout.tsx                     fonts, theme, providers, backdrop
  globals.css                    the whole design system (Ink & Parchment)
  page.tsx                       dashboard — matter grid + hero
  matters/[matterId]/
    layout.tsx                   matter header + workflow nav
    page.tsx                     overview — brief + activity timeline
    documents/page.tsx           drag-drop upload + ingestion status
    screening/page.tsx           risk findings, severity filters, accept/dismiss
    drafting/page.tsx            clause generation + word-level redline diff
    research/page.tsx            streaming cited answers + source cards
components/                      brand, topbar, theme, dialogs, UI primitives
lib/                             typed API client, SSE stream reader, types, utils
```

## Workflows → API

- **Research** streams over SSE (`researchStream` in `lib/api.ts`): citations first, then tokens.
- **Screening** runs a document through the risk engine and renders findings you can triage.
- **Drafting** generates a clause, then diffs the revised text server-side for a tracked redline.
