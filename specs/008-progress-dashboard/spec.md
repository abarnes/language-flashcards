# Feature Specification: Progress Dashboard

**Feature Branch**: `008-progress-dashboard`
**Created**: 2025-01-09
**Status**: Draft
**Input**: User description: "Create a dashboard which highlights the user's current progress and state. Show the number of words up for review, show a breakdown by list, and show how many have been done recently (such as the past week). Show how many words the user has gotten right over the past week."

## Overview

Transform the existing Dashboard page into a comprehensive progress-tracking hub that surfaces key learning metrics. The dashboard will display review statistics, progress by list, recent activity, and performance trends—motivating users to maintain consistent study habits.

### Data Availability Analysis

**Currently Available (from existing SRS data):**
- Words due for review (via `dueDate` on each flashcard)
- Total cards per list
- Cards reviewed at least once (have `lastReviewed` timestamp)
- Card difficulty (via `easeFactor`)
- Current SRS stage per card (new, learning, review)

**Requires New Data Structure:**
- Historical review counts (reviews completed per day)
- Accuracy tracking (correct/incorrect per day)

To fully support the requested metrics (words done/gotten right over past week), this spec includes a new `DailyStats` data structure that aggregates review activity by day. This approach minimizes Firebase reads/writes (1 document per day vs. 1 per review event).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Words Due for Review (Priority: P1)

A user opens the dashboard and immediately sees how many flashcards are due for review across all lists.

**Why this priority**: The "due for review" count is the primary call-to-action—it drives users to study. This is the most actionable metric.

**Independent Test**: Create cards with past due dates, open dashboard, verify count matches due cards.

**Acceptance Scenarios**:

1. **Given** I have 15 cards with past due dates, **When** I open the dashboard, **Then** I see "15 words due for review"
2. **Given** I have 0 due cards, **When** I open the dashboard, **Then** I see "All caught up!" or "0 words due"
3. **Given** I have cards due in both directions (normal/reverse), **When** I view due count, **Then** it shows the unique card count (not double-counted)
4. **Given** due cards exist, **When** I click the due count, **Then** I'm taken to study mode with due cards pre-filtered

---

### User Story 2 - View Due Cards by List (Priority: P1)

A user sees a breakdown of due cards organized by vocabulary list, allowing them to prioritize which list to study.

**Why this priority**: Users often want to focus on specific material (e.g., recent chapters). Breakdown by list enables targeted study.

**Independent Test**: Create multiple lists with varying due counts, verify each list shows its own due count.

**Acceptance Scenarios**:

1. **Given** I have 3 lists with 5, 10, and 0 due cards, **When** I view the breakdown, **Then** I see each list name with its due count
2. **Given** a list has 0 due cards, **When** I view the breakdown, **Then** that list shows "0 due" (not hidden)
3. **Given** I click a list's due count, **When** navigating, **Then** I go to study mode filtered to that list's due cards
4. **Given** I view the breakdown, **When** I see each list, **Then** I also see total cards in that list (e.g., "5/50 due")

---

### User Story 3 - View Recent Review Activity (Priority: P1)

A user sees how many words they've reviewed in the past 7 days, encouraging consistent study habits.

**Why this priority**: Tracking recent activity creates accountability and habit awareness. Essential for motivation.

**Independent Test**: Complete reviews over multiple days, verify dashboard shows accurate count for past week.

**Acceptance Scenarios**:

1. **Given** I reviewed 20 cards yesterday and 15 today, **When** I open dashboard, **Then** I see "35 words reviewed this week"
2. **Given** I haven't studied in 8 days, **When** I open dashboard, **Then** I see "0 words reviewed this week"
3. **Given** recent activity exists, **When** I view the stat, **Then** I see a visual indicator (e.g., trend arrow, mini chart)
4. **Given** I complete a review, **When** I return to dashboard, **Then** the count updates immediately

---

### User Story 4 - View Weekly Accuracy (Priority: P1)

A user sees what percentage of reviews they got correct over the past week, helping them gauge retention quality.

**Why this priority**: Accuracy is a key learning quality metric. Users need feedback on how well they're retaining vocabulary.

**Independent Test**: Complete reviews with known results, verify accuracy percentage matches.

**Acceptance Scenarios**:

