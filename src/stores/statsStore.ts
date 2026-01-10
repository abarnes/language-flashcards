import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DailyStats } from '@/types'

interface StatsState {
  dailyStats: Record<string, DailyStats>
  isHydrated: boolean

  recordReview: (listId: string, isCorrect: boolean) => void
  getWeeklyStats: () => DailyStats[]
  getCurrentStreak: () => number
  setHydrated: (value: boolean) => void
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function createEmptyStats(date: string): DailyStats {
  return { date, reviews: 0, correct: 0, byList: {} }
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      dailyStats: {},
      isHydrated: false,

      recordReview: (listId: string, isCorrect: boolean) => {
        const today = getTodayString()
        set((state) => {
          const existing = state.dailyStats[today] ?? createEmptyStats(today)
          const listStats = existing.byList[listId] ?? { reviews: 0, correct: 0 }

          return {
            dailyStats: {
              ...state.dailyStats,
              [today]: {
                ...existing,
                reviews: existing.reviews + 1,
                correct: existing.correct + (isCorrect ? 1 : 0),
                byList: {
                  ...existing.byList,
                  [listId]: {
                    reviews: listStats.reviews + 1,
                    correct: listStats.correct + (isCorrect ? 1 : 0),
                  },
                },
              },
            },
          }
        })
      },

      getWeeklyStats: () => {
        const stats = get().dailyStats
        const today = new Date()
        const result: DailyStats[] = []

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          result.push(stats[dateStr] ?? createEmptyStats(dateStr))
        }
        return result
      },

      getCurrentStreak: () => {
        const stats = get().dailyStats
        let streak = 0
        const today = new Date()

        for (let i = 0; i < 365; i++) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          const dayStats = stats[dateStr]

          if (dayStats && dayStats.reviews > 0) {
            streak++
          } else if (i > 0) {
            // Allow today to have 0 reviews without breaking streak
            break
          }
        }
        return streak
      },

      setHydrated: (value: boolean) => set({ isHydrated: value }),
    }),
    {
      name: 'flashcards-daily-stats',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
