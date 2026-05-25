import { useEffect, useState } from 'react'
import { Button } from '@/components/Form'
import {
  clearBackupDirectory,
  getStoredBackupDirectory,
  isFileSystemAccessSupported,
  pickBackupDirectory,
  writeBackup,
} from '@/lib/auto-backup'
import {
  getStorageStatus,
  requestPersistentStorage,
  type StorageStatus,
} from '@/lib/persistent-storage'
import { useAppStore } from '@/lib/store'

interface Props {
  productionId: number | null
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'never'
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)} min ago`
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)} hr ago`
  return `${Math.round(diff / 86_400_000)} days ago`
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AutoBackupPanel({ productionId }: Props) {
  const lastBackupAt = useAppStore((s) => s.lastBackupAt)
  const setLastBackupAt = useAppStore((s) => s.setLastBackupAt)
  const backupError = useAppStore((s) => s.backupError)
  const setBackupError = useAppStore((s) => s.setBackupError)
  const folderName = useAppStore((s) => s.backupFolderName)
  const setFolderName = useAppStore((s) => s.setBackupFolderName)
  const [status, setStatus] = useState<StorageStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const supported = isFileSystemAccessSupported()

  // Refresh storage status on mount and after grant/clear actions.
  async function refreshStorageStatus() {
    setStatus(await getStorageStatus())
  }
  useEffect(() => {
    void refreshStorageStatus()
  }, [])

  // Pick up an existing folder grant on load.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const handle = await getStoredBackupDirectory()
      if (!cancelled) setFolderName(handle?.name ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [setFolderName])

  async function connect() {
    setBackupError(null)
    setBusy(true)
    try {
      const handle = await pickBackupDirectory()
      if (handle) {
        setFolderName(handle.name)
        // Kick a first write right away so the user sees confirmation that
        // the folder is working.
        if (productionId !== null) {
          await writeBackup(handle, productionId)
          setLastBackupAt(new Date().toISOString())
        }
      }
    } catch (err) {
      // User cancelling the folder picker is not really an error.
      if (err instanceof Error && err.name !== 'AbortError') {
        setBackupError(err.message)
      }
    } finally {
      setBusy(false)
    }
  }

  async function disconnect() {
    setBusy(true)
    try {
      await clearBackupDirectory()
      setFolderName(null)
      setLastBackupAt(null)
      setBackupError(null)
    } finally {
      setBusy(false)
    }
  }

  async function saveNow() {
    if (productionId === null) {
      setBackupError('No production selected.')
      return
    }
    setBusy(true)
    try {
      const handle = await getStoredBackupDirectory()
      if (!handle) {
        setBackupError(
          'Lost permission to the backup folder. Reconnect to fix.',
        )
        setFolderName(null)
        return
      }
      const { bytes } = await writeBackup(handle, productionId)
      setLastBackupAt(new Date().toISOString())
      setBackupError(null)
      void refreshStorageStatus()
      console.log(`Standby: manual backup wrote ${formatBytes(bytes)}`)
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function makePersistent() {
    const granted = await requestPersistentStorage()
    if (!granted) {
      setBackupError(
        "Browser declined persistent storage. Try installing Standby as a PWA, or bookmark the site — Chrome auto-grants persistence then.",
      )
    } else {
      setBackupError(null)
    }
    void refreshStorageStatus()
  }

  return (
    <div className="space-y-4 rounded border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-900/50">
      <div>
        <h3 className="font-serif text-lg font-semibold">
          Auto-backup &amp; storage durability
        </h3>
        <p className="text-xs text-stone-500">
          Two protections so a cleared browser cache doesn't lose your show:
          mark Standby's local storage as persistent, and write a copy of
          the show JSON to a folder you pick. A folder synced to iCloud /
          Dropbox / Google Drive gets you off-device backup for free.
        </p>
      </div>

      {/* Persistent storage row */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-900">
        <div>
          <p className="text-sm font-medium">
            Browser storage:{' '}
            {status?.persistent === true ? (
              <span className="text-green-700 dark:text-green-400">
                Persistent ✓
              </span>
            ) : (
              <span className="text-amber-700 dark:text-amber-400">
                Not persistent
              </span>
            )}
          </p>
          <p className="text-xs text-stone-500">
            {status?.persistent === true
              ? 'Your data is protected from automatic browser eviction.'
              : 'Browser may evict data under storage pressure. Install as a PWA or bookmark the site for auto-grant in Chrome.'}
            {status &&
              status.usageBytes !== null &&
              status.quotaBytes !== null && (
                <>
                  {' · '}
                  {formatBytes(status.usageBytes)} used of{' '}
                  {formatBytes(status.quotaBytes)}
                </>
              )}
          </p>
        </div>
        {!status?.persistent && (
          <Button variant="secondary" onClick={makePersistent}>
            Request persistent
          </Button>
        )}
      </div>

      {/* Folder backup row */}
      <div className="space-y-2 rounded border border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-900">
        {!supported ? (
          <div>
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Folder auto-backup: not supported on this browser
            </p>
            <p className="text-xs text-stone-500">
              The File System Access API isn't available here (Safari and
              Firefox don't ship it). Use{' '}
              <em>Export current show as JSON</em> below for manual backups.
            </p>
          </div>
        ) : folderName ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  Folder auto-backup:{' '}
                  <span className="text-green-700 dark:text-green-400">
                    ON
                  </span>
                </p>
                <p className="text-xs text-stone-500">
                  Saving to <code>{folderName}</code> · Last saved{' '}
                  {formatRelative(lastBackupAt)}
                  {productionId === null && ' · (pick a production to enable writes)'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={saveNow}
                  disabled={busy || productionId === null}
                >
                  Save now
                </Button>
                <Button variant="ghost" onClick={disconnect} disabled={busy}>
                  Disconnect
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">
                Folder auto-backup:{' '}
                <span className="text-stone-500">Off</span>
              </p>
              <p className="text-xs text-stone-500">
                Pick a folder (your Dropbox, iCloud Drive, anywhere you like)
                and Standby writes the show JSON there on every change.
              </p>
            </div>
            <Button onClick={connect} disabled={busy}>
              Pick a folder…
            </Button>
          </div>
        )}
      </div>

      {backupError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          ⚠ {backupError}
        </p>
      )}
    </div>
  )
}
