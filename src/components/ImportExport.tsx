import { useRef, useState } from 'react'
import { Button } from '@/components/Form'
import {
  downloadShowAsFile,
  exportShow,
  importShow,
  readShowFromFile,
} from '@/lib/io'
import {
  loadSampleShow,
  sampleShowUrl,
  SAMPLE_SHOWS,
  type SampleShow,
} from '@/lib/sample-show'
import { useAppStore } from '@/lib/store'

interface Props {
  productionId: number | null
}

export default function ImportExport({ productionId }: Props) {
  const setCurrentProductionId = useAppStore((s) => s.setCurrentProductionId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  /** Slug of the sample currently being loaded, or null. Used so only the
   *  clicked button shows a spinner — not every sample button at once. */
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)

  async function handleExport() {
    if (productionId === null) return
    setError(null)
    setStatus(null)
    try {
      const showExport = await exportShow(productionId)
      downloadShowAsFile(showExport)
      setStatus(`Exported "${showExport.production.name}" successfully.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleImport(file: File) {
    setError(null)
    setStatus(null)
    try {
      const parsed = await readShowFromFile(file)
      const newId = await importShow(parsed)
      setCurrentProductionId(newId)
      setStatus(`Imported "${parsed.production.name}" and switched to it.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleLoadSample(sample: SampleShow) {
    setError(null)
    setStatus(null)
    setLoadingSlug(sample.slug)
    try {
      const newId = await loadSampleShow(sample)
      setCurrentProductionId(newId)
      // Sample labels already include the leading article ("A Midsummer
      // Night's Dream", "The Pirates of Penzance"), so we drop "the"
      // here to avoid "Loaded the The Pirates of Penzance".
      setStatus(
        `Loaded ${sample.label} as a new production and switched to it.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoadingSlug(null)
    }
  }

  return (
    <div className="space-y-6 rounded border border-surface-border bg-card p-4">
      <div className="space-y-3">
        <h3 className="font-display text-lg">Backup &amp; restore</h3>
        <p className="text-sm text-muted">
          Your show lives in your browser's IndexedDB. Export to a{' '}
          <code>.standby.json</code> file to back it up or move it to another
          device. Import to load a saved show as a new entry.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExport} disabled={productionId === null}>
            Export current show as JSON
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Import show from JSON…
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleImport(file)
            }}
          />
        </div>
      </div>

      <div className="space-y-3 border-t border-surface-border pt-4">
        <h3 className="font-display text-lg">Try a sample show</h3>
        <p className="text-sm text-muted">
          Each sample imports as a brand-new production alongside whatever
          you already have. Useful for kicking the tires, training a new SM,
          or seeing what a fully-populated production looks like before
          starting your own.
        </p>
        <ul className="space-y-3">
          {SAMPLE_SHOWS.map((sample) => {
            const busy = loadingSlug === sample.slug
            const disabled = loadingSlug !== null && !busy
            return (
              <li
                key={sample.slug}
                className="space-y-2 rounded border border-surface-border bg-surface-bg p-3"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <h4 className="font-display text-base">{sample.label}</h4>
                  <span className="rounded bg-surface-border/40 px-2 py-0.5 text-xs uppercase tracking-wide text-muted">
                    {sample.tag}
                  </span>
                </div>
                <p className="text-sm text-muted">{sample.description}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => void handleLoadSample(sample)}
                    disabled={disabled || busy}
                  >
                    {busy ? 'Loading…' : `Load ${sample.label}`}
                  </Button>
                  <a
                    href={sampleShowUrl(sample)}
                    download={`${sample.slug}.standby.json`}
                    className="text-sm text-muted underline hover:text-accent"
                  >
                    …or download the JSON to inspect it
                  </a>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {status && (
        <p className="text-sm text-green-700 dark:text-green-400">{status}</p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">⚠ {error}</p>
      )}
    </div>
  )
}
