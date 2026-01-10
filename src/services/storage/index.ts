import type { VocabList, Settings, DailyStats } from '@/types'

export interface StorageProvider {
  // Vocab lists
  loadLists(): Promise<VocabList[]>
  saveList(list: VocabList): Promise<void>
  deleteList(id: string): Promise<void>
  saveLists(lists: VocabList[]): Promise<void>

  // Settings
  loadSettings(): Promise<Settings | null>
  saveSettings(settings: Settings): Promise<void>

  // Daily stats
  loadDailyStats(startDate: string, endDate: string): Promise<DailyStats[]>
  saveDailyStats(stats: DailyStats): Promise<void>

  // Utility
  clearAll(): Promise<void>
}

export type StorageType = 'localStorage' | 'firestore'
