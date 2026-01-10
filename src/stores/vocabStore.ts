import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { VocabList, Flashcard, SRSGrade, StudyDirection } from '@/types'
import { generateId } from '@/lib/utils'
import { calculateNextReview, getSRSData } from '@/services/srs'
import { useStatsStore } from './statsStore'

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
  setFlashcardKnown: (flashcardId: string, known: boolean) => void
  reviewFlashcard: (flashcardId: string, grade: SRSGrade, direction: StudyDirection) => void
  resetFlashcardSRS: (flashcardId: string, direction?: StudyDirection) => void

  // Tag helpers
  getAllTags: () => string[]
  getListTags: () => string[]
  getFlashcardTags: () => string[]

  // Lookup helpers
  findListIdByFlashcard: (flashcardId: string) => string | null

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
        const now = Date.now()
        const newList: VocabList = {
          id: generateId(),
          name,
          createdAt: now,
          lastModified: now,
          tags,
          flashcards: [],
        }
        set((state) => ({ lists: [...state.lists, newList] }))
        return newList
      },

      updateList: (id, updates) => {
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === id ? { ...list, ...updates, lastModified: Date.now() } : list
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
              ? { ...list, flashcards: [...list.flashcards, newFlashcard], lastModified: Date.now() }
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
              ? { ...list, flashcards: [...list.flashcards, ...newFlashcards], lastModified: Date.now() }
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
                  lastModified: Date.now(),
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
                  lastModified: Date.now(),
                  flashcards: list.flashcards.filter((fc) => fc.id !== flashcardId),
                }
              : list
          ),
        }))
      },

      setFlashcardKnown: (flashcardId, known) => {
        set((state) => ({
          lists: state.lists.map((list) => {
            const hasCard = list.flashcards.some((fc) => fc.id === flashcardId)
            if (!hasCard) return list
            return {
              ...list,
              lastModified: Date.now(),
              flashcards: list.flashcards.map((fc) =>
                fc.id === flashcardId ? { ...fc, known } : fc
              ),
            }
          }),
        }))
      },

      reviewFlashcard: (flashcardId, grade, direction) => {
        // Find the list containing this flashcard before updating
        const listId = get().findListIdByFlashcard(flashcardId)

        set((state) => ({
          lists: state.lists.map((list) => {
            const hasCard = list.flashcards.some((fc) => fc.id === flashcardId)
            if (!hasCard) return list
            return {
              ...list,
              lastModified: Date.now(),
              flashcards: list.flashcards.map((fc) => {
                if (fc.id !== flashcardId) return fc
                const currentSRSData = getSRSData(fc, direction)
                const result = calculateNextReview(currentSRSData, grade)
                const newSRSData = {
                  lastReviewed: Date.now(),
                  interval: result.interval,
                  easeFactor: result.easeFactor,
                  repetitions: result.repetitions,
                  dueDate: result.dueDate,
                }
                return {
                  ...fc,
                  // Update the appropriate direction's SRS data
                  ...(direction === 'normal'
                    ? { srsNormal: newSRSData }
                    : { srsReverse: newSRSData }),
                  // Also update legacy 'known' field for backward compatibility
                  known: grade !== 'again',
                }
              }),
            }
          }),
        }))

        // Record review in stats store (good/easy = correct, again/hard = incorrect)
        if (listId) {
          const isCorrect = grade === 'good' || grade === 'easy'
          useStatsStore.getState().recordReview(listId, isCorrect)
        }
      },

      resetFlashcardSRS: (flashcardId, direction) => {
        set((state) => ({
          lists: state.lists.map((list) => {
            const hasCard = list.flashcards.some((fc) => fc.id === flashcardId)
            if (!hasCard) return list
            return {
              ...list,
              lastModified: Date.now(),
              flashcards: list.flashcards.map((fc) => {
                if (fc.id !== flashcardId) return fc
                // If direction specified, only reset that direction
                if (direction) {
                  return {
                    ...fc,
                    ...(direction === 'normal'
                      ? { srsNormal: undefined }
                      : { srsReverse: undefined }),
                  }
                }
                // If no direction, reset both
                return {
                  ...fc,
                  srsNormal: undefined,
                  srsReverse: undefined,
                  known: undefined,
                }
              }),
            }
          }),
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

      findListIdByFlashcard: (flashcardId) => {
        const { lists } = get()
        for (const list of lists) {
          if (list.flashcards.some((fc) => fc.id === flashcardId)) {
            return list.id
          }
        }
        return null
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
