# Standby — Product Requirements

**Status:** Draft v0.3 — pre-scaffold gate cleared
**Owner:** Shannon Harris
**Last updated:** 2026-05-25 (decisions resolved; M0 ready to scaffold)

---

## 1. Vision

A free, offline-first, browser-based **personal paperwork tool** for theatre stage managers. Form structures align with **Stern & Gold, *Stage Management* 12e** (the textbook drilled at Ball State and many BFA programs). Note phrasing and collaborative tone align with **Porter & Alcorn, *Stage Management Theory as a Guide to Practice* 2e** (the equity-and-inclusion text). Targets the SM at the desk drafting, archiving, and exporting; ships clean letter-paper PDFs and batched distribution to collapse the "email it out" tax.

We're not a team-wide call board with push notifications — that's [Virtual Callboard](https://www.virtualcallboard.com/)'s lane ($20-$150/month, backend-required, used by Ball State and similarly-resourced college programs). **We are what the SM uses to *make* the paperwork** — for the many contexts (summer programs, community theatre, post-graduation regional/fringe gigs, departments that don't carry a VCB subscription) where there is no callboard tool and the SM is otherwise sending individual emails to thirty people every night.

## 2. Target user

**Primary:** SMs working in environments **without** Virtual Callboard or an equivalent — i.e. the SM who is currently emailing each piece of paperwork to each person manually.

**Concrete buckets:**
- College SM students at programs without VCB.
- Summer theatre / festival / internship programs (most don't have a year-round VCB subscription).
- Community theatre, high-school theatre, fringe productions.
- Post-graduation SMs from VCB-equipped programs entering venues that lack the budget for VCB.
- Regional and small-house Equity SMs whose productions don't budget for VCB.

**Motivating user:** Shannon's daughter — BFA SM at **Ball State University** (where her professor Chris, an AEA member, drilled the 100-page Equity rulebook), currently on **summer internship at Otterbein University's summer theatre program**. At Ball State she has Virtual Callboard; at Otterbein this summer she's doing the manual-email thing she hates. She represents both halves of our target — knows what good distribution feels like (VCB-at-Ball-State) *and* is living the pain right now (manual-email-at-Otterbein-summer).

**Explicitly NOT primary:**
- College programs already paying for VCB (Ball State, Lycoming, etc.) — their distribution problem is solved.
- Broadway / national tour / large LORT-house Equity SMs — they have Stage Write + production-paid VCB.
- Production management roles (Propared / ProductionPro territory).
- Lighting / sound designers (QLab / EOS territory).

## 3. Problem statement

From the research pass (see [RESEARCH.md](RESEARCH.md)):

1. **Stage Write** is iPad-only, subscription-priced, cloud-locked, weak on PDF export. Strong on blocking-on-ground-plan; weak on everything else.
2. **Virtual Callboard** ($20-$150/mo, EmptySpace Technology) leads on distribution: read-receipt-tracked report sends, scheduling with double-booking detection, customizable report templates, contact sheets with privacy controls, mobile + push notifications. Used by Ball State, Lycoming, and others — but **requires a department-level vendor approval and budget** that many programs and venues don't have.
3. **VCB doesn't do** line notes, blocking, or prop tracking. The "paperwork the SM personally drafts" tier is unowned even at VCB-equipped programs.
4. **Without VCB**, SMs live in Google Sheets + Notion + GoodNotes + paper binders + individual emails to every person every day. Direct quote from our motivating user (currently at her summer internship): *"I don't like sending out individual emails. I will miss [Virtual Callboard] when I graduate."*
5. **No open-source competitor** exists. Genuine gap.

## 4. Non-goals

For V1 *and* V2:
- **Real-time multi-user features.** No push notifications, SMS, read receipts, attendance broadcast. (VCB's lane; we can't replicate without a backend.)
- **Backend-as-a-service.** Static site only. No accounts, no servers we operate.
- **Blocking-on-ground-plan editor.** Stage Write's strength, patent-encumbered. We can display an uploaded ground plan image for reference; no spatial editor.
- **Live cue execution.** QLab / EOS territory.
- **Mobile-native iOS/Android app.** PWA only.
- **Equity contract / payroll management.** Not our problem.
- **Script PDF rendering with markup.** V2.5+ at earliest. Don't fight GoodNotes/Stage Write here.

## 5. Core principles

| # | Principle | Operational meaning |
|---|-----------|---------------------|
| 1 | **Local-first** | Data lives in IndexedDB. JSON export at any time. No required network call to read or write the SM's own show. |
| 2 | **Offline by default** | PWA, installable. Service worker caches the app shell + assets. Works in rehearsal-room basements. |
| 3 | **Print-quality PDF** | Letter paper, page numbers, production header on every page. PDF is a first-class export designed against Stern/Gold form conventions. |
| 4 | **Free forever** | Static hosting on GitHub Pages. MIT license. No accounts. |
| 5 | **Stern/Gold form structure, Porter/Alcorn tone** | Rehearsal-report sections, daily-call format, and abbreviations follow Stern & Gold 12e. Default phrasing of notes and comments follows Porter & Alcorn's collaborative, equity-centered framing (e.g. "would love clarification on…" rather than "this is wrong"). |
| 6 | **Never lose the SM's work** | Autosave on every change. Local versioning. Crashes recover. No silent failures. |
| 7 | **Fast under pressure** | Big touch targets, no modal confirmations, keyboard shortcuts, dark mode. |
| 8 | **Make distribution suck less** | Where we can't replicate VCB, we collapse the manual-email gap: contact groups, prefilled `mailto:` / Web Share API, downloaded PDF ready to attach, batched send to multiple recipient groups, send log. |

## 6. Personas

### The SM — BFA student, Ball State, on summer internship at Otterbein

Trained at Ball State on Virtual Callboard, taught from Stern & Gold + Porter & Alcorn + *Off Headset*. Her professor (AEA member) drilled the 100-page Equity rulebook over two months. MacBook user.

**During the school year at Ball State:** has VCB for distribution. Doesn't need Standby for that. Could use Standby for the personal paperwork tier VCB doesn't cover (line notes, prop tracking, draft archive).

**This summer at Otterbein's summer theatre program:** no VCB. Currently emailing every cast/crew member every piece of paperwork individually. This is where she'd adopt Standby today.

**Post-graduation:** entering a world that mostly doesn't have VCB. Will need Standby as her default workflow.

**What she wants:**
- Stern/Gold-conforming rehearsal report PDF in <5 min after rehearsal.
- A "send this to the cast" button that pre-fills BCC + subject + body and surfaces the PDF for one-drag attach.
- A schedule view that flags Equity break-rule violations (5-and-5, etc.) like her textbook + her professor taught her.
- Musical-aware features later (her current Otterbein show is a musical: bar-number cue tracking, song list).

### Director (consumer)

Receives rehearsal reports, attendance updates, contact changes, prop list updates by email. Doesn't log in to anything. Wants PDFs she can print or forward.

### Props master (consumer)

Wants the prop list as a CSV she can open in Excel.

## 7. Feature catalog

Each feature: what it is, what data it owns, what it exports, which milestone.

### 7.1 Production setup — **V1**

- **Data:** production name, working title, season/year, type (play / musical / devised / cabaret), producing organization, venue, key dates. Settings: paper size, dept categories, Equity-mode (default on).
- **Behavior:** new-show wizard, JSON import.
- **Export:** JSON (full show), production information sheet PDF.

### 7.2 Contact sheet — **V1**

- **Data:** contacts grouped by role-category (Cast, Creative, Production, Crew, Venue/Admin). Per contact: name, role/character, email, phone, **pronouns**, emergency contact (opt-in), allergies/medical (opt-in, private), notes, "do-not-publish" flag.
- **Behavior:** search, filter, named **contact groups** ("All Cast", "All Designers", "Music Team", etc.) used by §7.9 distribution.
- **Export:** PDF, CSV, vCard.

### 7.3 Rehearsal report — **V1**

Template structure matches Stern & Gold 12e and USITT/Bard/Routledge samples.

- **Data per report:** header (production, date, day #, start/end, location); attendance (per-person: present / late-amt / absent / excused); time breakdown (scene/time blocks); departmental notes numbered + grouped by Scenic / Costumes / Wigs & Makeup / Props / Lighting / Sound / Projections / Music / Production; carry-forward open items.
- **Behavior:** start-new pre-fills date + increments day #. Dept sections auto-collapse if empty. Boilerplate per-production. Note phrasing templates default to Porter/Alcorn-aligned collaborative tone.
- **Export:** PDF (single page where possible, repeating header), plain-text for email body.

### 7.4 Line notes — **V1**

- **Data per note:** rehearsal date, page, character, line type (paraphrase / drop / add / jump / missed cue / call line), scripted text, spoken text, comment.
- **Behavior:** fast-entry keyboard-only mode for during-rehearsal capture. Character auto-complete. Group by actor. "Delivered" mark to clear.
- **Export:** per-actor PDF (only that actor's lines), bulk CSV archive.

### 7.5 Prop list — **V1**

- **Data:** prop name, scene(s), character(s), consumable Y/N, source (rental / build / buy / pulled / actor-personal), status (needed / sourced / in-rehearsal / built / lost-replace), props-table location, special handling (food / weapons / fire / breakaway).
- **Behavior:** filter/sort by scene/character/status; bulk status update.
- **Export:** PDF, CSV.

### 7.6 Show report — **V1.5**

- **Data per performance:** date, performance # (e.g. "Preview 2"), house count, late seating, run times by act, intermission times, hold times w/ reason, incidents, dept notes.
- **Export:** PDF, plain text.

### 7.7 Schedule + daily call — **V1.5**

- **Data:** calendar of rehearsal blocks (date, start, end, location, called actors, scenes worked).
- **Behavior:** calendar view; daily-call generator; **Equity-rule lint** (5-and-5, 10/12, lunch/dinner timing). Honors the rulebook her professor drilled.
- **Export:** PDF daily call, .ics, plain text.

### 7.8 Character / scene breakdown — **V2 (source-of-truth)**

- **Data:** scenes (or musical numbers / French scenes) × characters matrix. Per cell: enter page, exit page, type (speaking / singing / silent / underscoring), doubling. Musical-aware: number list, running time per number, bar-count.
- **Drives:** schedule generator, prop list, costume plot (V2.5+).
- **Export:** PDF (matrix grid), CSV.

### 7.9 Distribution / share — **V1** ⭐ (new — directly addresses the daughter's #1 pain)

We can't replicate VCB's backend, but we can collapse the "email everyone individually" tax to seconds.

- **Contact groups** (defined in §7.2): SM-defined named groups; smart-groups for role-based selection.
- **One-click send** from any paperwork view:
  - Generate PDF.
  - Open user's mail client via `mailto:` with subject prefilled, recipients BCC'd (so reply-all doesn't blow up), body text seeded ("Today's rehearsal report attached"), date stamped.
  - Surface the downloaded PDF in a UI ready for one-drag attach (mailto: can't carry attachments — this is the unavoidable manual step).
- **Web Share API** on mobile — invokes OS share sheet with the PDF for full-attachment workflow on phones.
- **Batched send:** pick artifact(s) + recipient group(s) + go. One email per group, not one per person.
- **Send log:** local audit of what was sent, when, to whom. (No backend; SM's own record.)
- **V2 stretch — "Publish Bundle":** export a folder of mobile-friendly HTML pages of the show's latest paperwork. SM hosts the folder on Google Drive / Dropbox / school's shared drive / their own gh-pages. Cast/crew click the share link to see a read-only callboard-like view. A poor-man's read-only VCB built on cloud storage the SM already has, with no backend on our side.

## 8. Data model overview

Adds `pronouns` and `contact_groups`; otherwise unchanged from v0.1.

```
Production
├── meta            (name, dates, venue, type, org)
├── settings        (Equity-mode, paper size, dept categories, boilerplate)
├── contacts        []        // + pronouns, emergency, medical, do_not_publish
├── contact_groups  []        // named groups used by distribution
├── characters      []
├── scenes          []        // V2 breakdown
├── scene_chars     []        // V2 join (matrix)
├── props           []
├── rehearsals      []        // each with report + line_notes + attendance
├── performances   []        // each with show_report
├── schedule        []        // calendar entries
├── send_log        []        // local "what was sent when" record
└── exports         []        // local PDF export history (metadata)
```

Dexie/IndexedDB. JSON round-trip-able. Versioned schema migrations.

## 9. Tech stack

Pending sign-off (§11.1):
- **React + TypeScript + Vite**
- **Tailwind CSS** (with `@media print` stylesheet)
- **React Router** (data routers)
- **Zustand** (state)
- **react-hook-form + zod** (forms + validation)
- **Dexie** (IndexedDB)
- **@react-pdf/renderer** (structured PDF; code-split, loaded on first export)
- **vite-plugin-pwa** (service worker + manifest)
- **Vitest + Playwright** (unit + E2E)
- **GitHub Actions → GitHub Pages**
- **MIT license**

Bundle target <500 KB initial.

## 10. UX principles

- SPA, left nav per artifact, "Today" dashboard.
- Print stylesheet hides nav, normalizes margins.
- Dark mode (booth/backstage), defaults to system.
- Keyboard-first: `N` new line note, `R` new rehearsal report, `Cmd+S` save-and-stay, `Cmd+E` open distribute panel.
- 44pt minimum touch targets.
- All destructive actions undoable via toast + per-show recycle bin.
- IndexedDB errors visible, not silent. JSON-dump-to-clipboard escape hatch on fatal errors.

## 11. Decisions & remaining questions

**Resolved (v0.3, 2026-05-25):**

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Tech stack | §9 stack approved as proposed. |
| 2 | Repo visibility | **Public** on Shannon's personal GitHub account; MIT license; gives free GH Pages + OSS positioning for the "no open-source competitor" gap. |
| 3 | Custom domain | Stick with `*.github.io` for now; revisit post-V1. |
| 4 | Distribution scope | **Option (c)**: minimal `mailto:` + PDF surface + Web Share API + commit to **Publish Bundle** on the roadmap. Publish Bundle promoted from M5-stretch to a V1 commitment (realistically still post-Otterbein-summer; see §12). |
| 5 | Otterbein internship end | ~9 weeks from 2026-05-25 → roughly **2026-07-27** (end of July). M2 target: ship by ~2026-07-06 so daughter has 3 weeks of real-show use before her summer ends. |

**Resolved (daughter, v0.3):**

| # | Decision | Resolution |
|---|----------|------------|
| 6 | Musical bar-count vs through-composed | Daughter doesn't know yet. Design data model flexibly: support both bar-count cue keying and line/page keying. |
| 7 | PDF aesthetic | **Formal** — serif body, Broadway-PSM packet aesthetic. Default font family TBD via type-spike (Garamond / EB Garamond / Caslon-variant candidates). Stern/Gold-conformant layout. |
| 8 | Cast time-off submission flow | **No** — director controls all time-off; SM and director own the schedule. Standby will not include a cast-side time-off submission feature. |

**Still open (lower priority — defer past M0):**

- App icon / favicon / branding visual identity.
- "What's New" changelog page in-app vs README-only release notes.
- Analytics (none for v1.0 — respect "no accounts / no tracking" stance; consider Plausible-style privacy-respecting metrics post-launch if useful).

## 12. Phasing

Concrete dates anchored to a 9-week Otterbein summer window (PRD-v0.3 date 2026-05-25 → ~2026-07-27 summer end).

| Phase | Contents | Target window |
|-------|----------|---------------|
| **M0 — Scaffold** | Vite + TS + Tailwind + Dexie + Router + Zustand + PWA + GitHub Actions → Pages deploy. Empty app shell with left-nav layout, dark/light mode, MIT license, CI green, `https://<user>.github.io/standby` live. | 2026-05-26 → 2026-06-01 |
| **M1 — Foundation** | Production setup (§7.1), contact sheet with pronouns + named groups (§7.2), JSON import/export, base print stylesheet, Garamond/EB-Garamond type spike, baseline PDF export via @react-pdf/renderer. | 2026-06-02 → 2026-06-15 |
| **M2 — Daily-driver paperwork + distribution** | Rehearsal report (§7.3), line notes (§7.4), prop list (§7.5), full PDF exports, **distribution v1** (§7.9: mailto: + Web Share API + send log). Onboard daughter on a real Otterbein rehearsal day. | 2026-06-16 → 2026-07-06 |
| **M2.5 — In-summer hardening** | Bug fixes from daughter's real-show feedback. Polish PDF layouts. Whatever real-use friction surfaces. | 2026-07-06 → 2026-07-27 |
| **M3 — Run-of-show** | Show reports (§7.6), schedule + daily call with Equity-rule lint (§7.7). | Post-summer (2026-08+) |
| **M4 — Source-of-truth** | Character/scene/musical-number breakdown matrix (§7.8); retrofit schedule + props to use it as source of truth. | Post-M3 |
| **M5 — Publish Bundle** | Committed (§7.9 stretch). Static HTML export of show paperwork for cloud-drive / school-shared-drive hosting; closes more of the VCB gap. Realistically post-summer; promoted from "maybe-someday" to a V1 commitment. | Post-M3 / parallel with M4 |

**Critical path:** M2 by 2026-07-06 gives daughter 3 weeks of real-show use before her summer ends. M2.5 absorbs the inevitable "this is broken in practice" feedback. M3+ continues post-summer when she's back at Ball State on VCB and the use-case is the next non-VCB context (her own future, plus secondary users).

## 13. Success metrics

- M2 ships; daughter uses Standby on a real day of her Otterbein summer program instead of Google Docs + individual emails.
- One distribution session takes <60 seconds for her, vs the multi-minute manual loop today.
- Her Otterbein supervisors accept the printed rehearsal report format without comment ("Stern/Gold-conforming").
- App works offline in the rehearsal room.
- Bundle size <500 KB initial load.
- Zero data-loss bug reports across a full production.

---

*Pre-scaffold approval gate: §11 questions 1–4 must be answered before M0 work begins.*
