# CLAUDE.md — Standby project context

Loaded automatically by Claude Code when working inside this repo. Read [docs/PRD.md](docs/PRD.md) first for product direction.

## What this is

Standby — a free, offline-first, browser-based paperwork hub for theatre stage managers. Targets SMs in contexts **without** Virtual Callboard (summer programs, community theatre, post-graduation regional/fringe gigs, college programs without VCB subscriptions). Motivating user: Shannon's daughter — stage management student at Ball State, currently on summer internship at Otterbein where she's manually emailing every piece of paperwork. See [docs/RESEARCH.md](docs/RESEARCH.md) for the full competitive landscape and SM-workflow primer.

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
- **Accessibility is a non-negotiable.** Lighthouse AX should stay ≥95 on every route. See CONTRIBUTING.md for the practical baseline (visible focus rings everywhere, `aria-label` on icon-only buttons, ghost-style icon buttons for destructive list-row actions, modals as `role="dialog" aria-modal="true"`, semantic `<table scope="col">`, `prefers-reduced-motion` respected on animations).
- **Use shared Form primitives** in `src/components/Form.tsx`: `<Field required>` + `<Input/>`/`<Textarea/>`/`<Select/>` wire up `aria-required` + `aria-describedby` + `aria-invalid` via `FieldContext`. `<IconButton tone="danger">` with `<TrashIcon/>` is the destructive-row-action pattern.

## Tone

- Default note phrasing in templates follows **Porter & Alcorn**'s collaborative tone (e.g. "would love clarification on…" rather than "this is wrong").
- Form structure follows **Stern & Gold *Stage Management* 12e**.
- Glossary of SM-specific vocabulary in [docs/GLOSSARY.md](docs/GLOSSARY.md).

## Phasing

M0 → M1 → M2 are complete (production setup, contact sheet + groups, rehearsal report, line notes, prop list, distribution v1). Currently in **M2.5 / V1.5 / V2 territory**: show reports, daily call + Equity break calculator, master tracking sheet, blocking schematic, scene/character breakdown matrix, full a11y polish, and Today dashboard widgets are all shipped beyond the original PRD timeline. See PRD §12 for the original dates and CHANGELOG.md for what's actually landed.

## Routes (current)

```
Today · Production · Contacts · Daily call · Rehearsals · Show reports ·
Line notes · Props · Tracking · Breakdown · Blocking · Breaks · Settings
```

Production focuses on the show itself (CRUD + distribute production-info sheet + send log). Settings houses personal prefs + the backup & storage panels (auto-backup folder, publish folder, JSON import/export). Sample-show loading lives in the Production empty state (first-run surface).

A `<ProductionSwitcher />` at the top of the nav (both desktop sidebar and mobile drawer) shows the current show name on every route and becomes a `<select>` once there are 2+ productions.

## Non-goals (do not implement)

- Backend, accounts, real-time multi-user, push notifications. (VCB's lane.)
- Blocking-on-ground-plan editor. (Stage Write's lane.)
- Live cue execution. (QLab's lane.)
- Native mobile apps.
