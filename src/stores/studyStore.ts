import { create } from 'zustand'
import type { StudySession, Flashcard } from '@/types'

interface StudyState {
  session: StudySession | null

  startSession: (
    cards: Flashcard[],
    mode: 'normal' | 'reverse',
    sourceListId?: string,
    tagFilters?: string[]
  ) => void

  flipCard: () => void
  nextCard: () => void
  previousCard: () => void
  markKnown: () => void
  markUnknown: () => void
  endSession: () => void
  shuffleCards: () => void
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export const useStudyStore = create<StudyState>()((set, get) => ({
  session: null,

  startSession: (cards, mode, sourceListId, tagFilters = []) => {
    if (cards.length === 0) return

    set({
      session: {
        mode,
        sourceListId,
        tagFilters,
        cards: [...cards],
        currentIndex: 0,
        knownCount: 0,
        unknownCount: 0,
        isFlipped: false,
        isComplete: false,
      },
    })
  },

  flipCard: () => {
    set((state) => {
      if (!state.session) return state
      return {
        session: { ...state.session, isFlipped: !state.session.isFlipped },
      }
    })
  },

  nextCard: () => {
    set((state) => {
      if (!state.session) return state
      const nextIndex = state.session.currentIndex + 1
      if (nextIndex >= state.session.cards.length) {
        return {
          session: { ...state.session, isComplete: true },
        }
      }
      return {
        session: {
          ...state.session,
          currentIndex: nextIndex,
          isFlipped: false,
        },
      }
    })
  },

  previousCard: () => {
    set((state) => {
      if (!state.session || state.session.currentIndex === 0) return state
      return {
        session: {
          ...state.session,
          currentIndex: state.session.currentIndex - 1,
          isFlipped: false,
        },
      }
    })
  },

  markKnown: () => {
    const { session, nextCard } = get()
    if (!session) return

    set((state) => ({
      session: state.session
        ? { ...state.session, knownCount: state.session.knownCount + 1 }
        : null,
    }))
    nextCard()
  },

  markUnknown: () => {
    const { session, nextCard } = get()
    if (!session) return

    set((state) => ({
      session: state.session
        ? { ...state.session, unknownCount: state.session.unknownCount + 1 }
        : null,
    }))
    nextCard()
  },

  endSession: () => {
    set({ session: null })
  },

  shuffleCards: () => {
    set((state) => {
      if (!state.session) return state
      return {
        session: {
          ...state.session,
          cards: shuffleArray(state.session.cards),
          currentIndex: 0,
          isFlipped: false,
        },
      }
    })
  },
}))
