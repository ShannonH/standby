// Anonymous, privacy-respecting pageview counting via GoatCounter.
//
// IMPORTANT — this is the ONE place Standby talks to the network, and it
// only does so under tightly fenced conditions:
//
//   • Only when a GoatCounter site code was baked in at BUILD time
//     (VITE_GOATCOUNTER_CODE). The public GitHub Pages deploy sets it;
//     the Docker / self-host build and local dev never do. So a
//     university running their own copy phones home to no one.
//   • Only when the visitor hasn't enabled Do Not Track.
//   • Never on localhost (keeps dev/preview out of the numbers).
//
// What GoatCounter receives: the path that was viewed (e.g. "/rehearsals"),
// nothing else. No cookies, no fingerprint, no personal data, no show
// data. A stage manager's contacts, reports, notes — none of it is ever
// transmitted; that data lives only in their browser's IndexedDB. This
// counts "a page was viewed," full stop.
//
// See https://www.goatcounter.com/ — open-source, GDPR-clean, no consent
// banner required because it stores nothing identifying.

declare global {
  interface Window {
    goatcounter?: {
      no_onload?: boolean
      count?: (vars?: {
        path?: string
        title?: string
        referrer?: string
        event?: boolean
      }) => void
    }
  }
}

const CODE = import.meta.env.VITE_GOATCOUNTER_CODE

function analyticsEnabled(): boolean {
  if (!CODE) return false
  const nav = navigator as Navigator & { msDoNotTrack?: string }
  const win = window as Window & { doNotTrack?: string }
  if (
    nav.doNotTrack === '1' ||
    win.doNotTrack === '1' ||
    nav.msDoNotTrack === '1'
  ) {
    return false
  }
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1' || host === '') {
    return false
  }
  return true
}

let injected = false
/** If a pageview is requested before count.js has finished loading we
 *  stash the most recent path here and flush it once the script's ready,
 *  so the very first load still gets counted. */
let pendingPath: string | null = null

/** Inject GoatCounter's count.js once, in no-auto-count mode so route
 *  changes are driven explicitly by countPageview(). No-op when analytics
 *  are disabled (see analyticsEnabled above). */
export function initAnalytics(): void {
  if (injected || !analyticsEnabled()) return
  injected = true
  window.goatcounter = { no_onload: true }
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://gc.zgo.at/count.js'
  s.setAttribute('data-goatcounter', `https://${CODE}.goatcounter.com/count`)
  s.addEventListener('load', () => {
    if (pendingPath !== null) {
      window.goatcounter?.count?.({ path: pendingPath })
      pendingPath = null
    }
  })
  document.head.appendChild(s)
}

/** Record one pageview for `path` (React Router pathname, basename
 *  already stripped — e.g. "/rehearsals"). Safe to call before the
 *  script loads (queues) and when analytics are disabled (no-ops). */
export function countPageview(path: string): void {
  if (!analyticsEnabled()) return
  if (window.goatcounter?.count) {
    window.goatcounter.count({ path })
  } else {
    pendingPath = path
  }
}
