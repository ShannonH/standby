# Standby

> *Standing by.*

**Standby** is a free, open-source paperwork hub for theatre stage managers. Rehearsal reports, daily calls, line notes, prop tracking, contact sheets — with clean PDF output that matches what BFA programs teach as professional standard. Runs in your browser, with no accounts, no subscriptions, and no servers required. Self-host it in Docker if you're a university; open the live site if you're not.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Made for: Stage Managers](https://img.shields.io/badge/made%20for-stage%20managers-b91c1c.svg)](docs/RESEARCH.md)
[![Built with: TypeScript](https://img.shields.io/badge/built%20with-TypeScript-3178C6.svg)](https://www.typescriptlang.org/)
[![Live site](https://img.shields.io/badge/live-shannonh.github.io%2Fstandby-success.svg)](https://shannonh.github.io/standby/)

---

## Why this exists

The dominant stage-management tools today are either expensive subscriptions (**Stage Write** at $60–599/yr, **Virtual Callboard** at $20–150/mo), iPad-locked, or focused on one slice of the job and weak on the rest. Most working SMs end up duct-taping together Google Sheets, Notion templates, GoodNotes annotations, and a paper binder.

Standby's pitch:

- **Free forever.** Static site on GitHub Pages, no accounts, no paywalls.
- **Local-first.** Your show lives in *your* browser's IndexedDB and on *your* disk as JSON. Not on a vendor's server.
- **Offline by default.** Installable PWA. Rehearsal rooms in basements don't break it.
- **Conventions match what you were taught.** Forms follow Stern & Gold *Stage Management* 12e. Default note phrasing follows Porter & Alcorn (collaborative, not corrective). Pronouns are first-class on contacts.
- **PDFs that match Broadway-PSM packet aesthetic.** Letter or A4, proper page numbers, fixed footers, your name in the sign-off.
- **No iPad required.** Designed for laptops, works on phones, runs on Chromebooks. Cross-platform on day one.

See [`docs/RESEARCH.md`](docs/RESEARCH.md) for the full competitive landscape and SM-workflow primer that informed every product decision.

## Try it

**Live site:** [shannonh.github.io/standby](https://shannonh.github.io/standby/)

**Sample show:** Open the Production page → "Backup & restore" → "Load A Midsummer Night's Dream". A fully-populated 12-cast Midsummer arrives with rehearsal reports, daily calls, props, contacts, line notes — so you can see every feature without typing a thing.

## What's in the box

| Section | What it does |
|---|---|
| **Today** | Time-aware greeting, dashboard for the active show. |
| **Production** | Show metadata + key dates, JSON backup/restore, auto-backup to a folder you pick, publish PDFs to a shared folder for crew. |
| **Contacts** | Cast / Creative / Production / Crew / Venue, pronouns + do-not-publish flag, named groups for batch distribution. |
| **Daily call** | The night-before call sheet — staggered call times, schedule with abbreviated cast lists, "Subject to Change" footer, script-font title to match the Broadway-poster aesthetic. |
| **Rehearsals** | Stern/Gold-format report: attendance, time breakdown, 9 departmental note sections. PDF and inline-body email. |
| **Line notes** | Fast-entry mode (Enter saves and clears the form so you keep typing), grouped by actor, per-actor private PDFs. |
| **Props** | Master list, inline status dropdown in the table, six special-handling tags (food / weapons / fire / breakaway / fragile / liquid), CSV for the props master. |
| **Settings** | 6 distinct themes with full type systems, font size, paper size, time format, your-name greeting + email sign-off. |

Every paperwork page has a **Distribute** panel that opens your mail client with the right BCC group, the full report inline in the body (no attachments to remember), and a sign-off with your name. Mobile users get a Web Share path with the PDF actually attached.

## Quick start

### 🎭 If you're a stage manager

Use the live site. It's the easiest path — no install, your data is still 100% local to your browser, and you get every feature.

👉 **[https://shannonh.github.io/standby/](https://shannonh.github.io/standby/)**

Install it as a PWA from your browser's address bar for a Dock icon and full offline support.

### 🏫 If you're a university or program

Self-host Standby on your own infra. Two paths:

**Docker (recommended):**
```sh
git clone https://github.com/ShannonH/standby.git
cd standby
docker compose up -d
# now serving on http://localhost:8080
```

**Pre-built image from GitHub Container Registry** (available once a release is tagged):
```sh
docker run -d -p 8080:80 ghcr.io/shannonh/standby:latest
```

The image is multi-arch (linux/amd64 + linux/arm64). See [`docs/SELF-HOSTING.md`](docs/SELF-HOSTING.md) for reverse-proxy, base-path, and TLS guidance.

### 💻 If you're a developer

```sh
git clone https://github.com/ShannonH/standby.git
cd standby
npm install
npm run dev          # local dev server, hot reload
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test         # vitest unit tests
npm run build        # production build → dist/
```

Node ≥ 20 required. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for project structure and house rules.

## Architecture

- **React 18 + TypeScript + Vite** — static SPA, base path configurable via `VITE_BASE_PATH` env var.
- **Dexie / IndexedDB** for local persistence. Schema is versioned with migrations.
- **Zustand** for app state, with localStorage `persist` middleware for user preferences.
- **react-hook-form + zod** for forms — one schema is the source of truth for both runtime validation and the inferred TypeScript type.
- **`@react-pdf/renderer`** for PDF generation. Each renderer is code-split — the PDF engine only loads on the first PDF download, keeping initial bundle under 150 KB gzipped.
- **`vite-plugin-pwa`** for the service worker and installable manifest.
- **`@fontsource` packages** for every font, so the app ships with all weights it needs and works offline once cached.
- **File System Access API** for folder-based backup and crew-share publishing (Chromium browsers only; Safari/Firefox fall back to manual JSON export).

No backend, no API, no third-party analytics, no telemetry. Static files only.

## Docs

- [**PRD**](docs/PRD.md) — product direction, data model, feature catalog, phasing.
- [**Research**](docs/RESEARCH.md) — competitive landscape (Stage Write, Virtual Callboard, ProductionPro, the DIY tier), SM-workflow primer, cited sources.
- [**Glossary**](docs/GLOSSARY.md) — stage-management vocabulary used in the codebase and UI.
- [**Self-hosting**](docs/SELF-HOSTING.md) — Docker, base path, reverse proxy.
- [**Contributing**](CONTRIBUTING.md) — including a non-coder path for working SMs.
- [**Code of Conduct**](CODE_OF_CONDUCT.md)
- [**Security policy**](SECURITY.md)
- [**Changelog**](CHANGELOG.md)

## Contributing

You don't need to write code to help. Working SMs and students have outsized impact here — file an [SM workflow gap](.github/ISSUE_TEMPLATE/sm-workflow.yml) when something doesn't match your program's expectations, or open a PR against [`docs/GLOSSARY.md`](docs/GLOSSARY.md) when you spot a missing term.

If you do code, see [`CONTRIBUTING.md`](CONTRIBUTING.md). Strict TypeScript, no `any` without justification, local-first stays sacred (no network calls, no backends).

## Acknowledgments

Built with — and continuously road-tested by — **Rayne Harris** (BFA SM, Ball State University), without whom Standby would still be a Google Doc. Her current Otterbein summer internship is where every UX decision gets pressure-tested first.

Form structures lean on **Stern & Gold, *Stage Management* 12e** (the long-running practical text). Default note phrasing leans on **Porter & Alcorn, *Stage Management Theory as a Guide to Practice* 2e** (the equity-and-inclusion-forward pedagogy). The *Off Headset* essay collection (Jaen & Sadler, eds.) is the supplementary reading that shapes the tone.

## License

[MIT](LICENSE) — do whatever you want with it. Universities can fork, rebrand, and self-host. Cast members can keep their own copy. Send patches back if you build something useful.
