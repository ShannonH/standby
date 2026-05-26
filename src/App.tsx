import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import AutoBackupSync from '@/components/AutoBackupSync'
import BackToTop from '@/components/BackToTop'
import { useCurrentProduction } from '@/lib/hooks'
import { requestPersistentStorage } from '@/lib/persistent-storage'
import { useAppStore } from '@/lib/store'

type NavItem = { to: string; label: string; end?: boolean }

const nav: readonly NavItem[] = [
  { to: '/', label: 'Today', end: true },
  { to: '/production', label: 'Production' },
  { to: '/contacts', label: 'Contacts' },
  { to: '/daily-call', label: 'Daily call' },
  { to: '/rehearsals', label: 'Rehearsals' },
  { to: '/show-reports', label: 'Show reports' },
  { to: '/line-notes', label: 'Line notes' },
  { to: '/props', label: 'Props' },
  { to: '/tracking', label: 'Tracking' },
  { to: '/blocking', label: 'Blocking' },
  { to: '/breaks', label: 'Breaks' },
  { to: '/backup', label: 'Backup' },
  { to: '/settings', label: 'Settings' },
]

type Theme = 'light' | 'dark'

function initialTheme(): Theme {
  const stored = localStorage.getItem('standby:theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/** A rotating SM call under the wordmark. One is picked per page load,
 *  so the SM sees a different call each refresh, like flipping through a
 *  deck of stage-management calls. Italics on the literal calls so they
 *  read like the SM is actually saying them; plain text on descriptive
 *  lines. */
const TAGLINES: ReadonlyArray<{ text: string; italic?: boolean }> = [
  { text: 'Standing by.', italic: true },
  { text: 'Places, please.', italic: true },
  { text: 'Hold for places.', italic: true },
  { text: 'Half hour, please.', italic: true },
  { text: 'Top of show.', italic: true },
  { text: 'Open the house.', italic: true },
  { text: 'Quiet on book.', italic: true },
  { text: 'Off headset.', italic: true },
  { text: 'Cue 1, GO.', italic: true },
  { text: 'Standby — and… GO.', italic: true },
  { text: 'Calling the show.' },
  { text: 'On book, off email.' },
  { text: 'No more rehearsal-report emails at midnight.' },
  { text: 'Notes for the company.' },
  { text: 'Made for the booth.' },
]

function pickTagline(): { text: string; italic?: boolean } {
  return TAGLINES[Math.floor(Math.random() * TAGLINES.length)]!
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [tagline] = useState(pickTagline)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const appTheme = useAppStore((s) => s.settings.theme)
  const fontSize = useAppStore((s) => s.settings.fontSize)
  const location = useLocation()
  const production = useCurrentProduction()

  // Refs for focus management when opening/closing the mobile drawer.
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const drawerCloseRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('standby:theme', theme)
  }, [theme])

  // Apply theme + font size as data-attributes on <html>. The CSS in
  // index.css uses these to swap accent CSS variables and base font-size.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appTheme)
    document.documentElement.setAttribute('data-font-size', fontSize)
  }, [appTheme, fontSize])

  // Ask the browser to mark our storage as persistent on first load.
  // Browsers grant silently if Standby is installed as a PWA or heavily
  // interacted with; otherwise they may prompt or decline. The user can
  // re-request from the Auto-backup panel on the Production page.
  useEffect(() => {
    void requestPersistentStorage()
  }, [])

  // Tab title reflects the current route and production so multiple tabs of
  // Standby (different shows, different sections) are distinguishable. The
  // Today route is implicit — no need to spell out "Today · …".
  //
  // Examples:
  //   On /                with My Way    → "My Way — Standby"
  //   On /rehearsals      with My Way    → "Rehearsals · My Way — Standby"
  //   On /settings        no production  → "Settings — Standby"
  //   On /                no production  → "Standby"
  useEffect(() => {
    const matched = nav.find((item) =>
      item.end
        ? location.pathname === item.to
        : location.pathname.startsWith(item.to),
    )
    const routeLabel = matched?.label
    const productionName = production?.name

    const parts: string[] = []
    if (routeLabel && routeLabel !== 'Today') parts.push(routeLabel)
    if (productionName) parts.push(productionName)

    document.title =
      parts.length === 0 ? 'Standby' : `${parts.join(' · ')} — Standby`
  }, [location.pathname, production?.name])

  // ─── Mobile drawer behavior ──────────────────────────────────────────
  // Close on route change (user tapped a link inside the drawer), close
  // on Escape, and trap-ish focus by sending it to the close button when
  // the drawer opens. We don't bother with a full focus trap library —
  // it's a short link list, and Tab eventually loops back via the
  // backdrop button anyway.

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileNavOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mobileNavOpen])

  useEffect(() => {
    if (mobileNavOpen) {
      drawerCloseRef.current?.focus()
    } else {
      // When closing, send focus back to the trigger so keyboard users
      // don't lose context.
      hamburgerRef.current?.focus()
    }
  }, [mobileNavOpen])

  // Prevent body scroll while the drawer is open — without this, the
  // page underneath scrolls when the user drags inside the drawer.
  useEffect(() => {
    if (!mobileNavOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileNavOpen])

  const navList = (
    <NavList
      tagline={tagline}
      theme={theme}
      onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
    />
  )

  return (
    <div className="flex h-full flex-col sm:flex-row">
      {/* Mobile top bar — hamburger + wordmark. Hidden ≥sm because the
          desktop sidebar is visible there. */}
      <header className="flex items-center justify-between border-b border-surface-border bg-card px-3 py-2 print:hidden sm:hidden">
        <button
          ref={hamburgerRef}
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileNavOpen}
          aria-controls="mobile-nav-drawer"
          className="rounded p-2 text-[rgb(var(--text-primary))] hover:bg-surface-border/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))]"
        >
          {/* Inline SVG hamburger — keeps line-height clean and avoids
              an icon dep for one glyph. */}
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="3" y1="6" x2="17" y2="6" />
            <line x1="3" y1="10" x2="17" y2="10" />
            <line x1="3" y1="14" x2="17" y2="14" />
          </svg>
        </button>
        <h1 className="font-display text-xl">
          <NavLink
            to="/"
            end
            className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))]"
          >
            Standby
          </NavLink>
        </h1>
        {/* Spacer so the wordmark visually centers — same width as the
            hamburger button (40px = p-2 around 20px icon). */}
        <span aria-hidden="true" className="w-10" />
      </header>

      {/* Desktop sidebar — visible at ≥sm. */}
      <aside className="hidden w-56 shrink-0 border-r border-surface-border bg-card p-4 print:hidden sm:flex sm:flex-col">
        <h1 className="mb-1 font-display text-2xl">
          <NavLink
            to="/"
            end
            className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))]"
          >
            Standby
          </NavLink>
        </h1>
        {navList}
      </aside>

      {/* Mobile drawer — overlay panel that slides in from the left on
          open. The backdrop is a sibling button so click-outside closes
          the drawer. Both backdrop and panel use one-shot mount-time
          animations defined in index.css; we don't animate close because
          the unmount path is fast enough that an exit animation just
          delays focus restoration. prefers-reduced-motion disables both. */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 sm:hidden" role="presentation">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileNavOpen(false)}
            className="animate-backdrop-fade-in absolute inset-0 bg-black/60"
          />
          <div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="animate-drawer-slide-in absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r border-surface-border bg-card p-4 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-end">
              <button
                ref={drawerCloseRef}
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation menu"
                className="rounded p-2 text-muted hover:bg-surface-border/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))]"
              >
                <svg
                  aria-hidden="true"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="5" y1="5" x2="15" y2="15" />
                  <line x1="15" y1="5" x2="5" y2="15" />
                </svg>
              </button>
            </div>
            {navList}
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-6 sm:p-10">
        <Outlet />
      </main>
      <BackToTop />
      <AutoBackupSync />
    </div>
  )
}

/** The actual nav list + theme toggle, rendered identically in the
 *  desktop sidebar and the mobile drawer. Extracted so both surfaces
 *  stay in sync — adding a route updates both at once. */
function NavList({
  tagline,
  theme,
  onToggleTheme,
}: {
  tagline: { text: string; italic?: boolean }
  theme: Theme
  onToggleTheme: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6">
        <p
          className={`text-xs text-muted ${tagline.italic ? 'italic' : ''}`}
          title="Refresh for a different call."
        >
          {tagline.text}
        </p>
      </div>
      <nav aria-label="Main" className="flex flex-col gap-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `rounded px-3 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))] ${
                isActive
                  ? 'bg-[rgb(var(--accent))] text-[rgb(var(--on-accent))]'
                  : 'text-muted hover:bg-surface-border/20'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <button
        type="button"
        onClick={onToggleTheme}
        className="mt-auto self-start rounded text-xs text-muted hover:text-[rgb(var(--text-primary))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))]"
      >
        {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      </button>
    </div>
  )
}
