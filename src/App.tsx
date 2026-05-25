import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import AutoBackupSync from '@/components/AutoBackupSync'
import { requestPersistentStorage } from '@/lib/persistent-storage'

type NavItem = { to: string; label: string; end?: boolean }

const nav: readonly NavItem[] = [
  { to: '/', label: 'Today', end: true },
  { to: '/production', label: 'Production' },
  { to: '/contacts', label: 'Contacts' },
  { to: '/rehearsals', label: 'Rehearsals' },
  { to: '/line-notes', label: 'Line notes' },
  { to: '/props', label: 'Props' },
]

type Theme = 'light' | 'dark'

function initialTheme(): Theme {
  const stored = localStorage.getItem('standby:theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('standby:theme', theme)
  }, [theme])

  // Ask the browser to mark our storage as persistent on first load.
  // Browsers grant silently if Standby is installed as a PWA or heavily
  // interacted with; otherwise they may prompt or decline. The user can
  // re-request from the Auto-backup panel on the Production page.
  useEffect(() => {
    void requestPersistentStorage()
  }, [])

  return (
    <div className="flex h-full">
      <aside className="hidden w-56 shrink-0 border-r border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 print:hidden sm:flex sm:flex-col">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            Standby
          </h1>
          <p className="text-xs text-stone-500">SM paperwork, local-first</p>
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
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
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
          className="mt-auto self-start text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
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
