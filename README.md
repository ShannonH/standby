# Standby

> *Standing by.*

**Standby** is a free, open-source paperwork hub for theatre stage managers. Rehearsal reports, daily calls, line notes, prop tracking, contact sheets — with clean PDF output that matches what BFA programs teach as professional standard. Runs in your browser, with no accounts, no subscriptions, and no servers required. Self-host it in Docker if you're a university; open the live site if you're not.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Made for: Stage Managers](https://img.shields.io/badge/made%20for-stage%20managers-b91c1c.svg)](docs/RESEARCH.md)
[![Built with: TypeScript](https://img.shields.io/badge/built%20with-TypeScript-3178C6.svg)](https://www.typescriptlang.org/)
[![Live site](https://img.shields.io/badge/live-shannonh.github.io%2Fstandby-success.svg)](https://shannonh.github.io/standby/)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4-ec4899.svg)](https://github.com/sponsors/ShannonH)

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

**Sample shows:** First-run? The Production page shows two pre-populated samples — a Shakespeare play (*A Midsummer Night's Dream*, 12 cast) and a Gilbert & Sullivan musical (*The Pirates of Penzance*, 14 cast). One click loads either, with every feature populated — rehearsal reports, show reports, daily calls, props, line notes, master tracking, blocking, break logs, scene breakdown matrix — so you can poke around without typing a thing.

## What's in the box

### Dashboard

| Section | What it does |
|---|---|
| **Today** | Phase-aware dashboard: countdown hero ("Opening in 12 days." / "Opening — TONIGHT." / "The show is closed."), milestone timeline strip (First reh → Designer run → Tech start → First preview → Opening → Closing), stat cards that flag what needs attention, next-call card, "Standing by" nudges for undelivered line notes and undistributed reports, recent activity feed. |

### Daily / nightly paperwork

| Section | What it does |
|---|---|
| **Production** | Show metadata + key dates, distribute the production info sheet, send-log audit trail. |
| **Contacts** | Cast / Creative / Production / Crew / Venue, pronouns + do-not-publish flag, named groups for batch distribution. |
| **Daily call** | The night-before call sheet — staggered call times, schedule with abbreviated cast lists, "Subject to Change" footer, script-font title to match the Broadway-poster aesthetic. |
| **Rehearsals** | Stern/Gold-format report: attendance, time breakdown, 9 departmental note sections. PDF and inline-body email. |
| **Show reports** | The run-of-show counterpart to rehearsal reports. Run times by act, intermissions, holds, incidents (medical / audience / technical / safety / other), understudy & swing changes, same 9-dept notes. |
| **Line notes** | Fast-entry mode (Enter saves and clears the form so you keep typing), grouped by actor, per-actor private PDFs. |

### Source-of-truth surfaces

| Section | What it does |
|---|---|
| **Props** | Master list, inline status dropdown in the table, six special-handling tags (food / weapons / fire / breakaway / fragile / liquid), CSV for the props master. |
| **Tracking** | Master tracking sheet — one row per event (entrance / exit / crossover / scene shift / crew action), drag-to-reorder, CSV import + per-actor track PDF. |
| **Breakdown** | Scene × character matrix. Click a cell to mark presence (●♪○~ for speaking / singing / silent / underscoring), enter entrance / exit pages, and free-text doubling / quick-change notes. The source of truth that drives schedule + prop assignment in V2+. |
| **Blocking** | Zone-tap schematic for capturing actor positions per scene — quick coverage without becoming a Stage Write replacement. |
| **Breaks** | Equity-rule break calculator: 5-and-5, 10-and-12, lunch/dinner timing per AEA convention. |

### Settings + storage

| Section | What it does |
|---|---|
| **Settings** | 8 distinct themes with full type systems, font size scaling, paper size, time format, your-name greeting + email sign-off, **and** backup & storage: auto-backup folder (Standby writes a JSON snapshot to a folder you pick — point at iCloud Drive / Dropbox / Google Drive for off-device backup), publish folder (PDFs auto-written for crew consumption), and manual JSON export/import. |

Every paperwork page has a **Distribute** panel that opens your mail client with the right BCC group, the full report inline in the body (no attachments to remember), and a sign-off with your name. Mobile users get a Web Share path with the PDF actually attached.

## Built for students

Standby's first user is a college stage management student. Every UX decision is pressure-tested against the question "would this work for an SM in their first real-show gig?"

- **Free, no signup, no email collection.** Static site on GitHub Pages. Your data never leaves your device unless you export it.
- **Works on a phone.** Mobile nav drawer, responsive layouts, Web Share API for distributing PDFs from a phone in the booth.
- **Works in the basement.** Installable PWA. After first load, it works offline forever. Rehearsal rooms with no WiFi don't break it.
- **Works on a school laptop.** No native app, no privileged install, runs on Chromebooks. Self-hostable in Docker for university IT departments that need everything on-premise.
- **Sample shows for learning.** Two fully-populated sample productions (a play + a musical) demonstrate every feature without a real show.
- **Conventions match what BFA programs teach.** Forms follow Stern & Gold 12e; default note phrasing follows Porter & Alcorn's collaborative tone; pronouns are a first-class field; the Equity break calculator honors the AEA rulebook.

## Accessibility

Built with WCAG 2.1 AA as the floor, not the ceiling. Recent Lighthouse runs: **100/100** accessibility on Today, Production, Contacts, Settings; **95/100** on Tracking (the densest data view, capped by a third-party drag-and-drop library's structure).

- **Keyboard-navigable everywhere.** Tab order is sequential, focus indicators are visible 2px accent-colored rings (no theme breaks the indicator), focus moves to the right place when modals/drawers open and returns to the trigger on close.
- **Screen-reader friendly.** Semantic HTML — `<main>`, `<nav aria-label>`, `<table>` with `scope="col"` headers, `role="dialog" aria-modal="true"` on overlays. Every icon-only button (trash, hamburger, close) carries a specific `aria-label`. Required form fields are marked `aria-required="true"` with visible asterisks. Validation errors are linked to inputs via `aria-describedby` and announced via `role="alert"`.
- **Color contrast at AA or better.** All body text passes WCAG AA against every theme + dark/light mode combination. Critical-action color (red Delete) was demoted from solid buttons to muted trash icons that turn red only on hover — destructive actions no longer dominate the visual hierarchy.
- **Eight themes for visual preference.** Default (Broadway-PSM serif), Stage (warm cream + amber), Midnight (cool slate + cyan, booth-console mono), Greenroom (sage + emerald), Marquee (cream + crimson, gilded borders), Rosewood (italic Cormorant, vintage parlor), Sampler (oatmeal + plum, handwritten), Raynebow (rainbow-gradient headings on pastel surfaces). Each theme has its own type system, surface palette, and border radius — not just accent recolors. Light and dark modes on every theme.
- **Font-size scaling.** Four sizes — Small (14px) / Medium (16px, default) / Large (18px) / Extra-large (20px) — scales the entire UI, useful for reading from across a dark booth or for users who prefer larger text generally.
- **Time-format and paper-size preferences.** 12-hour ("6:00p") or 24-hour ("18:00") affects every UI surface and every generated PDF. Letter or A4 paper size.
- **Reduced-motion respected.** Mobile drawer slide-in, back-to-top smooth-scroll, and other animations all check `prefers-reduced-motion` and skip if set.
- **Print stylesheet.** Every report prints cleanly on letter or A4, no `.print:hidden` UI chrome leaking onto the page.

Found a barrier? File an [accessibility issue](https://github.com/ShannonH/standby/issues/new). Screen-reader, switch-control, and low-vision testing reports are especially welcome.

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

## Supporting Standby

Standby is and will remain free for stage managers — that's not negotiable. The OSS version on this repo is the canonical Standby, and nothing about that changes if the project finds an audience.

If you've found Standby useful and want to help it stick around:

- **[Sponsor on GitHub](https://github.com/sponsors/ShannonH).** Recurring or one-time. Goes toward maintenance time, a future custom domain, and the long-term path to a hosted "Standby Cloud" tier if there's appetite for one.
- **Use it on a real show and tell us what broke.** Real-show friction is worth more than money. Open an [SM workflow gap](https://github.com/ShannonH/standby/issues/new?template=sm-workflow.yml) issue.
- **Tell your program / theater about it.** Word-of-mouth in the SM world is how anything ever gets adopted. If you're at a BFA program or working at a theater that might benefit, send the link.

### If the project grows…

A few things on the wishlist that depend on Standby finding a real audience:

- **A proper domain** — `standby.app` or similar, instead of the GitHub Pages URL. The current `shannonh.github.io/standby/` works fine, but a dedicated domain would be a one-time setup that makes it easier to share with universities and theaters, and gives Standby a stable address even if the deployment infrastructure ever changes. About $15/yr; happens once there's demand to share more broadly.
- **An optional hosted "Standby Cloud" tier** — for the things local-first structurally can't do: multi-device sync (laptop + phone showing the same show), team accounts for co-SMs, a shared "publish folder" URL for cast/crew without needing Dropbox. The free version stays free and unchanged; the hosted version would be a separate paid product for SMs and institutions that want those specific things.
- **Institutional licensing for BFA programs** — branded, hosted, SSO-integrated installs for theatre departments. Faculty admin surface, archived shows across semesters, FERPA-friendly infrastructure.

None of those are urgent. They're things to invest in if and when Standby is actually being used at scale. If you'd like to see any of them happen, the sponsor button is the clearest signal.

## Acknowledgments

Standby exists because of my daughter, **Rayne Harris**, who's studying stage management at Ball State University. She's the reason this app got built — watching her email every cast member individually with rehearsal PDFs from her Otterbein summer internship made it obvious there should be a tool for this. She's also the primary road-tester: every UX decision gets pressure-tested against a real summer at Otterbein Theatre before it ships.

Form structures lean on **Stern & Gold, *Stage Management* 12e** (the long-running practical text). Default note phrasing leans on **Porter & Alcorn, *Stage Management Theory as a Guide to Practice* 2e** (the equity-and-inclusion-forward pedagogy). The *Off Headset* essay collection (Jaen & Sadler, eds.) is the supplementary reading that shapes the tone.

## License

[MIT](LICENSE) — do whatever you want with it. Universities can fork, rebrand, and self-host. Cast members can keep their own copy. Send patches back if you build something useful.
