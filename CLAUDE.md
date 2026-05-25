# CLAUDE.md — Standby project context

Loaded automatically by Claude Code when working inside this repo. Read [docs/PRD.md](docs/PRD.md) first for product direction.

## What this is

Standby — a free, offline-first, browser-based paperwork hub for theatre stage managers. Targets SMs in contexts **without** Virtual Callboard (summer programs, community theatre, post-graduation regional/fringe gigs, college programs without VCB subscriptions). Motivating user: Shannon's daughter — BFA SM at Ball State, currently on summer internship at Otterbein where she's manually emailing every piece of paperwork. See [docs/RESEARCH.md](docs/RESEARCH.md) for the full competitive landscape and SM-workflow primer.

## Stack

- **React 18 + TypeScript + Vite 5** — SPA on GitHub Pages, base path `/standby/`.
- **Tailwind 3** with `@media print` for letter-paper Broadway-PSM-packet stylesheets.
- **React Router 6** (`createBrowserRouter`, basename `/standby`).
- **Zustand** for app state; **Dexie** for IndexedDB persistence (schema in `src/lib/db.ts` mirrors PRD §8).
- **react-hook-form + zod** for type-safe forms (define schema once, reuse for validation + TS types via `z.infer<>`).
- **@react-pdf/renderer** for PDF export — code-split, loaded on first export.
- **vite-plugin-pwa** for service worker + manifest.
- **Vitest** (unit) + **Playwright** (E2E).
- **ESLint** flat config + **Prettier**.
- **GitHub Actions → GitHub Pages** on push to `main` (`.github/workflows/deploy.yml`).

## Layout conventions

```
src/
├── main.tsx              # entry + router
├── App.tsx               # layout shell (left nav, theme toggle, <Outlet/>)
├── index.css             # Tailwind + print stylesheet
├── routes/               # one file per top-level route
├── lib/
│   ├── db.ts             # Dexie schema (mirror PRD §8)
│   └── store.ts          # Zustand
├── components/           # shared (create as needed)
└── features/<area>/      # feature-local components, hooks, utils, PDF renderers
```

PDF renderers live at `src/features/<area>/<Artifact>Pdf.tsx`.

## Conventions

- **Strict TypeScript.** No `any` without a comment justifying it.
- **Never write to the network.** Standby has no backend. IndexedDB is the only persistence.
- **Autosave-on-change.** Never require a manual save step.
- **Print stylesheet:** hide `.print:hidden` (left nav, action bars), letter paper, header on every page.
- **Pronouns** are a first-class field on contacts.

## Tone

- Default note phrasing in templates follows **Porter & Alcorn**'s collaborative tone (e.g. "would love clarification on…" rather than "this is wrong").
- Form structure follows **Stern & Gold *Stage Management* 12e**.
- Glossary of SM-specific vocabulary in [docs/GLOSSARY.md](docs/GLOSSARY.md).

## Phasing

Currently in **M0 → M1 → M2**. See PRD §12 for dates. M2 target: ship by ~2026-07-06 so daughter has 3 weeks of real-show use before her Otterbein summer ends 2026-07-27.

## Non-goals (do not implement)

- Backend, accounts, real-time multi-user, push notifications. (VCB's lane.)
- Blocking-on-ground-plan editor. (Stage Write's lane.)
- Live cue execution. (QLab's lane.)
- Native mobile apps.
