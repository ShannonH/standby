# Changelog

All notable changes to Standby are documented here. Format roughly follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning will follow [SemVer](https://semver.org/) once we tag a 1.0 release.

## Unreleased

### Accessibility

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
