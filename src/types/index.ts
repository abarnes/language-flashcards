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

// Common language codes (sorted alphabetically by name)
export const LANGUAGES = [
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Albanian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hy', name: 'Armenian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'zh', name: 'Chinese (Mandarin)' },
  { code: 'zh-yue', name: 'Chinese (Cantonese)' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' },
  { code: 'et', name: 'Estonian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'ka', name: 'Georgian' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ga', name: 'Irish' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'ko', name: 'Korean' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mt', name: 'Maltese' },
  { code: 'mr', name: 'Marathi' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'ne', name: 'Nepali' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fa', name: 'Persian (Farsi)' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pt-br', name: 'Portuguese (Brazilian)' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'es', name: 'Spanish' },
  { code: 'sw', name: 'Swahili' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tl', name: 'Tagalog (Filipino)' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'cy', name: 'Welsh' },
  { code: 'yi', name: 'Yiddish' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']
