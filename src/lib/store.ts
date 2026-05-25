import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  currentProductionId: number | null
  setCurrentProductionId: (id: number | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentProductionId: null,
      setCurrentProductionId: (id) => set({ currentProductionId: id }),
    }),
    { name: 'standby:app-state' },
  ),
)
