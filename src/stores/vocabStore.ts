import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { VocabList, Flashcard } from '@/types'
import { generateId } from '@/lib/utils'

interface VocabState {
  lists: VocabList[]

  // List operations
  createList: (name: string, tags?: string[]) => VocabList
  updateList: (id: string, updates: Partial<Omit<VocabList, 'id' | 'createdAt'>>) => void
  deleteList: (id: string) => void
  getList: (id: string) => VocabList | undefined

  // Flashcard operations
  addFlashcard: (listId: string, flashcard: Omit<Flashcard, 'id'>) => Flashcard | undefined
  addFlashcards: (listId: string, flashcards: Omit<Flashcard, 'id'>[]) => void
  updateFlashcard: (listId: string, flashcardId: string, updates: Partial<Omit<Flashcard, 'id'>>) => void
  deleteFlashcard: (listId: string, flashcardId: string) => void

  // Tag helpers
  getAllTags: () => string[]
  getListTags: () => string[]
  getFlashcardTags: () => string[]

  // Bulk operations
  importLists: (lists: VocabList[]) => void
  clearAll: () => void

  // Internal (for auth provider)
  _hydrate: (lists: VocabList[]) => void
}

export const useVocabStore = create<VocabState>()(
  persist(
    (set, get) => ({
      lists: [],

      createList: (name, tags = []) => {
        const newList: VocabList = {
          id: generateId(),
          name,
          createdAt: Date.now(),
          tags,
          flashcards: [],
        }
        set((state) => ({ lists: [...state.lists, newList] }))
        return newList
      },

      updateList: (id, updates) => {
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === id ? { ...list, ...updates } : list
          ),
        }))
      },

      deleteList: (id) => {
        set((state) => ({
          lists: state.lists.filter((list) => list.id !== id),
        }))
      },

      getList: (id) => {
        return get().lists.find((list) => list.id === id)
      },

      addFlashcard: (listId, flashcard) => {
        const newFlashcard: Flashcard = {
          ...flashcard,
          id: generateId(),
        }
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId
              ? { ...list, flashcards: [...list.flashcards, newFlashcard] }
              : list
          ),
        }))
        return newFlashcard
      },

      addFlashcards: (listId, flashcards) => {
        const newFlashcards: Flashcard[] = flashcards.map((fc) => ({
          ...fc,
          id: generateId(),
        }))
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId
              ? { ...list, flashcards: [...list.flashcards, ...newFlashcards] }
              : list
          ),
        }))
      },

      updateFlashcard: (listId, flashcardId, updates) => {
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  flashcards: list.flashcards.map((fc) =>
                    fc.id === flashcardId ? { ...fc, ...updates } : fc
                  ),
                }
              : list
          ),
        }))
      },

      deleteFlashcard: (listId, flashcardId) => {
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  flashcards: list.flashcards.filter((fc) => fc.id !== flashcardId),
                }
              : list
          ),
        }))
      },

      getAllTags: () => {
        const { lists } = get()
        const tags = new Set<string>()
        lists.forEach((list) => {
          list.tags.forEach((tag) => tags.add(tag))
          list.flashcards.forEach((fc) => {
            fc.tags.forEach((tag) => tags.add(tag))
          })
        })
        return Array.from(tags).sort()
      },

      getListTags: () => {
        const { lists } = get()
        const tags = new Set<string>()
        lists.forEach((list) => {
          list.tags.forEach((tag) => tags.add(tag))
        })
        return Array.from(tags).sort()
      },

      getFlashcardTags: () => {
        const { lists } = get()
        const tags = new Set<string>()
        lists.forEach((list) => {
          list.flashcards.forEach((fc) => {
            fc.tags.forEach((tag) => tags.add(tag))
          })
        })
        return Array.from(tags).sort()
      },

      importLists: (lists) => {
        set((state) => ({ lists: [...state.lists, ...lists] }))
      },

      clearAll: () => {
        set({ lists: [] })
      },

      _hydrate: (lists) => {
        set({ lists })
      },
    }),
    {
      name: 'flashcards-vocab',
    }
  )
)
