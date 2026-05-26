# Security policy

## Threat model

Standby is a static single-page application. It has no backend, no accounts, no analytics, no telemetry. The browser is the only runtime, and the user's IndexedDB is the only data store. That means:

- There are no servers to compromise.
- There is no shared user data to leak.
- A successful attack on the client affects only that user's local data.

The realistic concerns are:

1. A malicious dependency in the build pipeline (npm supply chain).
2. A bug that corrupts or loses local data.
3. An XSS or HTML-injection bug that lets a crafted import file run code in another user's browser.

## Reporting a vulnerability

If you've found something that looks like a security issue:

- **Do not** open a public GitHub issue with reproduction steps.
- **Do** report it through GitHub's [private vulnerability reporting](https://github.com/ShannonH/standby/security/advisories/new) for this repo. That opens a private channel visible only to the maintainer; no public exposure during triage.

Include a clear description and, ideally, a minimal reproduction. Expect an initial reply within 5 business days. Coordinated disclosure timelines will be agreed in that first reply.

## Scope

In scope:

- The published JavaScript/HTML/CSS at `https://shannonh.github.io/standby/`.
- The Docker image published to GitHub Container Registry.
- Source code in this repository.

Out of scope:

- Third-party services a user chooses to integrate (their cloud-storage app, their mail client, etc.).
- Stale browser-cache or service-worker behavior that the user can resolve with a refresh.
- Issues that require an attacker to already have physical access to the user's device.

## What you can expect

- Acknowledgment within 5 business days.
- A fix in `main` and a published release for serious issues, with credit if you'd like it.
- Honest engagement — this is a personal project, not a vendor; turnaround for non-critical issues depends on volunteer time.
