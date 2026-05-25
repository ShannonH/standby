import { Button } from '@/components/Form'
import { useAppStore } from '@/lib/store'
import {
  FONT_SIZE_DESCRIPTIONS,
  FONT_SIZE_LABELS,
  PAPER_SIZE_LABELS,
  THEMES,
  THEME_ORDER,
  type FontSize,
  type PaperSize,
  type Theme,
} from '@/lib/settings'

const FONT_SIZES: FontSize[] = ['sm', 'md', 'lg', 'xl']
const PAPER_SIZES: PaperSize[] = ['LETTER', 'A4']

export default function Settings() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const resetSettings = useAppStore((s) => s.resetSettings)

  return (
    <section className="mx-auto max-w-3xl space-y-10">
      <header>
        <h2 className="font-serif text-3xl font-semibold">Settings</h2>
        <p className="mt-1 text-sm text-stone-500">
          Personal preferences. Stored in your browser; never leave this device.
        </p>
      </header>

      {/* Theme */}
      <section className="space-y-3">
        <div>
          <h3 className="font-serif text-xl font-semibold">Theme</h3>
          <p className="text-sm text-stone-500">
            Accent color used for buttons, the active nav item, and focus
            rings. Light / dark mode toggle is in the left nav as always.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {THEME_ORDER.map((theme) => (
            <ThemeCard
              key={theme}
              theme={theme}
              selected={settings.theme === theme}
              onSelect={() => updateSettings({ theme })}
            />
          ))}
        </div>
      </section>

      {/* Font size */}
      <section className="space-y-3">
        <div>
          <h3 className="font-serif text-xl font-semibold">Font size</h3>
          <p className="text-sm text-stone-500">
            Scales the entire UI. Bump it up if you're reading from across a
            booth, or down if you want to fit more on a laptop screen.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => updateSettings({ fontSize: size })}
              className={`flex flex-col items-start gap-1 rounded border p-3 text-left transition ${
                settings.fontSize === size
                  ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent))/0.06] ring-1 ring-[rgb(var(--accent))]'
                  : 'border-stone-300 hover:border-stone-500 dark:border-stone-700 dark:hover:border-stone-500'
              }`}
            >
              <span className="font-medium">{FONT_SIZE_LABELS[size]}</span>
              <span className="text-xs text-stone-500">
                {FONT_SIZE_DESCRIPTIONS[size]}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* PDF paper size */}
      <section className="space-y-3">
        <div>
          <h3 className="font-serif text-xl font-semibold">PDF paper size</h3>
          <p className="text-sm text-stone-500">
            Applied to every PDF Standby generates — rehearsal reports,
            contact sheet, prop list, production info, line notes.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {PAPER_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => updateSettings({ paperSize: size })}
              className={`rounded border p-3 text-left transition ${
                settings.paperSize === size
                  ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent))/0.06] ring-1 ring-[rgb(var(--accent))]'
                  : 'border-stone-300 hover:border-stone-500 dark:border-stone-700 dark:hover:border-stone-500'
              }`}
            >
              <span className="font-medium">{PAPER_SIZE_LABELS[size]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="border-t border-stone-200 pt-6 dark:border-stone-800">
        <Button variant="ghost" onClick={resetSettings}>
          Reset all to default
        </Button>
      </section>
    </section>
  )
}

interface ThemeCardProps {
  theme: Theme
  selected: boolean
  onSelect: () => void
}

function ThemeCard({ theme, selected, onSelect }: ThemeCardProps) {
  const meta = THEMES[theme]
  return (
    <button
      type="button"
      onClick={onSelect}
      data-theme={theme}
      className={`group flex flex-col items-stretch gap-3 rounded border p-3 text-left transition ${
        selected
          ? 'border-[rgb(var(--accent))] ring-1 ring-[rgb(var(--accent))]'
          : 'border-stone-300 hover:border-stone-500 dark:border-stone-700 dark:hover:border-stone-500'
      }`}
    >
      {/* Swatch row — uses the theme's actual accent color */}
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-10 w-10 rounded shadow-inner ring-1 ring-stone-300 dark:ring-stone-700"
          style={{ backgroundColor: meta.swatch }}
        />
        <span
          aria-hidden
          className="inline-block rounded bg-[rgb(var(--accent))] px-3 py-1 text-xs font-semibold text-[rgb(var(--on-accent))]"
        >
          Button
        </span>
      </div>
      <div>
        <p className="font-serif text-lg font-semibold">{meta.label}</p>
        <p className="text-xs italic text-stone-500">"{meta.tagline}"</p>
        <p className="mt-1 text-xs text-stone-500">{meta.description}</p>
      </div>
      {selected && (
        <span className="text-xs font-medium text-[rgb(var(--accent))]">
          ✓ Selected
        </span>
      )}
    </button>
  )
}
