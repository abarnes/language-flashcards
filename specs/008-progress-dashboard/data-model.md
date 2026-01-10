# Data Model: Progress Dashboard

**Feature**: 008-progress-dashboard
**Date**: 2025-01-09

## New Entities

### DailyStats

Tracks aggregated review activity for a single day. One document per day per user.

```typescript
interface DailyStats {
  /** ISO date string, e.g., "2025-01-09" */
  date: string

  /** Total number of reviews completed on this day */
  reviews: number

  /** Number of correct reviews (grade = 'good' | 'easy') */
  correct: number

  /** Breakdown of reviews by vocabulary list */
  byList: {
    [listId: string]: {
      reviews: number
      correct: number
    }
  }
}
```

**Storage Locations**:
- LocalStorage: `flashcards-daily-stats` key → `{ [date: string]: DailyStats }`
- Firestore: `users/{uid}/dailyStats/{date}` → DailyStats document

**Lifecycle**:
- Created: On first review of the day (if no stats exist for today)
- Updated: Incrementally on each card review
- Deleted: Never (kept in perpetuity per spec decision)

---

## Existing Entity Modifications

### StorageProvider Interface

Add methods for DailyStats persistence:

```typescript
export interface StorageProvider {
  // Existing methods (unchanged)
  loadLists(): Promise<VocabList[]>
  saveList(list: VocabList): Promise<void>
  deleteList(id: string): Promise<void>
  saveLists(lists: VocabList[]): Promise<void>
  loadSettings(): Promise<Settings | null>
  saveSettings(settings: Settings): Promise<void>
  clearAll(): Promise<void>

  // NEW: DailyStats methods
  loadDailyStats(startDate: string, endDate: string): Promise<DailyStats[]>
  saveDailyStats(stats: DailyStats): Promise<void>
}
```

---

## Derived/Computed Data

These values are calculated at runtime, not stored:

### ProgressMetrics

Computed from DailyStats + VocabLists for dashboard display:

```typescript
interface ProgressMetrics {
  /** Total unique cards due for review (either direction) */
  totalDue: number

  /** Due cards grouped by list */
  dueByList: Array<{
    listId: string
    listName: string
    dueCount: number
    totalCards: number
  }>

  /** Sum of reviews in past 7 days */
  weeklyReviews: number

  /** Accuracy percentage for past 7 days (0-100) */
  weeklyAccuracy: number | null  // null if no reviews

  /** Current consecutive day streak */
  currentStreak: number

  /** Reviews per day for past 7 days (for chart) */
  dailyActivity: Array<{
    date: string
    reviews: number
    correct: number
  }>

  /** Card counts by learning stage */
  learningOverview: {
    new: number       // Never reviewed
    learning: number  // interval < 21 days
    mature: number    // interval >= 21 days
  }
}
```

### Calculation Logic

| Metric | Formula |
|--------|---------|
| `totalDue` | Count unique cards where `isDue(card, 'normal') \|\| isDue(card, 'reverse')` |
| `dueByList` | Group due cards by their parent list ID |
| `weeklyReviews` | Sum `DailyStats.reviews` for dates in `[today-6, today]` |
| `weeklyAccuracy` | `(sum correct / sum reviews) * 100` for past 7 days |
| `currentStreak` | Count consecutive days from today backward where `reviews > 0` |
| `learningOverview.new` | Cards where both `srsNormal` and `srsReverse` have no `lastReviewed` |
| `learningOverview.learning` | Cards with `lastReviewed` and max interval < 21 days |
| `learningOverview.mature` | Cards with max interval >= 21 days |

---

## State Management

### statsStore (new)

```typescript
interface StatsState {
  /** Cached daily stats, keyed by date string */
  dailyStats: Record<string, DailyStats>

  /** Loading state */
  isLoading: boolean

  /** Whether stats have been hydrated from storage */
  isHydrated: boolean

  /** Actions */
  loadStats: (days: number) => Promise<void>
  recordReview: (listId: string, isCorrect: boolean) => void
  getWeeklyStats: () => DailyStats[]
  getCurrentStreak: () => number
}
```

### vocabStore (modifications)

Add helper method to find list containing a flashcard:

```typescript
interface VocabState {
  // Existing...

  /** Find which list contains a given flashcard */
  findListIdByFlashcard: (flashcardId: string) => string | null
}
```

Modify `reviewFlashcard` to also record stats:

```typescript
reviewFlashcard(flashcardId: string, grade: SRSGrade, direction: StudyDirection) {
  // Existing SRS logic...

  // NEW: Record in stats store
  const listId = this.findListIdByFlashcard(flashcardId)
  if (listId) {
    const isCorrect = grade === 'good' || grade === 'easy'
    useStatsStore.getState().recordReview(listId, isCorrect)
  }
}
```

---

## Validation Rules

### DailyStats

| Field | Rule |
|-------|------|
| `date` | ISO date format `YYYY-MM-DD`, must be valid date |
| `reviews` | Integer >= 0 |
| `correct` | Integer >= 0, must be <= `reviews` |
| `byList` | All listIds must exist in vocab store (soft validation) |
| `byList[*].reviews` | Integer >= 0 |
| `byList[*].correct` | Integer >= 0, must be <= reviews for that list |

### Runtime Validation (Zod schema)

```typescript
import { z } from 'zod'

const ListStatsSchema = z.object({
  reviews: z.number().int().min(0),
  correct: z.number().int().min(0),
})

const DailyStatsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reviews: z.number().int().min(0),
  correct: z.number().int().min(0),
  byList: z.record(z.string(), ListStatsSchema),
}).refine(data => data.correct <= data.reviews, {
  message: 'correct cannot exceed reviews',
})
```

---

## Entity Relationships

```
┌─────────────────┐         ┌─────────────────┐
│   VocabList     │────────▶│   Flashcard     │
│                 │  1:N    │                 │
│ - id            │         │ - id            │
│ - flashcards[]  │         │ - srsNormal     │
└─────────────────┘         │ - srsReverse    │
        │                   └─────────────────┘
        │                           │
        │ referenced by             │ due status
        ▼                           │ derived from
┌─────────────────┐                 │
│   DailyStats    │                 │
│                 │                 │
│ - byList[id]    │─────────────────┘
│ - reviews       │     aggregates reviews
│ - correct       │
└─────────────────┘
```

---

## Migration Notes

- **No schema migration needed**: DailyStats is a new collection
- **Backwards compatible**: Existing VocabList and Flashcard schemas unchanged
- **First-time setup**: Empty `dailyStats` object until first review recorded
- **Historical data**: Not backfilled—metrics show "No data" until reviews accumulate
