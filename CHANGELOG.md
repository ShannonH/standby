# Changelog

All notable changes to Standby are documented here. Format roughly follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning will follow [SemVer](https://semver.org/) once we tag a 1.0 release.

## Unreleased

### Fixed

- **Older `.standby.json` files now import cleanly instead of throwing**. Standby was doing a strict version-equality check (`schemaVersion !== SHOW_EXPORT_VERSION`) which broke whenever we added a new entity to the bundle — a v9 export Rayne had cached locally couldn't load into a v10 build. Every version bump in this app's history has been purely additive (new sections appended, no existing field changed shape), so we now forward-migrate by filling in `[]` for any section that didn't exist in the source version. Files from a *newer* Standby (somehow exported on a future build) still throw, but with an actionable "refresh the page to update Standby" message. Five-line `migrateShowExport()` helper + three tests covering v1→current and v9→current migrations and the future-version refusal.

### Added

- **GitHub Sponsors plumbing** — `.github/FUNDING.yml` + a Sponsor badge in the README. Button activates on the repo page automatically once GitHub approves the account for the Sponsors program; the README badge links to the sponsor page in either case. README also picked up a "Supporting Standby" section that's honest about what sponsorship would fund (maintenance, eventually a custom domain, an optional hosted "Standby Cloud" tier for the things local-first structurally can't do) without committing to any specific timeline. The free OSS version explicitly stays free.

- **Production switcher in the nav**. A small "Current show" card now sits at the top of both the desktop sidebar and the mobile drawer, always visible from every route. When there's only one production it's a static label so the SM can confirm at a glance which show they're in; once there are two or more, it becomes a native `<select>` for one-tap switching. A "Manage…" link drops to the Production page for create / edit / delete. Native select on purpose — best mobile UX, keyboard- and screen-reader-accessible by default.

- **Scene breakdown matrix** (PRD §7.8 — the biggest remaining V2 feature). New `/breakdown` route with a scenes × characters grid: scenes down the side, characters across the top, each cell showing presence at a glance (● speaking · ♪ singing · ○ silent · ~ underscoring). Click a cell to edit presence, entrance / exit pages, and per-cell doubling / quick-change notes. Three new entities (`Character`, `Scene`, `SceneAppearance`) with Dexie v7 + ShowExport v10 migrations, sticky column / row headers for big shows, and full round-trip-aware id remapping in import/export. Both bundled samples now ship breakdown data: Midsummer (12 characters × 8 scenes, including Theseus/Oberon and Hippolyta/Titania doubling), Penzance (13 characters × 7 scenes, including the seven-part finale).

### Fixed

- **Theme preview cards now render their own body font**. Every card on the Settings page sets `data-theme={theme}` on its root, which correctly resolved CSS variables (--accent, --font-display, --font-body, etc.) to that theme's values — but body `<p>` elements never picked up `--font-body` because the relevant base rule was scoped to `<body>` only. Midnight cards advertised "Inter" and rendered Garamond; Sampler advertised "Nunito" and rendered Garamond; Raynebow rendered Garamond instead of Outfit. Fixed by extending the existing `[data-theme]:not(html)` rule to also set `font-family: var(--font-body)`.

### Changed

- **Backup & storage moved from its own nav route into Settings**. The three panels (auto-backup folder, publish folder, JSON import/export) are set-once, forget-about-it preferences — they belong alongside the other set-and-forget toggles (theme, font size, paper size) rather than competing for attention in the main paperwork nav. The `/backup` route is gone; the nav drops from 14 items to 13.
- **Production page IA split**. The Production route previously housed eight distinct concerns (production CRUD, exports, distribute panel, send log, auto-backup folder, publish folder, JSON import/export, sample shows). It's now focused on the production itself: list / create / edit, export the production-info PDF, distribute it, and inspect the send log. Auto-backup, publish folder, and JSON import/export moved to a new **Backup & storage** route (`/backup`). Sample-show loading moved to the empty-state CTA when no production exists yet — you wouldn't reach for a sample show after you already have one set up.

### Accessibility

- **Saved ✓ confirmation** on long forms (Rehearsal report, Show report). The Save button transitions through `Saving…` → `Saved ✓` over ~900ms before navigating back to the list, so the SM has visual proof their work landed before the form unmounts. The Cancel button hides during the saved state to avoid accidental clicks.
- **Centered empty-state CTAs** on Rehearsals, Show reports, and Daily call list views. The "+ New X" button used to stay in the header even when the list was empty; now the empty state contains the CTA centered with explanatory copy, and the header button hides until there's at least one entry.
- **Bumped Contacts category headings** (Cast / Creative Team / Production / Crew / Venue) — were thinner than nearby buttons; now larger display-font headings with row counts ("Cast (14)").
- **Relative timestamps** in the Send Log via a new shared `relativeTime()` helper (just now / 12m ago / yesterday / 3 days ago / Jun 22). Replaces absolute timestamps that ended up weird when the user crossed timezones or read across midnight. The Today dashboard's Recent activity widget now uses the same helper.
- **Mobile drawer slide-in animation** (200ms cubic-bezier, backdrop fade). `prefers-reduced-motion` users get instant open. Close stays instant so focus restoration is snappy.
- **Wordmark links to home** — `Standby` in the desktop sidebar and the mobile top bar are now `<NavLink to="/">`, matching the common convention.
- **Back-to-top button** appears on long pages (Production, Tracking) after scrolling past 400px. Smooth-scrolls to the top; jumps instantly for reduced-motion users.

