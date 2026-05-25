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
      // Deep-merge persisted state with current defaults. Zustand's default
      // is a shallow merge, which means adding a new field to AppSettings
      // (e.g. userName in v0.8) would leave older localStorage saves with
      // that field missing — undefined would leak into render and crash
      // anything that calls `.trim()` on it. This merge always backfills
      // every key from DEFAULT_SETTINGS, with persisted values taking
      // precedence where present.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>
        return {
          ...current,
          ...p,
          settings: {
            ...current.settings,
            ...(p.settings ?? {}),
          },
        }
      },
    },
  ),
)
