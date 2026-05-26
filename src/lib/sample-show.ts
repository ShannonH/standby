import { importShow, type ShowExport } from './io'

/**
 * Bundled sample shows. Each one lives in `public/samples/` so it's
 * served as a static asset (cached by the service worker for offline use,
 * and downloadable directly by anyone who wants to inspect the export
 * format or share a starter show with someone).
 *
 * With Vite + GitHub Pages, BASE_URL is prepended so paths resolve to
 * `/standby/samples/<slug>.standby.json` in production and
 * `/samples/<slug>.standby.json` in local dev.
 *
 * Adding a sample: drop a `<slug>.standby.json` file in `public/samples/`,
 * then append an entry to SAMPLE_SHOWS below.
 */

export interface SampleShow {
  /** URL-safe identifier; also the filename in public/samples/. */
  slug: string
  /** Display name used on the button and confirmation toast. */
  label: string
  /** Long-form description for the "Try a sample show" panel. */
  description: string
  /** Short tag shown on the button alongside the title. */
  tag: 'Play' | 'Musical'
}

export const SAMPLE_SHOWS: readonly SampleShow[] = [
  {
    slug: 'midsummer',
    label: "A Midsummer Night's Dream",
    tag: 'Play',
    description:
      'A studio production of Midsummer in pre-tech: 12 cast, design team, 3 rehearsal reports, 9 props, 5 line notes, 97 master tracking entries (full show), 2 show reports from opening week, named groups, and a few send-log entries.',
  },
  {
    slug: 'penzance',
    label: 'The Pirates of Penzance',
    tag: 'Musical',
    description:
      'A mainstage Gilbert & Sullivan production well into tech: 14 cast (principals + ensemble), full musical creative team (music director, choreographer, vocal coach), 3 rehearsal reports across table read / music / staging, 7 props, daily calls for sitzprobe and wandelprobe, master tracking from pirate cove to police standoff, and 2 show reports from opening weekend.',
  },
]

function sampleUrl(slug: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base.replace(/\/$/, '')}/samples/${slug}.standby.json`
}

export function sampleShowUrl(sample: SampleShow): string {
  return sampleUrl(sample.slug)
}

/** Fetch the named sample show JSON and import it. Returns the new
 *  production id. */
export async function loadSampleShow(sample: SampleShow): Promise<number> {
  const response = await fetch(sampleUrl(sample.slug))
  if (!response.ok) {
    throw new Error(
      `Couldn't fetch the ${sample.label} sample (HTTP ${response.status}).`,
    )
  }
  const data = (await response.json()) as ShowExport
  return importShow(data)
}