1. **Given** I reviewed 40 cards and got 32 correct this week, **When** I view accuracy, **Then** I see "80% correct"
2. **Given** I have no reviews this week, **When** I view accuracy, **Then** I see "No reviews yet" (not 0%)
3. **Given** I mark a card "Good" or "Easy", **When** accuracy calculates, **Then** it counts as correct
4. **Given** I mark a card "Again" or "Hard", **When** accuracy calculates, **Then** both count as incorrect

---

### User Story 5 - View Learning Progress Overview (Priority: P2)

A user sees a high-level summary of their overall vocabulary learning state: new cards, cards in learning, and mature cards.

**Why this priority**: Gives users context about their overall progress beyond just "due today."

**Independent Test**: Create cards in various SRS stages, verify counts match.

**Acceptance Scenarios**:

1. **Given** I have 50 new, 30 learning, and 100 mature cards, **When** I view overview, **Then** I see these counts in a visual breakdown
2. **Given** I'm viewing the overview, **When** I see categories, **Then** they are: "New" (never reviewed), "Learning" (interval < 21 days), "Mature" (interval >= 21 days)
3. **Given** I click a category, **When** navigating, **Then** I see a filtered list of cards in that state

---

### User Story 6 - View Daily Review Streak (Priority: P2)

A user sees their current streak of consecutive days with at least one review, encouraging daily practice.

**Why this priority**: Streaks are a proven motivational tool for habit formation.

**Independent Test**: Review cards over consecutive days, verify streak count increments correctly.

**Acceptance Scenarios**:

1. **Given** I've reviewed every day for 5 days, **When** I view streak, **Then** I see "5 day streak"
2. **Given** I missed yesterday, **When** I view streak, **Then** I see "0 day streak" or "Streak lost"
3. **Given** I haven't reviewed today yet, **When** I view streak, **Then** I see yesterday's streak with "Keep it going!" prompt
4. **Given** today is my first day, **When** I complete a review, **Then** streak shows "1 day streak"

---

### User Story 7 - View Review Forecast (Priority: P3)

A user sees a forecast of upcoming due cards for the next 7 days, helping them plan study time.

**Why this priority**: Nice-to-have for planning but not essential for core dashboard function.

**Independent Test**: Create cards with future due dates, verify forecast shows correct counts.

**Acceptance Scenarios**:

1. **Given** I have cards due on various future days, **When** I view forecast, **Then** I see a bar chart with daily due counts
2. **Given** I view the forecast, **When** I see bars, **Then** overdue cards are highlighted differently
3. **Given** I click a forecast day, **When** navigating, **Then** I see cards due that day

---

### User Story 8 - View Daily Activity History (Priority: P3)

A user sees a log of their daily review activity for the past week, showing reviews and accuracy per day.

**Why this priority**: Detailed history for power users; not essential for quick progress check.

**Independent Test**: Complete reviews over multiple days, verify history shows each day with correct stats.

**Acceptance Scenarios**:

1. **Given** I reviewed cards over the past 5 days, **When** I view history, **Then** I see each day with review count and accuracy
2. **Given** I view history, **When** scrolling, **Then** I see up to 7 days of activity
3. **Given** I didn't review on a day, **When** viewing history, **Then** that day shows "0 reviews" or is grayed out

---

### Edge Cases

- **Empty state**: New user with no lists/cards should see encouraging onboarding message, not empty charts
- **No reviews in date range**: Show "0" counts with encouraging messaging, not broken charts
- **Timezone handling**: Use local timezone for day boundaries (midnight)
- **Offline/sync**: Dashboard shows local data immediately; syncs in background
- **Very large card counts**: Ensure dashboard renders quickly with 1000+ cards

---

## Requirements *(mandatory)*

### Functional Requirements

#### Core Metrics (P1)
- **FR-001**: Dashboard MUST display total cards due for review (aggregate across all lists)
- **FR-002**: Dashboard MUST show due card count broken down by vocabulary list
- **FR-003**: Dashboard MUST display number of reviews completed in the past 7 days
- **FR-004**: Dashboard MUST display review accuracy percentage for the past 7 days
- **FR-005**: Each due count MUST be clickable to start a study session with that filter applied

#### Learning State (P2)
- **FR-006**: Dashboard MUST show card counts by learning stage (New, Learning, Mature)
- **FR-007**: Dashboard MUST display current study streak in consecutive days
- **FR-008**: Dashboard SHOULD update metrics in real-time when user returns from study

