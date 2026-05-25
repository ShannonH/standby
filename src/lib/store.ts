import { create } from 'zustand'

interface AppState {
  productionId: number | null
  setProductionId: (id: number | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  productionId: null,
  setProductionId: (id) => set({ productionId: id }),
}))
