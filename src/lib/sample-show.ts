import { importShow, type ShowExport } from './io'

/**
 * URL of the bundled sample show. Lives in `public/samples/` so it's
 * served as a static asset (and cached by the service worker for offline
 * use) — and so it can be downloaded directly by anyone who wants to peek
 * at the export format or share a starter show with someone.
 *
 * Note: with Vite + GitHub Pages we prepend BASE_URL so the path resolves
 * to `/standby/samples/midsummer.standby.json` in production and
 * `/samples/midsummer.standby.json` in local dev.
 */
const SAMPLE_PATH = 'samples/midsummer.standby.json'

export function sampleShowUrl(): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base.replace(/\/$/, '')}/${SAMPLE_PATH}`
}

export const SAMPLE_SHOW_LABEL = "A Midsummer Night's Dream"
export const SAMPLE_SHOW_DESCRIPTION =
  'A studio production of Midsummer in pre-tech: 12 cast, design team, 3 rehearsal reports, 9 props, 5 line notes, named groups, and a few send-log entries. Imports as a new production alongside whatever you already have.'

/** Fetch the sample show JSON and import it. Returns the new production id. */
export async function loadSampleShow(): Promise<number> {
  const response = await fetch(sampleShowUrl())
  if (!response.ok) {
    throw new Error(`Couldn't fetch the sample show (HTTP ${response.status}).`)
  }
  const data = (await response.json()) as ShowExport
  return importShow(data)
}
