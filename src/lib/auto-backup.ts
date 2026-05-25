import { db } from './db'
import { exportShow } from './io'

/**
 * Auto-backup via the File System Access API (Chrome / Edge / other Chromium
 * browsers). The user picks a folder once — Documents, a Dropbox / iCloud /
 * Google Drive synced folder, anywhere they like — and Standby writes the
 * show JSON to that folder on every meaningful change.
 *
 * The picked FileSystemDirectoryHandle is itself stored in IndexedDB (it's
 * structured-clonable). On subsequent app loads we re-load it and ask the
 * browser to re-grant permission. If the user denies or the browser purges
 * the grant, auto-backup quietly turns itself off and they reconnect.
 *
 * Safari does not implement the File System Access API. Standby falls back
 * to manual JSON export there.
 */

const SETTING_KEY = 'autoBackup:directoryHandle'

export function isFileSystemAccessSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as { showDirectoryPicker?: unknown })
      .showDirectoryPicker === 'function'
  )
}

/** Prompt the user to pick a folder and persist the handle. */
export async function pickBackupDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) return null
  const picker = (
    window as unknown as {
      showDirectoryPicker: (opts: {
        id?: string
        mode?: 'read' | 'readwrite'
        startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'
      }) => Promise<FileSystemDirectoryHandle>
    }
  ).showDirectoryPicker
  const handle = await picker({
    id: 'standby-backup',
    mode: 'readwrite',
    startIn: 'documents',
  })
  await db.settings.put({ key: SETTING_KEY, value: handle })
  return handle
}

/** Load the previously picked handle and re-verify (or re-request) permission. */
export async function getStoredBackupDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) return null
  const entry = await db.settings.get(SETTING_KEY)
  if (!entry?.value) return null
  const handle = entry.value as FileSystemDirectoryHandle
  // queryPermission and requestPermission are part of the FSA spec but not
  // yet in lib.dom.d.ts in all TS versions. Cast through unknown for safety.
  const h = handle as unknown as {
    queryPermission: (opts: { mode: 'read' | 'readwrite' }) => Promise<'granted' | 'denied' | 'prompt'>
    requestPermission: (opts: { mode: 'read' | 'readwrite' }) => Promise<'granted' | 'denied' | 'prompt'>
  }
  try {
    const current = await h.queryPermission({ mode: 'readwrite' })
    if (current === 'granted') return handle
    // requestPermission usually requires a user gesture; if we're not in one,
    // it will fail or return 'prompt'. That's fine — we just report disconnected.
    const requested = await h.requestPermission({ mode: 'readwrite' })
    return requested === 'granted' ? handle : null
  } catch {
    return null
  }
}

/** Re-request permission from a user-gesture context (e.g. a button click). */
export async function reauthorizeBackupDirectory(
  handle: FileSystemDirectoryHandle,
): Promise<boolean> {
  const h = handle as unknown as {
    requestPermission: (opts: { mode: 'read' | 'readwrite' }) => Promise<'granted' | 'denied' | 'prompt'>
  }
  try {
    const result = await h.requestPermission({ mode: 'readwrite' })
    return result === 'granted'
  } catch {
    return false
  }
}

/** Forget the connected folder. The folder itself is left untouched. */
export async function clearBackupDirectory(): Promise<void> {
  await db.settings.delete(SETTING_KEY)
}

/** Write the full show JSON to the connected folder. Overwrites the prior
 *  copy. Returns the filename and byte count for status reporting. */
export async function writeBackup(
  handle: FileSystemDirectoryHandle,
  productionId: number,
): Promise<{ filename: string; bytes: number }> {
  const showExport = await exportShow(productionId)
  const safeName = showExport.production.name.replace(/[^a-z0-9]/gi, '_') || 'untitled'
  const filename = `${safeName}.standby.json`
  const fileHandle = await handle.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()
  const json = JSON.stringify(showExport, null, 2)
  await writable.write(json)
  await writable.close()
  return { filename, bytes: json.length }
}

/** Human-readable folder label for the UI. Browsers expose only `.name`,
 *  not the full path, for privacy reasons. */
export function describeHandle(
  handle: FileSystemDirectoryHandle | null,
): string {
  return handle?.name ?? '(no folder picked)'
}