#### Extended Metrics (P3)
- **FR-009**: Dashboard MAY show a 7-day forecast of upcoming due cards
- **FR-010**: Dashboard MAY show daily activity history (reviews/accuracy per day)
- **FR-011**: Dashboard MAY show a visual weekly activity heatmap

#### Data Persistence
- **FR-012**: System MUST persist daily review aggregates (total reviews, correct count, per-list breakdown)
- **FR-013**: Daily stats MUST sync to Firebase alongside vocab lists (1 document per day)
- **FR-014**: System MUST calculate streak from daily stats history
- **FR-015**: Daily stats document MUST be updated incrementally during study sessions (not recreated)

### Non-Functional Requirements

- **NFR-001**: Dashboard MUST load and display all metrics within 500ms for up to 5000 cards
- **NFR-002**: Metrics calculations MUST NOT block the UI thread (use memoization)
- **NFR-003**: Dashboard MUST be fully responsive (mobile-friendly layout)
- **NFR-004**: Visual elements MUST follow existing Tailwind/ShadCN design patterns

### Key Entities

#### New: DailyStats (for historical tracking)

```typescript
interface DailyStats {
  date: string;              // ISO date string, e.g., "2025-01-09"
  reviews: number;           // Total reviews completed this day
  correct: number;           // Reviews marked correct (good/easy only; hard counts as incorrect)
  byList: {                  // Breakdown by vocabulary list
    [listId: string]: {
      reviews: number;
      correct: number;
    };
  };
}
```

**Storage**: `users/{uid}/dailyStats/{date}` in Firestore (e.g., `dailyStats/2025-01-09`)

**Rationale**: Aggregating by day instead of per-event dramatically reduces Firebase operations:
- **Writes**: 1 document update per day (vs. N per review)
- **Reads**: 7 documents for weekly stats (vs. potentially hundreds)
- **Cost**: ~90% reduction in Firebase reads/writes

**Trade-offs**:
- Cannot show per-session breakdowns (only daily totals)
- Cannot analyze review timing patterns within a day
- Acceptable for MVP; detailed history can be added locally later if needed

#### Existing Entities (used for metrics)

- **Flashcard**: `srsNormal`, `srsReverse` with `dueDate`, `interval`, `lastReviewed`
- **VocabList**: Container for flashcards, used for per-list breakdown

### Derived Metrics (calculated, not stored)

| Metric | Calculation |
|--------|-------------|
| Due Cards | Count **unique cards** where `dueDate <= now` for either direction |
| Due by List | Group due cards by `listId` |
| Reviews This Week | Sum `DailyStats.reviews` for past 7 days |
| Accuracy This Week | Sum `correct` / Sum `reviews` × 100 (correct = good/easy only) |
| Current Streak | Count consecutive days (from today backward) where `DailyStats.reviews > 0` |
| New Cards | Cards where both `srsNormal` and `srsReverse` have no `lastReviewed` |
| Learning Cards | Cards where `interval < 21 days` (but has been reviewed) |
| Mature Cards | Cards where `interval >= 21 days` |

---

## Recommended Additional Metrics

Based on the available SRS data and best practices for language learning apps, these additional metrics would provide value:

### High Value (Recommend Implementing)

1. **Most Challenging Words**
   - Show 5-10 cards with lowest `easeFactor` (most frequently marked "Again")
   - Helps users focus on problem areas

2. **Time Until Next Review**
   - Show countdown to next due card (e.g., "Next review in 2 hours")
   - Encourages return visits

3. **Words Mastered**
   - Count of cards with `interval >= 60 days` (well-retained)
   - Satisfying milestone metric

4. **Retention Rate (Estimated)**
   - Based on SM-2 algorithm: `0.9 ^ (days_since_due / interval)`
   - Shows estimated memory decay

### Medium Value (Consider for Future)

5. **Average Daily New Cards**
   - Tracks learning pace over time

6. **Review Time Estimate**
   - "~15 minutes to review all due cards" based on average card time

7. **List Completion %**
   - Per list: percentage of cards that have reached "Mature" status

8. **Weekly Trend Comparison**
   - Compare this week's reviews/accuracy to last week
   - Uses `DailyStats` from past 14 days

### Lower Value (Post-MVP)

9. **Leaderboard/Social Comparison**
   - Requires multi-user features (out of scope for local-first app)

