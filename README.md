# Standby

A free, offline-first, browser-based paperwork hub for theatre stage managers.

## What it is

Standby is the boring 80% of stage management software that nobody else does well: rehearsal reports, line notes, prop lists, contact sheets, show reports, schedules, and character/scene breakdowns. All in one place. All local-first. No accounts. No subscription. Prints cleanly to letter paper for the director's binder.

Targeted at college BFA stage management students and the community-theatre / fringe SMs who don't have a production line item for Stage Write's $60/yr personal subscription.

## Status

🚧 Planning phase. No code yet. See [docs/PRD.md](docs/PRD.md) for product direction and [docs/RESEARCH.md](docs/RESEARCH.md) for the research that informed it.

## Docs

- [PRD](docs/PRD.md) — product requirements, phasing, data model, tech-stack proposal, open questions.
- [Research](docs/RESEARCH.md) — stage management primer + competitive landscape, with cited sources.
- [Glossary](docs/GLOSSARY.md) — stage management vocabulary used throughout the docs and (eventually) the UI.

## Principles

1. **Local-first.** Your show lives in your browser's IndexedDB and as JSON on your disk. Not on someone else's server.
2. **Offline by default.** PWA, installable, service worker caches everything. Backstage wifi can't block you.
3. **Print-quality PDF.** Letter paper, clean headers and footers, conventions matching what college BFA programs teach as the professional standard.
4. **Free forever.** Static site on GitHub Pages. No accounts, no paywalls.
5. **Equity conventions by default.** Because that's what college programs teach. Optionally configurable.
6. **Don't lose the SM's work.** Autosave on every keystroke. Versioned local exports. No silent failures.

## Hosting

Live at **https://shannonh.github.io/standby/** once pushed to `main` and Pages is enabled on the repo. PWA-installable on desktop and mobile browsers.

## Development

Prerequisites: Node.js ≥ 20.

```sh
npm install
npm run dev        # local dev server (auto-reload)
npm run build      # production build → dist/
npm run preview    # serve the production build locally
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run test       # vitest unit tests
npm run test:e2e   # playwright end-to-end tests
```

### Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml` which lints, type-checks, tests, builds, and publishes to GitHub Pages. To wire it up:

```sh
gh repo create ShannonH/standby --public --source=. --remote=origin --push
# then on github.com: Settings → Pages → Build and deployment → Source: GitHub Actions
```

## License

MIT. See [LICENSE](LICENSE).
