import { useEffect, useRef } from 'react'
import { getStoredBackupDirectory, writeBackup } from '@/lib/auto-backup'
import {
  useContactGroups,
  useContacts,
  useCurrentProduction,
  useLineNotes,
  useProps,
  useRehearsals,
} from '@/lib/hooks'
import { useAppStore } from '@/lib/store'

/**
 * Invisible component. Mounted once at the app root. Listens to all of the
 * current production's data via live-queries; when anything changes, it
 * debounces 10 seconds and writes the full show JSON to the user's picked
 * backup folder.
 *
 * Why 10s and not "every keystroke": during fast-entry of line notes the
 * user changes data many times per second. Debouncing collapses that into
 * a single write, which is what the user actually wants on disk anyway.
 *
 * Also writes on tab-hide (`visibilitychange`) so closing the laptop lid
 * mid-session still leaves a fresh backup on disk.
 */
export default function AutoBackupSync() {
  const productionId = useAppStore((s) => s.currentProductionId)
  const production = useCurrentProduction()
  const contacts = useContacts(productionId)
  const groups = useContactGroups(productionId)
  const rehearsals = useRehearsals(productionId)
  const lineNotes = useLineNotes(productionId)
  const props = useProps(productionId)

  const setLastBackupAt = useAppStore((s) => s.setLastBackupAt)
  const setBackupError = useAppStore((s) => s.setBackupError)
  const folderName = useAppStore((s) => s.backupFolderName)

  // The handle is cheap to keep in a ref since it survives reloads via Dexie
  // and we re-fetch on mount.
  const handleRef = useRef<FileSystemDirectoryHandle | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const h = await getStoredBackupDirectory()
      if (!cancelled) handleRef.current = h
    })()
    return () => {
      cancelled = true
    }
  }, [folderName])

  // Debounced write on change.
  useEffect(() => {
    const handle = handleRef.current
    if (!handle || productionId === null || !production) return
    const timer = window.setTimeout(async () => {
      try {
        const { bytes } = await writeBackup(handle, productionId)
        setLastBackupAt(new Date().toISOString())
        setBackupError(null)
        if (typeof console !== 'undefined') {
          console.debug(`Standby auto-backup: wrote ${bytes} bytes`)
        }
      } catch (err) {
        setBackupError(err instanceof Error ? err.message : String(err))
      }
    }, 10_000)
    return () => window.clearTimeout(timer)
  }, [
    productionId,
    production,
    contacts,
    groups,
    rehearsals,
    lineNotes,
    props,
    folderName,
    setLastBackupAt,
    setBackupError,
  ])

  // Flush on tab-hide.
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState !== 'hidden') return
      const handle = handleRef.current
      if (!handle || productionId === null) return
      // Don't await — visibilitychange handlers should be quick. Fire and forget.
      writeBackup(handle, productionId)
        .then(() => setLastBackupAt(new Date().toISOString()))
        .catch((err) =>
          setBackupError(err instanceof Error ? err.message : String(err)),
        )
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [productionId, setLastBackupAt, setBackupError])

  return null
}
