import { useMemo } from 'react'
import { useVocabStore } from '@/stores/vocabStore'
import { useStatsStore } from '@/stores/statsStore'
import { isDue } from '@/services/srs'
import type { DailyStats } from '@/types'

export interface ProgressMetrics {
  totalDue: number
  dueByList: Array<{
    listId: string
    listName: string
    dueCount: number
    totalCards: number
  }>
  weeklyReviews: number
  weeklyAccuracy: number | null
  currentStreak: number
  dailyActivity: DailyStats[]
  learningOverview: {
    new: number
    learning: number
    mature: number
  }
}

export function useProgressMetrics(): ProgressMetrics {
  const lists = useVocabStore((state) => state.lists)
  const getWeeklyStats = useStatsStore((state) => state.getWeeklyStats)
  const getCurrentStreak = useStatsStore((state) => state.getCurrentStreak)

  return useMemo(() => {
    const weeklyStats = getWeeklyStats()
    const currentStreak = getCurrentStreak()

    // Calculate due cards (unique cards due in any direction)
    const allCards = lists.flatMap((l) => l.flashcards)
    const dueCards = allCards.filter(
      (c) => isDue(c, 'normal') || isDue(c, 'reverse')
    )

    // Due by list
    const dueByList = lists.map((list) => ({
      listId: list.id,
      listName: list.name,
      dueCount: list.flashcards.filter(
        (c) => isDue(c, 'normal') || isDue(c, 'reverse')
      ).length,
      totalCards: list.flashcards.length,
    }))

    // Weekly totals
    const weeklyReviews = weeklyStats.reduce((sum, d) => sum + d.reviews, 0)
    const weeklyCorrect = weeklyStats.reduce((sum, d) => sum + d.correct, 0)
    const weeklyAccuracy =
      weeklyReviews > 0
        ? Math.round((weeklyCorrect / weeklyReviews) * 100)
        : null

    // Learning overview
    const learningOverview = {
      new: allCards.filter(
        (c) => !c.srsNormal?.lastReviewed && !c.srsReverse?.lastReviewed
      ).length,
      learning: allCards.filter((c) => {
        const hasReview =
          c.srsNormal?.lastReviewed || c.srsReverse?.lastReviewed
        const maxInterval = Math.max(
          c.srsNormal?.interval ?? 0,
          c.srsReverse?.interval ?? 0
        )
        return hasReview && maxInterval < 21
      }).length,
      mature: allCards.filter((c) => {
        const maxInterval = Math.max(
          c.srsNormal?.interval ?? 0,
          c.srsReverse?.interval ?? 0
        )
        return maxInterval >= 21
      }).length,
    }

    return {
      totalDue: dueCards.length,
      dueByList,
      weeklyReviews,
      weeklyAccuracy,
      currentStreak,
      dailyActivity: weeklyStats,
      learningOverview,
    }
  }, [lists, getWeeklyStats, getCurrentStreak])
}
