# Quickstart: Progress Dashboard

**Feature**: 008-progress-dashboard
**Date**: 2025-01-09

## Overview

This guide provides the implementation sequence for the Progress Dashboard feature. Follow the phases in order—each builds on the previous.

---

## Prerequisites

- Node.js 18+
- Existing codebase with `npm install` completed
- Understanding of existing stores: `vocabStore`, `settingsStore`, `authStore`

```bash
# Verify setup
cd /Users/austin/Sites/language-flashcards
npm run dev  # Should start without errors
```

---

## Implementation Phases

### Phase 1: Data Layer (Foundation)

**Goal**: Add DailyStats type and storage infrastructure.

#### 1.1 Add DailyStats Type

Edit `src/types/index.ts`:

```typescript
// Add after existing interfaces

/** Daily review statistics aggregate */
export interface DailyStats {
  date: string              // ISO date "YYYY-MM-DD"
  reviews: number           // Total reviews
  correct: number           // Correct (good/easy) reviews
  byList: {
    [listId: string]: {
      reviews: number
      correct: number
    }
  }
}
```

#### 1.2 Extend StorageProvider Interface

Edit `src/services/storage/index.ts`:

```typescript
export interface StorageProvider {
  // ... existing methods ...

  // DailyStats
  loadDailyStats(startDate: string, endDate: string): Promise<DailyStats[]>
  saveDailyStats(stats: DailyStats): Promise<void>
}
```

#### 1.3 Implement LocalStorage Provider

Edit `src/services/storage/localStorageProvider.ts`:

```typescript
const DAILY_STATS_KEY = 'flashcards-daily-stats'

// Add to provider implementation:
async loadDailyStats(startDate: string, endDate: string): Promise<DailyStats[]> {
  const data = localStorage.getItem(DAILY_STATS_KEY)
  if (!data) return []
  const allStats: Record<string, DailyStats> = JSON.parse(data)
  return Object.values(allStats).filter(s =>
    s.date >= startDate && s.date <= endDate
  )
}

async saveDailyStats(stats: DailyStats): Promise<void> {
  const data = localStorage.getItem(DAILY_STATS_KEY)
  const allStats: Record<string, DailyStats> = data ? JSON.parse(data) : {}
  allStats[stats.date] = stats
  localStorage.setItem(DAILY_STATS_KEY, JSON.stringify(allStats))
}
```

#### 1.4 Implement Firestore Provider

Edit `src/services/storage/firestoreProvider.ts`:

```typescript
// Add collection reference
const statsRef = collection(db, 'users', uid, 'dailyStats')

// Add methods:
async loadDailyStats(startDate: string, endDate: string): Promise<DailyStats[]> {
  const q = query(statsRef,
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => doc.data() as DailyStats)
}

async saveDailyStats(stats: DailyStats): Promise<void> {
  await setDoc(doc(statsRef, stats.date), stats)
}
```

---

### Phase 2: Stats Store

**Goal**: Create Zustand store for DailyStats management.

#### 2.1 Create statsStore

Create `src/stores/statsStore.ts`:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DailyStats } from '@/types'

interface StatsState {
  dailyStats: Record<string, DailyStats>
  isHydrated: boolean

