import type { StorageProvider } from './index'
import type { VocabList, Settings, DailyStats } from '@/types'

const VOCAB_KEY = 'flashcards-vocab'
const SETTINGS_KEY = 'flashcards-settings'
const DAILY_STATS_KEY = 'flashcards-daily-stats'

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

    async loadDailyStats(startDate: string, endDate: string): Promise<DailyStats[]> {
      const data = localStorage.getItem(DAILY_STATS_KEY)
      if (!data) return []
      try {
        const allStats: Record<string, DailyStats> = JSON.parse(data)
        return Object.values(allStats).filter(
          (s) => s.date >= startDate && s.date <= endDate
        )
      } catch {
        return []
      }
    },

    async saveDailyStats(stats: DailyStats): Promise<void> {
      const data = localStorage.getItem(DAILY_STATS_KEY)
      const allStats: Record<string, DailyStats> = data ? JSON.parse(data) : {}
      allStats[stats.date] = stats
      localStorage.setItem(DAILY_STATS_KEY, JSON.stringify(allStats))
    },

    async clearAll(): Promise<void> {
      localStorage.removeItem(VOCAB_KEY)
      localStorage.removeItem(SETTINGS_KEY)
      localStorage.removeItem(DAILY_STATS_KEY)
    },
  }
}
