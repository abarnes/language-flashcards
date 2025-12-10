// Core data types for Language Flashcards application

export interface Flashcard {
  id: string
  source: string
  target: string
  gender?: string
  partOfSpeech?: string
  example?: string
  notes?: string
  tags: string[]
  // SRS fields (for future use)
  lastReviewed?: number
  interval?: number
  easeFactor?: number
}

export interface VocabList {
  id: string
  name: string
  createdAt: number
  tags: string[]
  flashcards: Flashcard[]
}

export interface Settings {
  apiKey: string
  sourceLang: string
  targetLang: string
  keepImages: boolean
}

export interface ImageHistoryItem {
  id: string
  imageData: string // base64
  extractedAt: number
  listId?: string
}

// Export data structures
export interface ExportData {
  version: string
  exportedAt: number
  settings: Settings
  lists: VocabList[]
}

export interface SingleListExport {
  version: string
  exportedAt: number
  list: VocabList
}

// Tag index for efficient filtering (optional helper)
export interface TagIndex {
  [tag: string]: {
    lists: string[]
    flashcards: string[]
  }
}

// Study session state
export interface StudySession {
  mode: 'normal' | 'reverse'
  sourceListId?: string
  tagFilters: string[]
  cards: Flashcard[]
  currentIndex: number
  knownCount: number
  unknownCount: number
  isFlipped: boolean
  isComplete: boolean
}

// Gemini extraction result
export interface ExtractedVocab {
  source: string
  target: string
  gender?: string
  partOfSpeech?: string
  example?: string
  notes?: string
}

// Common language codes
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'sv', name: 'Swedish' },
  { code: 'he', name: 'Hebrew' },
  { code: 'el', name: 'Greek' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']
