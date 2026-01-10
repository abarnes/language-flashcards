# Research: Progress Dashboard

**Feature**: 008-progress-dashboard
**Date**: 2025-01-09
**Status**: Complete

## Research Tasks

Based on Technical Context analysis, the following areas required investigation:

1. Zustand computed selectors and memoization patterns
2. StorageProvider extension for DailyStats
3. Study session integration for recording reviews
4. Window focus detection for dashboard refresh

---

## 1. Zustand Computed Selectors

### Decision
Use Zustand's built-in selector pattern with `useMemo` for derived metrics.

### Rationale
- Zustand selectors re-run on every state change but are shallow-compared
- For expensive calculations (due cards across 5000 cards), wrap in `useMemo` at component level
- No need for external memoization library—React's built-in hooks suffice

### Implementation Pattern
```typescript
// In statsStore.ts - simple selectors
const useStatsStore = create<StatsState>((set, get) => ({
  dailyStats: {},
  getWeeklyReviews: () => {
    const stats = get().dailyStats
    // Sum last 7 days
  }
}))

// In component - memoize expensive derived data
function Dashboard() {
  const lists = useVocabStore(state => state.lists)
  const dueCards = useMemo(() =>
    lists.flatMap(l => l.flashcards).filter(isDueAnyDirection),
    [lists]
  )
}
```

### Alternatives Considered
- **Reselect library**: Overkill for this use case, adds dependency
- **Zustand middleware (immer)**: Already not used; keep it simple
- **Computed properties in store**: Would couple view logic to store

---

## 2. StorageProvider Extension

### Decision
Extend `StorageProvider` interface with three new methods for DailyStats.

### Rationale
- Follows existing pattern (loadLists/saveList/etc.)
- Allows LocalStorage and Firestore implementations to diverge as needed
- DailyStats is independent of VocabList—separate CRUD operations

### Implementation Pattern
```typescript
// storage/index.ts - extend interface
export interface StorageProvider {
  // Existing methods...

  // DailyStats
  loadDailyStats(startDate: string, endDate: string): Promise<DailyStats[]>
  saveDailyStats(stats: DailyStats): Promise<void>
  // No delete needed - stats kept in perpetuity
}
```

### Firestore Structure
```
users/{uid}/dailyStats/{date}  // e.g., "2025-01-09"
```

### LocalStorage Structure
```
flashcards-daily-stats: { [date: string]: DailyStats }
```

### Alternatives Considered
- **Embed in VocabList**: Would bloat list documents, complicate sync
- **Separate collection per user**: Current approach, cleaner separation
- **Single stats document**: Would grow unbounded, hit size limits

---

## 3. Study Session Integration

### Decision
Modify `vocabStore.reviewFlashcard()` to also update `statsStore` with review result.

### Rationale
- Single integration point—reviews already flow through `reviewFlashcard()`
- Keeps stats tracking decoupled from SRS logic
- Stats store handles daily aggregation internally

### Implementation Pattern
```typescript
// vocabStore.ts
reviewFlashcard(flashcardId: string, grade: SRSGrade, direction: StudyDirection) {
  // Existing SRS update logic...

  // NEW: Record review in stats
  const listId = this.findListByFlashcard(flashcardId)
  const isCorrect = grade === 'good' || grade === 'easy'
  useStatsStore.getState().recordReview(listId, isCorrect)
}

// statsStore.ts
recordReview(listId: string, isCorrect: boolean) {
  const today = getTodayDateString() // "2025-01-09"
  set(state => {
    const existing = state.dailyStats[today] ?? createEmptyStats(today)
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
              reviews: (existing.byList[listId]?.reviews ?? 0) + 1,
              correct: (existing.byList[listId]?.correct ?? 0) + (isCorrect ? 1 : 0),
            }
          }
        }
      }
    }
  })
}
```

### Alternatives Considered
- **Event emitter pattern**: Over-engineered for single consumer
- **Middleware**: Zustand middleware adds complexity
- **Direct call from Study.tsx**: Would couple UI to stats logic

---

## 4. Window Focus Detection

### Decision
Use `document.visibilitychange` event to refresh metrics when user returns to tab.

### Rationale
- Standard Web API, no dependencies needed
- More reliable than `window.focus` (works across all browsers)
- Refresh only when tab becomes visible, not on every focus

### Implementation Pattern
```typescript
// In Dashboard.tsx or custom hook
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Refresh metrics from store
      refreshMetrics()
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
}, [])
```

### Alternatives Considered
- **Polling interval**: Wastes resources, not reactive
- **window.onfocus**: Less reliable, doesn't detect tab switches
- **React Query/SWR**: Overkill for local data, adds dependencies

---

## 5. Accuracy Calculation Clarification

### Decision
"Hard" and "Again" both count as **incorrect**. Only "Good" and "Easy" count as correct.

### Rationale
- User explicitly decided this (see spec Design Decisions)
- "Hard" indicates struggle, even if card wasn't fully forgotten
- Stricter accuracy metric encourages better retention

### Implementation
```typescript
const isCorrect = grade === 'good' || grade === 'easy'
// 'again' -> false
// 'hard' -> false
// 'good' -> true
// 'easy' -> true
```

---

## 6. Due Card Counting (Direction Handling)

### Decision
A card due in both directions counts as **1 due card**, not 2.

### Rationale
- User explicitly decided this (see spec Design Decisions)
- Avoids confusing users with inflated counts
- Dashboard shows "cards to review," not "reviews to complete"

### Implementation
```typescript
// Count unique cards that are due in ANY direction
const dueCards = cards.filter(card =>
  isDue(card, 'normal') || isDue(card, 'reverse')
)
const dueCount = dueCards.length // Not doubled
```

---

## Summary

All research items resolved. No external dependencies required. Implementation follows existing codebase patterns:

| Topic | Decision | Complexity |
|-------|----------|------------|
| Memoization | React useMemo + Zustand selectors | Low |
| Storage | Extend StorageProvider interface | Low |
| Review tracking | Call statsStore from vocabStore | Low |
| Focus refresh | visibilitychange event | Low |
| Accuracy | Hard = incorrect | Decided |
| Due counting | Unique cards only | Decided |

**Proceed to Phase 1: Data Model & Contracts**
