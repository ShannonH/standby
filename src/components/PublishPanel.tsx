import { useEffect, useState } from 'react'
import { Button } from '@/components/Form'
import {
  clearPublishDirectory,
  getStoredPublishDirectory,
  isFileSystemAccessSupported,
  pickPublishDirectory,
  publishAll,
  type PublishSummary,
} from '@/lib/publish'

interface Props {
  productionId: number | null
  productionName?: string
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)} min ago`
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)} hr ago`
  return `${Math.round(diff / 86_400_000)} days ago`
}

/**
 * Per-production "Publish folder" setup.
 *
 * Picking a folder lets Standby write the public PDFs (rehearsal reports,
 * contact sheet, prop list, production info) there. The user shares the
 * folder via Google Drive / iCloud / Dropbox / etc.; crew always sees the
 * latest documents without anyone re-mailing them.
 *
 * Line notes are deliberately excluded — they're per-actor private.
 */
export default function PublishPanel({ productionId, productionName }: Props) {
  const supported = isFileSystemAccessSupported()
  const [folderName, setFolderName] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null)

  // Reload folder state whenever the current production changes.
  useEffect(() => {
    let cancelled = false
    setFolderName(null)
    setLastPublishedAt(null)
    setStatus(null)
    setError(null)
    if (productionId === null) return
    void (async () => {
      const handle = await getStoredPublishDirectory(productionId)
      if (!cancelled) setFolderName(handle?.name ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [productionId])

  async function connect() {
    if (productionId === null) return
    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      const handle = await pickPublishDirectory(productionId)
      if (!handle) return
      setFolderName(handle.name)
      // Do a first full publish right away so the folder is populated.
      const summary = await publishAll(productionId)
      setLastPublishedAt(new Date().toISOString())
      setStatus(describeSummary(summary, 'Initial publish complete.'))
      if (summary.errors.length > 0) {
        setError(summary.errors.join('; '))
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function disconnect() {
    if (productionId === null) return
    setBusy(true)
    try {
      await clearPublishDirectory(productionId)
      setFolderName(null)
      setLastPublishedAt(null)
      setError(null)
      setStatus(
        'Disconnected. The files we already wrote stay where they are — delete the folder if you want them gone.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function republishAll() {
    if (productionId === null) return
    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      const summary = await publishAll(productionId)
      setLastPublishedAt(new Date().toISOString())
      setStatus(describeSummary(summary, 'Republished from current state.'))
      if (summary.errors.length > 0) {
        setError(summary.errors.join('; '))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  if (productionId === null) {
    return null
  }

  return (
    <div className="space-y-4 rounded border border-surface-border bg-card p-4">
      <div>
        <h3 className="font-serif text-lg font-semibold">Publish to a shared folder</h3>
        <p className="text-xs text-muted">
          Optional. Pick a folder (Google Drive, iCloud Drive, Dropbox, anywhere)
          and Standby writes the PDFs you'd otherwise distribute manually:
          rehearsal reports, contact sheet, prop list, production info. Share
          the folder with crew via your cloud-storage app — they'll always see
          the latest.{' '}
          <strong>Line notes are excluded</strong> — they're per-actor private
          and stay in the distribute flow.
        </p>
      </div>

      {!supported ? (
        <p className="rounded border border-surface-border bg-card p-3 text-sm text-stone-600 dark:text-stone-400">
          The File System Access API isn't available on this browser (Safari
          and Firefox don't ship it yet). Use a Chromium-based browser to set
          this up.
        </p>
      ) : folderName ? (
        <div className="space-y-2 rounded border border-surface-border bg-card p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">
                Publishing{' '}
                {productionName ? <em>{productionName}</em> : 'this show'} to{' '}
                <code>{folderName}</code>
              </p>
              <p className="text-xs text-muted">
                Last published: {formatRelative(lastPublishedAt)}. Auto-writes
                happen when you save a rehearsal report, contact, prop, or
                production edit.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={republishAll} disabled={busy}>
                {busy ? 'Working…' : 'Republish all'}
              </Button>
              <Button variant="ghost" onClick={disconnect} disabled={busy}>
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-surface-border bg-card p-3">
          <div>
            <p className="text-sm font-medium">
              Publish folder:{' '}
              <span className="text-muted">Not set up</span>
            </p>
            <p className="text-xs text-muted">
              When you pick a folder, Standby does an initial publish of all
              the current PDFs.
            </p>
          </div>
          <Button onClick={connect} disabled={busy}>
            {busy ? 'Working…' : 'Pick a publish folder…'}
          </Button>
        </div>
      )}

      {status && (
        <p className="text-sm text-green-700 dark:text-green-400">{status}</p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">⚠ {error}</p>
      )}
    </div>
  )
}

function describeSummary(summary: PublishSummary, prefix: string): string {
  const parts: string[] = []
  if (summary.productionInfo) parts.push('production info')
  if (summary.contactSheet) parts.push('contact sheet')
  if (summary.propList) parts.push('prop list')
  if (summary.reports > 0)
    parts.push(`${summary.reports} rehearsal report${summary.reports === 1 ? '' : 's'}`)
  if (parts.length === 0) return prefix
  return `${prefix} Wrote ${parts.join(', ')}.`
}
