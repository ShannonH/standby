import { useRef, useState } from 'react'
import { Button } from '@/components/Form'
import {
  downloadShowAsFile,
  exportShow,
  importShow,
  readShowFromFile,
} from '@/lib/io'
import { useAppStore } from '@/lib/store'

interface Props {
  productionId: number | null
}

export default function ImportExport({ productionId }: Props) {
  const setCurrentProductionId = useAppStore((s) => s.setCurrentProductionId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="space-y-3 rounded border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-900/50">
      <h3 className="font-serif text-lg font-semibold">Backup &amp; restore</h3>
      <p className="text-sm text-stone-600 dark:text-stone-400">
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
      {status && (
        <p className="text-sm text-green-700 dark:text-green-400">{status}</p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">⚠ {error}</p>
      )}
    </div>
  )
}
