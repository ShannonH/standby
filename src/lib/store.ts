import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  currentProductionId: number | null
  setCurrentProductionId: (id: number | null) => void

  // Auto-backup status (not persisted — recomputed on each app load)
  lastBackupAt: string | null
  setLastBackupAt: (iso: string | null) => void
  backupError: string | null
  setBackupError: (error: string | null) => void
  backupFolderName: string | null
  setBackupFolderName: (name: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentProductionId: null,
      setCurrentProductionId: (id) => set({ currentProductionId: id }),
      lastBackupAt: null,
      setLastBackupAt: (iso) => set({ lastBackupAt: iso }),
      backupError: null,
      setBackupError: (error) => set({ backupError: error }),
      backupFolderName: null,
      setBackupFolderName: (name) => set({ backupFolderName: name }),
    }),
    {
      name: 'standby:app-state',
      // Only persist currentProductionId. Backup status is transient — the
      // folder handle lives in Dexie, the timestamps regenerate on use.
      partialize: (state) => ({
        currentProductionId: state.currentProductionId,
      }),
    },
  ),
)
