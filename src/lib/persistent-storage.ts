// Wrappers around the StorageManager API. Persistent storage is what
// prevents the browser from silently evicting Standby's IndexedDB when disk
// pressure is high or the user clears site data via the storage settings.
//
// Chrome auto-grants persistent storage to installed PWAs and to sites the
// user has bookmarked or interacted with heavily. Firefox prompts. Safari
// supports the API but doesn't auto-grant.

export interface StorageStatus {
  supported: boolean
  persistent: boolean
  usageBytes: number | null
  quotaBytes: number | null
}

/** Ask the browser to mark Standby's storage as persistent (no eviction). */
export async function requestPersistentStorage(): Promise<boolean> {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.storage?.persist !== 'function'
  ) {
    return false
  }
  try {
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

/** Is Standby's storage currently marked persistent? */
export async function isStoragePersistent(): Promise<boolean> {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.storage?.persisted !== 'function'
  ) {
    return false
  }
  try {
    return await navigator.storage.persisted()
  } catch {
    return false
  }
}

/** Read current usage + quota in bytes. Returns null if unsupported. */
export async function getStorageStatus(): Promise<StorageStatus> {
  const supported =
    typeof navigator !== 'undefined' &&
    typeof navigator.storage?.estimate === 'function'
  const persistent = await isStoragePersistent()
  if (!supported) {
    return { supported: false, persistent, usageBytes: null, quotaBytes: null }
  }
  try {
    const est = await navigator.storage.estimate()
    return {
      supported: true,
      persistent,
      usageBytes: est.usage ?? null,
      quotaBytes: est.quota ?? null,
    }
  } catch {
    return { supported: true, persistent, usageBytes: null, quotaBytes: null }
  }
}