- **Tracking table semantics**. Moved `<DndContext>` / `<SortableContext>` *outside* the `<table>` (they previously sat between `<table>` and `<tbody>`, injecting non-tabular `<div>` elements that broke the screen-reader accessibility tree — Lighthouse caught it as an invalid DOM-nesting warning). Added `scope="col"` to every `<th>` in Tracking and Props so column-header relationships are exposed. Lighthouse AX score on Tracking climbed 91 → 95. Also labeled the previously-orphan Search input and Filter-by-actor select via `<label>`-wrapping.
- **List-row Delete buttons demoted to ghost-style trash icons**. Solid red "Delete" buttons used to be the loudest element on every Contacts / Rehearsals / Show reports / Daily calls / Line notes / Props / Productions / Tracking row, drowning out the actual primary action (Distribute / Open). Now a small muted trash icon that turns red on hover — same destructive confirmation flow, just no longer screaming. Standalone "Delete this production" in the Production edit panel keeps its full-button treatment because it isn't competing with anything. New shared `IconButton` + `TrashIcon` in `Form.tsx`.
- **Mobile navigation drawer**. Previously the sidebar was `hidden sm:flex` with no replacement at narrow widths — phone users were stranded on whatever route loaded. Now `<640px` shows a top bar with a hamburger button and the Standby wordmark; tapping the hamburger slides a `role="dialog" aria-modal="true"` drawer in from the left containing the full nav + theme toggle. Drawer closes on link tap, backdrop tap, Escape, and route change. Initial focus moves to the close button; closing returns focus to the hamburger. Body scroll is locked while open. Desktop sidebar unchanged.
- **Visible focus indicators** on nav links and primary buttons. Previously the `NavLink` computed style resolved to `outline-style: none`, leaving keyboard users with no way to tell where focus was. Now every interactive nav surface and Button variant draws a 2px accent-colored ring on `:focus-visible`.
- **Required-field convention** added to the `Field` form primitive. Required fields show a red/accent asterisk after the label and set `aria-required="true"` on the input; optional fields keep their existing `(optional)` suffix. Production, Rehearsal, Show report, Daily call, Contact, Prop, and Line note forms mark their required fields.
- **Error-message a11y wiring**. `Field` now generates a unique input id via `useId()` and passes `aria-describedby` (pointing at the hint/error span) plus `aria-invalid="true"` down to `Input` / `Textarea` / `Select` via context. Screen readers now announce validation errors when an invalid field is focused. Errors also carry `role="alert"`.
- **AA-contrast fix** on the Tracking page's "drag to reorder" hint (was `text-muted/60` at ~3.4:1, now full muted at ~4.6:1).
- **Checkbox `hint` slot** for long descriptions. The AEA Equity and "include the full report in body" checkboxes now use a tight label + a muted hint line underneath rather than a two-sentence label.

### Fixed

- Storage panel formats large quotas as GB (e.g. "10 GB") instead of "10240.0 MB".
- "Loaded the The Pirates of Penzance" double-"the" in the sample-show load status message.

### Added

- **Today dashboard** — the route is now an actual dashboard rather than a tutorial stub. Composes six widgets keyed off the production's current phase (pre-production → rehearsal → tech → previews → performance → closed):
  - **Countdown hero** — the next milestone in theatrical phrasing: *"Opening in 12 days."* / *"Opening — TODAY."* / *"The show is closed (closed 3 days ago)."*
  - **Milestone strip** — horizontal phase indicator (First rehearsal → Designer run → Tech start → First preview → Opening → Closing) with past/current/future visual states.
  - **Stats row** — Contacts · Rehearsal reports · Props status (X/Y sourced) · Outstanding line notes · Show reports. Cards become links to the underlying routes; counts that need attention (props still needed, line notes undelivered) get accent color.
  - **Next call card** *(conditional)* — surfaces today's, tomorrow's, or this-week's daily call with location + earliest call time.
  - **Standing by** *(conditional)* — gentle nudges for undelivered line notes, undistributed rehearsal/show reports, and gap days in the rehearsal phase. Silent when caught up.
  - **Recent activity** — last four send-log entries with relative timestamps ("just now", "yesterday", "Jun 22"). Local-only audit trail.
  - All widgets gracefully no-op (return null) when there's nothing to say, so the dashboard tightens up rather than padding with empty boxes.
