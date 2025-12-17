import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings } from '@/types'

interface SettingsState {
  settings: Settings
  updateSettings: (settings: Partial<Settings>) => void
  resetSettings: () => void
  // Internal (for auth provider)
  _hydrate: (settings: Settings) => void
}

const defaultSettings: Settings = {
  apiKey: '',
  sourceLang: 'en',
  targetLang: 'es',
  keepImages: false,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      resetSettings: () => set({ settings: defaultSettings }),
      _hydrate: (settings) => set({ settings }),
    }),
    {
      name: 'flashcards-settings',
    }
  )
)
