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
  SAMPLE_SHOW_DESCRIPTION,
  SAMPLE_SHOW_LABEL,
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
  const [busy, setBusy] = useState(false)

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

  async function handleLoadSample() {
    setError(null)
    setStatus(null)
    setBusy(true)
    try {
      const newId = await loadSampleShow()
      setCurrentProductionId(newId)
      setStatus(
        `Loaded the ${SAMPLE_SHOW_LABEL} sample as a new production and switched to it.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 rounded border border-surface-border bg-card p-4">
      <div className="space-y-3">
        <h3 className="font-serif text-lg font-semibold">Backup &amp; restore</h3>
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
        <h3 className="font-serif text-lg font-semibold">Try a sample show</h3>
        <p className="text-sm text-muted">{SAMPLE_SHOW_DESCRIPTION}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleLoadSample} disabled={busy}>
            {busy ? 'Loading…' : `Load ${SAMPLE_SHOW_LABEL}`}
          </Button>
          <a
            href={sampleShowUrl()}
            download="midsummer.standby.json"
            className="text-sm text-muted underline hover:text-accent"
          >
            …or download the JSON to inspect it
          </a>
        </div>
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
