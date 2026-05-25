import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_SETTINGS, type AppSettings } from './settings'

interface AppState {
  currentProductionId: number | null
  setCurrentProductionId: (id: number | null) => void

  /** User-level UI preferences (theme, font size, paper size). */
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void
  resetSettings: () => void

  // Auto-backup status (transient — not persisted)
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
      settings: DEFAULT_SETTINGS,
      updateSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
      lastBackupAt: null,
      setLastBackupAt: (iso) => set({ lastBackupAt: iso }),
      backupError: null,
      setBackupError: (error) => set({ backupError: error }),
      backupFolderName: null,
      setBackupFolderName: (name) => set({ backupFolderName: name }),
    }),
    {
      name: 'standby:app-state',
      // Persist the durable bits only; backup status is transient.
      partialize: (state) => ({
        currentProductionId: state.currentProductionId,
        settings: state.settings,
      }),
    },
  ),
)