- **Phase / countdown library** (`src/lib/today.ts`) — pure functions for `phaseInfo()`, `countdownPhrase()`, `daysBetween()`, etc. with 23 unit tests covering DST-edge day-deltas, every phase transition, and the closed-show case.
- **Second sample show** — *The Pirates of Penzance* — joins Midsummer in the "Try a sample show" panel. Demonstrates a musical's shape: full musical creative team (music director, choreographer, vocal coach), bigger ensemble, music-rehearsal and sitzprobe daily calls, lyric drops in line notes, and tracking centered on song entrances rather than scene blocking. Sample-show API refactored to support arbitrary additional samples (drop a JSON in `public/samples/` and append to `SAMPLE_SHOWS`).
- **Show reports** artifact — the run-of-show counterpart to rehearsal reports. Schema bump to Dexie v6 and ShowExport v9. Form captures performance number / label, curtain up & down, house count, late seating, per-act run times (with auto-computed totals), intermissions, holds, incidents (medical / audience / technical / safety / other), understudy & swing changes (cast-linked), and the same 9-department notes structure as rehearsal reports — so designers reply with the same "Re: Costumes #3" convention. PDF in Stern/Gold style, distribution via inline-body, publish-folder integration writes into a `Show Reports/` subfolder.
- `Dockerfile`, `nginx.conf`, `docker-compose.yml` for university self-hosting. Build with `docker compose up -d` or pull the published image from GHCR once a release is cut.
- `VITE_BASE_PATH` build-time env variable so self-hosters can serve Standby from `/` instead of `/standby/`.
- Open-source hygiene: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, issue templates, PR template.

## 2026-05-25

### Added

- **Daily Call** artifact. Schema bump to Dexie v3 and ShowExport v6. Form supports staggered call times per cast, a notes list, and schedule items with four called-modes (all / company / specific / custom). PDF renders in Allura script with two-column call times and red highlights, matching the BFA-program convention. Distribution, publish-folder integration, sample-show entries.
- **Time format setting** (12h / 24h). `formatTime()` helper used across daily-call and rehearsal-report PDFs, list views, and inline-body email text. Defaults to 12h ("6:00p") to match US theater convention.
- **Sample show import** ("A Midsummer Night's Dream"): 22 contacts, 5 contact groups, 3 rehearsal reports, 9 props, 5 line notes, 5 daily calls spanning the rehearsal arc. One-click load from the Production page or download the JSON to inspect.
- **Auto-backup folder** via File System Access API. Standby writes the show JSON to a user-picked folder on every change (debounced 10s, plus on tab-hide). Permission survives reload.
- **Publish-to-shared-folder** feature, separate from the auto-backup folder. PDFs (rehearsal reports, contact sheet, prop list, production info, daily calls) get written into subfolders organized by type. Line notes are deliberately excluded — they're per-actor private.
- **Persistent storage request** on launch (`navigator.storage.persist()`) so Chrome won't evict Standby's IndexedDB under storage pressure.
- **Settings page**: theme picker (6 themes with distinct typography), font size, paper size, time format, your-name field.
- **Six themes** with full visual identity — fonts, surface palette, accent, border radius — not just accent recolors. Default / Stage / Midnight / Greenroom / Marquee / Rosewood. Custom CSS-variable architecture so adding a 7th theme is purely a CSS addition.
- **Name personalization**: time-aware greeting on Today ("Good evening, Rayne." / "Long night, Rayne."), automatic email sign-off on every distribution template.
- **Tab title** reflects current production + route ("Rehearsals · My Way — Standby").
- **Rotating SM-call tagline** under the wordmark: "Standing by." / "Hold for places." / "Cue 1, GO." etc.
- **Inline-body distribution**: rehearsal report / contact sheet / prop list / production info / line notes / daily call all render as plain text inline in the email body by default, matching SM convention. PDF remains an opt-in archival download.
- **Distribute panel**: contact-group BCC, mailto: with the correct RFC 6068 `%20` encoding for spaces, Web Share API path on mobile, send-log audit trail.
- **Rehearsal reports**: Stern/Gold 12e-conformant form, per-cast attendance, time breakdown, 9 departmental note sections with Porter & Alcorn-tone defaults, PDF export.
- **Line notes**: fast-entry mode (Enter saves and clears the form), grouped by actor in the list, per-actor private PDFs.
- **Prop list**: inline status dropdown in the table, six special-handling tags (food / weapons / fire / breakaway / fragile / liquid), CSV and PDF exports.
- **Contacts**: pronouns as a first-class field, do-not-publish flag (private fields never leak into the published contact sheet), named contact groups for batched distribution.
- **Production setup**: multi-show via JSON import/export, cascade delete with confirmation, key dates and Equity-mode flag.
- **JSON round-trip** for the entire show: contacts, groups, rehearsals, line notes, props, send log, daily calls. Schema versioned at the export level so older saves can be rejected cleanly.

### Notes

- Built as a static SPA on GitHub Pages. No backend, no accounts, no analytics.
- IndexedDB via Dexie for persistence. Zustand for app state, with localStorage persist for preferences.
- PDFs via `@react-pdf/renderer`, code-split so the renderer only loads on the first PDF generation.
- Fonts via `@fontsource` packages so the app is offline-capable.
- 62 unit tests across 13 files: io round-trips, time formatting, mailto encoding, CSV escaping, text-report shape, greeting bucket transitions, template sign-off patterns.
