import type { StorageProvider } from './index'
import type { VocabList, Settings } from '@/types'

const VOCAB_KEY = 'flashcards-vocab'
const SETTINGS_KEY = 'flashcards-settings'

export function createLocalStorageProvider(): StorageProvider {
  return {
    async loadLists(): Promise<VocabList[]> {
      const data = localStorage.getItem(VOCAB_KEY)
      if (!data) return []
      try {
        const parsed = JSON.parse(data)
        return parsed.state?.lists ?? []
      } catch {
        return []
      }
    },

    async saveList(list: VocabList): Promise<void> {
      const lists = await this.loadLists()
      const index = lists.findIndex((l) => l.id === list.id)
      if (index >= 0) {
        lists[index] = list
      } else {
        lists.push(list)
      }
      await this.saveLists(lists)
    },

    async deleteList(id: string): Promise<void> {
      const lists = await this.loadLists()
      const filtered = lists.filter((l) => l.id !== id)
      await this.saveLists(filtered)
    },

    async saveLists(lists: VocabList[]): Promise<void> {
      localStorage.setItem(VOCAB_KEY, JSON.stringify({ state: { lists }, version: 0 }))
    },

    async loadSettings(): Promise<Settings | null> {
      const data = localStorage.getItem(SETTINGS_KEY)
      if (!data) return null
      try {
        const parsed = JSON.parse(data)
        return parsed.state?.settings ?? null
      } catch {
        return null
      }
    },

    async saveSettings(settings: Settings): Promise<void> {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ state: { settings }, version: 0 }))
    },

    async clearAll(): Promise<void> {
      localStorage.removeItem(VOCAB_KEY)
      localStorage.removeItem(SETTINGS_KEY)
    },
  }
}
