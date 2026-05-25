# Contributing to Standby

Welcome. Standby is built **with** stage managers, not just for them — so contributions from working SMs, students, faculty, and developers are all wanted, and you don't need to write a line of code to help.

## Ways to contribute (no code required)

- **Use it on a real show and tell us what broke.** Open an issue with the [SM workflow gap](.github/ISSUE_TEMPLATE/sm-workflow.yml) template. Real-show friction is the most valuable input.
- **Correct the conventions.** If a form section, abbreviation, or piece of vocabulary doesn't match what your program teaches, open an issue or a PR against [`docs/GLOSSARY.md`](docs/GLOSSARY.md).
- **Share sample paperwork.** A redacted PDF from a show you've managed helps benchmark the PDF renderers. Attach to an issue.
- **Help with the README.** If something is unclear to a new SM, file an issue or PR — clarity is a feature.

## Ways to contribute (with code)

### Setup

```bash
git clone https://github.com/ShannonH/standby.git
cd standby
npm install
npm run dev          # local dev server with hot reload
```

Standby targets Node ≥ 20. The dev server runs on http://localhost:5173/standby/ by default.

### Project structure

```
src/
├── App.tsx                 # Layout shell, left nav, dark/light toggle
├── main.tsx                # Entry + router
├── routes/                 # Top-level pages (Today, Rehearsals, …)
├── features/<area>/        # Feature-scoped components, PDFs, hooks
├── components/             # Cross-feature shared UI primitives
├── lib/                    # Data layer + pure helpers
│   ├── db.ts               # Dexie schema (source of truth for shapes)
│   ├── schemas.ts          # Zod schemas for form inputs
│   ├── hooks.ts            # Live-query hooks (Dexie + React)
│   ├── io.ts               # JSON export/import
│   ├── publish.tsx         # File System Access publishing (per-show folder)
│   ├── text-reports.ts     # Plain-text renderers for email bodies
│   └── …
docs/
├── PRD.md                  # Product direction; read first when proposing features
├── RESEARCH.md             # Competitive landscape, SM-workflow primer
└── GLOSSARY.md             # Stage management vocabulary
public/samples/             # Sample show JSON imports
```

### House rules

- **Strict TypeScript.** `tsc --noEmit` must pass. No `any` without a comment explaining why.
- **Local-first stays sacred.** No network calls. No backends. The whole point is that a show survives without an internet connection. Sync via file export, not API.
- **Equity / inclusivity conventions in copy.** Default text in templates and forms leans Porter & Alcorn — collaborative, not corrective. Pronouns are first-class on contacts.
- **Forms use react-hook-form + zod.** One zod schema per input shape; derive the TypeScript type via `z.infer`.
- **Print stylesheet matters.** Anything page-like should look right in a director's binder when printed letter-paper.

### Code style

- **Prettier + ESLint flat config.** Run `npm run format` before committing.
- **Imports sorted by Prettier plugin.** Don't fight it.
- **File names: PascalCase for components, kebab-case for libs.** Match the existing files.
- **Test files live next to source** (`foo.ts` → `foo.test.ts`).

### Required checks before opening a PR

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

All four must pass. CI runs the same script on every push to `main`.

### Commit messages

Brief subject line in present-tense lowercase, prefixed with the area:

```
feat(daily-call): add Distribute button per row
fix(store): hydrate-time crash when persisted settings lack new fields
docs(readme): describe self-hosting flow
```

Longer body is welcome — explain *why*, not what (the diff shows the what).

### Pull requests

Use the [PR template](.github/PULL_REQUEST_TEMPLATE.md). Include screenshots for any UI change. Mention what you tested manually — for SM-impacting changes, "I generated a daily-call PDF and confirmed the layout" is more valuable than passing unit tests.

### Adding a new artifact type (e.g. costume plot, schedule, etc.)

1. **Data model:** add an interface + Dexie store in `src/lib/db.ts`, bump the schema version, and run a migration.
2. **Export/import:** add it to `ShowExport` in `src/lib/io.ts`, bump `SHOW_EXPORT_VERSION`, remap any cross-references in `importShow`, update the version-skew test.
3. **Form + list:** in `src/features/<area>/`, with `react-hook-form + zod`.
4. **PDF renderer:** in `src/features/<area>/<Artifact>Pdf.tsx`. Accept optional `paperSize` and `timeFormat` props.
5. **Text renderer:** in `src/lib/text-reports.ts` for inline-body distribution.
6. **Publish:** add `publishX` and `maybePublishX` helpers in `src/lib/publish.tsx`, include in `publishAll`.
7. **Distribution:** wire the route's per-artifact distribute panel via `DistributePanel`.
8. **Round-trip test:** confirm export → import preserves cross-references.
9. **Sample show:** add an example entry in `public/samples/midsummer.standby.json`.

The Daily Call feature (commit `e5a0a85`) is the most recent complete example of all of these.

## Code of conduct

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Contributions are MIT-licensed, same as the project. Submitting a PR means you're OK with that.