10. **Predictive Workload**
    - ML-based predictions for future review load

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dashboard renders all P1 metrics within 500ms on a list of 1000 cards
- **SC-002**: Due card count matches actual due cards with 100% accuracy
- **SC-003**: Weekly review count updates within 5 seconds of completing a review
- **SC-004**: Streak calculation correctly identifies missed days and resets appropriately
- **SC-005**: Mobile layout maintains readability with all metrics visible without horizontal scroll
- **SC-006**: Users can navigate from dashboard metric to filtered study session in 2 clicks or fewer

---

## UI/UX Considerations

### Layout Recommendation

```
┌─────────────────────────────────────────────────────────────┐
│  PROGRESS DASHBOARD                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   23        │  │   85%       │  │   7 days    │          │
│  │ Due Today   │  │  Accuracy   │  │   Streak    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Due by List                                    [View All]││
│  ├──────────────────────────────────────────────────────────┤
│  │ Chapter 5 Vocab        12 due / 50 total         [Study] │
│  │ Common Verbs            8 due / 35 total         [Study] │
│  │ Food & Drinks           3 due / 28 total         [Study] │
│  │ Adjectives              0 due / 42 total         [Study] │
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ This Week                                               ││
│  │ ┌───┬───┬───┬───┬───┬───┬───┐  147 reviews             ││
│  │ │Mon│Tue│Wed│Thu│Fri│Sat│Sun│  ↑ 23% from last week    ││
│  │ │ ▄ │ █ │ ▂ │ ▆ │ ▄ │   │ ▃ │                           ││
│  │ └───┴───┴───┴───┴───┴───┴───┘                           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────┐ ┌───────────────────────────────┐ │
│  │ Learning Overview     │ │ Quick Actions                │ │
│  │ ● New: 45             │ │ [Study Due Cards]            │ │
│  │ ● Learning: 89        │ │ [Add New Words]              │ │
│  │ ● Mature: 156         │ │ [Review Difficult Cards]     │ │
│  └──────────────────────┘ └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Empty State

For new users with no data:
- Show welcoming message
- Highlight "Add your first vocabulary list" CTA
- Display placeholder metrics with 0 values (not broken charts)

---

## Design Decisions

The following decisions have been finalized:

| Question | Decision |
|----------|----------|
| **Accuracy Definition** | "Hard" and "Again" both count as **incorrect**. Only "Good" and "Easy" count as correct. |
| **Streak Grace Period** | No grace period. Missing a day resets the streak to 0. |
| **Direction Handling** | A card due in both directions counts as **1 due card** (no duplication). |
| **Daily Stats Retention** | Keep stats **in perpetuity**. No automatic cleanup. |
| **Dashboard Location** | **Replace** the current Dashboard at `/` route. |
| **Real-time Updates** | Refresh metrics on **window focus** (visibility change). |

---

## Implementation Notes

### Firebase Schema Addition

```
users/{uid}/
  ├── lists/{listId}         → VocabList (existing)
  ├── settings/user          → Settings (existing)
  └── dailyStats/{date}      → DailyStats (NEW, e.g., "2025-01-09")
```

**Firebase Cost Estimation** (with daily aggregates):
- **Writes**: ~1-2 per study session (update today's stats doc)
- **Reads**: 7 docs for weekly dashboard (one per day)
- **Monthly active user**: ~60 writes + ~210 reads/month = negligible cost

### Performance Considerations

- Use Zustand computed selectors for derived metrics
- Memoize expensive calculations (due counts, accuracy)
- Cache `DailyStats` in Zustand store; only fetch from Firebase on app load
- Update local state immediately, sync to Firebase in background

### Migration

- No migration needed for existing users
- Daily stats start accumulating from feature launch
- Historical metrics will show "No data for this period" until history builds
- Stats kept in perpetuity—no cleanup job required

---

## Dependencies

- **Spec 006 (Study Modes)**: Study session must update `DailyStats` when cards are graded
- **Existing SRS service**: Used for due date calculations and card categorization
- **Firebase integration**: Already in place for data sync

---

## Appendix: Firebase Cost Comparison

| Approach | Writes/Session (50 cards) | Reads/Dashboard | Weekly Totals |
|----------|---------------------------|-----------------|---------------|
| Per-Event (`ReviewEvent`) | 50 | 350+ | 350 writes, 350+ reads |
| **Daily Aggregate (`DailyStats`)** | **1** | **7** | **~7 writes, ~50 reads** |

The daily aggregate approach reduces Firebase operations by approximately **98%**.
