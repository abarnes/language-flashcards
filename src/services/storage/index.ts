import type { VocabList, Settings } from '@/types'

export interface StorageProvider {
  // Vocab lists
  loadLists(): Promise<VocabList[]>
  saveList(list: VocabList): Promise<void>
  deleteList(id: string): Promise<void>
  saveLists(lists: VocabList[]): Promise<void>

  // Settings
  loadSettings(): Promise<Settings | null>
  saveSettings(settings: Settings): Promise<void>

  // Utility
  clearAll(): Promise<void>
}

export type StorageType = 'localStorage' | 'firestore'
