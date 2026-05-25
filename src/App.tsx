import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import AutoBackupSync from '@/components/AutoBackupSync'
import { requestPersistentStorage } from '@/lib/persistent-storage'
import { useAppStore } from '@/lib/store'

type NavItem = { to: string; label: string; end?: boolean }

const nav: readonly NavItem[] = [
  { to: '/', label: 'Today', end: true },
  { to: '/production', label: 'Production' },
  { to: '/contacts', label: 'Contacts' },
  { to: '/rehearsals', label: 'Rehearsals' },
  { to: '/line-notes', label: 'Line notes' },
  { to: '/props', label: 'Props' },
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

/** A rotating SM call under the wordmark. One is picked per page load —
 *  the SM gets a different call each time they refresh, like flipping
 *  through a prompt corner card deck. Italics for the literal stage-call
 *  lines, plain for the descriptive ones. */
const TAGLINES: ReadonlyArray<{ text: string; italic?: boolean }> = [
  { text: 'Standing by.', italic: true },
  { text: 'From the prompt corner.' },
  { text: 'Calling the show.' },
  { text: 'Hold for places.', italic: true },
  { text: 'Quiet on book.', italic: true },
  { text: 'Half hour, please.', italic: true },
  { text: 'Top of show.', italic: true },
  { text: 'On book, off email.' },
  { text: 'Cue 1, GO.', italic: true },
  { text: 'Standby — and… GO.', italic: true },
  { text: 'No more rehearsal-report emails at midnight.' },
  { text: 'Notes for the company.' },
  { text: 'The prompt book lives here now.' },
  { text: 'Made for the booth.' },
]

function pickTagline(): { text: string; italic?: boolean } {
  return TAGLINES[Math.floor(Math.random() * TAGLINES.length)]!
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [tagline] = useState(pickTagline)
  const appTheme = useAppStore((s) => s.settings.theme)
  const fontSize = useAppStore((s) => s.settings.fontSize)

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

  return (
    <div className="flex h-full">
      <aside className="hidden w-56 shrink-0 border-r border-surface-border bg-card p-4 print:hidden sm:flex sm:flex-col">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            Standby
          </h1>
          <p
            className={`text-xs text-muted ${tagline.italic ? 'italic' : ''}`}
            title="Refresh for a different call."
          >
            {tagline.text}
          </p>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[rgb(var(--accent))] text-[rgb(var(--on-accent))]'
                    : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          className="mt-auto self-start text-xs text-muted hover:text-stone-900 dark:hover:text-stone-100"
        >
          {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 sm:p-10">
        <Outlet />
      </main>
      <AutoBackupSync />
    </div>
  )
}