  recordReview: (listId: string, isCorrect: boolean) => void
  loadStats: (days: number) => Promise<void>
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
        set(state => {
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

      loadStats: async (days: number) => {
        // Implementation depends on storage provider
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
```

---

### Phase 3: Integration with Review Flow

**Goal**: Record stats when cards are reviewed.

#### 3.1 Modify vocabStore

Edit `src/stores/vocabStore.ts`:

```typescript
import { useStatsStore } from './statsStore'

// Add helper method
findListIdByFlashcard: (flashcardId: string): string | null => {
  const lists = get().lists
  for (const list of lists) {
    if (list.flashcards.some(f => f.id === flashcardId)) {
      return list.id
    }
  }
  return null
}

// Modify reviewFlashcard to record stats
reviewFlashcard: (flashcardId: string, grade: SRSGrade, direction: StudyDirection) => {
  // ... existing SRS update logic ...

  // Record in stats store
  const listId = get().findListIdByFlashcard(flashcardId)
  if (listId) {
    const isCorrect = grade === 'good' || grade === 'easy'
    useStatsStore.getState().recordReview(listId, isCorrect)
  }
}
```

---

### Phase 4: Dashboard Components

**Goal**: Build UI components for metrics display.

#### 4.1 Create useProgressMetrics Hook

Create `src/hooks/useProgressMetrics.ts`:

```typescript
import { useMemo } from 'react'
import { useVocabStore } from '@/stores/vocabStore'
import { useStatsStore } from '@/stores/statsStore'
import { isDue } from '@/services/srs'

export function useProgressMetrics() {
  const lists = useVocabStore(state => state.lists)
  const weeklyStats = useStatsStore(state => state.getWeeklyStats())
  const currentStreak = useStatsStore(state => state.getCurrentStreak())

  return useMemo(() => {
    // Calculate due cards
    const allCards = lists.flatMap(l => l.flashcards)
    const dueCards = allCards.filter(c =>
      isDue(c, 'normal') || isDue(c, 'reverse')
    )

    // Due by list
    const dueByList = lists.map(list => ({
      listId: list.id,
      listName: list.name,
      dueCount: list.flashcards.filter(c =>
        isDue(c, 'normal') || isDue(c, 'reverse')
      ).length,
      totalCards: list.flashcards.length,
    }))

    // Weekly totals
    const weeklyReviews = weeklyStats.reduce((sum, d) => sum + d.reviews, 0)
    const weeklyCorrect = weeklyStats.reduce((sum, d) => sum + d.correct, 0)
    const weeklyAccuracy = weeklyReviews > 0
      ? Math.round((weeklyCorrect / weeklyReviews) * 100)
      : null

    // Learning overview
    const learningOverview = {
      new: allCards.filter(c =>
        !c.srsNormal?.lastReviewed && !c.srsReverse?.lastReviewed
      ).length,
      learning: allCards.filter(c => {
        const hasReview = c.srsNormal?.lastReviewed || c.srsReverse?.lastReviewed
        const maxInterval = Math.max(
          c.srsNormal?.interval ?? 0,
          c.srsReverse?.interval ?? 0
        )
        return hasReview && maxInterval < 21
      }).length,
      mature: allCards.filter(c => {
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
  }, [lists, weeklyStats, currentStreak])
}
```

#### 4.2 Create Dashboard Components

Create components in `src/components/dashboard/`:

- `StatsCard.tsx` - Reusable card for single metrics
- `ListBreakdown.tsx` - Table of lists with due counts
- `WeeklyChart.tsx` - 7-day bar chart
- `LearningOverview.tsx` - New/Learning/Mature breakdown

#### 4.3 Update Dashboard Page

Replace `src/pages/Dashboard.tsx` with new implementation using the hook and components.

---

### Phase 5: Polish & Testing

**Goal**: Finish integration and verify functionality.

#### 5.1 Add Visibility Refresh

Add to Dashboard.tsx:

```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Force re-render by touching state
    }
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
}, [])
```

#### 5.2 Manual Testing Checklist

- [ ] Dashboard loads with 0 due cards (empty state)
- [ ] Review cards, return to dashboard, see updated counts
- [ ] Verify streak increments after daily review
- [ ] Check accuracy calculation (good/easy = correct)
- [ ] Test with multiple lists
- [ ] Verify Firebase sync (if enabled)
- [ ] Test mobile responsiveness

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `src/types/index.ts` | MODIFY | Add DailyStats interface |
| `src/services/storage/index.ts` | MODIFY | Add DailyStats methods |
| `src/services/storage/localStorageProvider.ts` | MODIFY | Implement DailyStats |
| `src/services/storage/firestoreProvider.ts` | MODIFY | Implement DailyStats |
| `src/stores/statsStore.ts` | CREATE | New stats management store |
| `src/stores/vocabStore.ts` | MODIFY | Add stats recording |
| `src/hooks/useProgressMetrics.ts` | CREATE | Computed metrics hook |
| `src/components/dashboard/StatsCard.tsx` | CREATE | Metric card component |
| `src/components/dashboard/ListBreakdown.tsx` | CREATE | List table component |
| `src/components/dashboard/WeeklyChart.tsx` | CREATE | Activity chart |
| `src/components/dashboard/LearningOverview.tsx` | CREATE | Stage breakdown |
| `src/pages/Dashboard.tsx` | MODIFY | New dashboard layout |

---

## Commands

```bash
# Development
npm run dev           # Start dev server

# Verify build
npm run build         # Should complete without errors
npm run lint          # Should pass

# Test locally
npm run preview       # Preview production build
```
