# Changelog

All notable changes to Standby are documented here. Format roughly follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning will follow [SemVer](https://semver.org/) once we tag a 1.0 release.

## Unreleased

### Added

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
