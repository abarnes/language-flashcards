# Tasks: Progress Dashboard

**Input**: Design documents from `/specs/008-progress-dashboard/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Manual testing only (no test framework configured per Technical Context)

**Organization**: Tasks grouped by user story priority. P1 stories form MVP.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US8)
- Exact file paths included in descriptions

---

## Phase 1: Setup

**Purpose**: Verify existing project is ready for feature development

- [ ] T001 Verify project builds without errors by running `npm run build`
- [ ] T002 Verify dev server starts by running `npm run dev`

---

## Phase 2: Foundational (Data Layer)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: All user stories depend on this phase completing first

- [ ] T003 Add DailyStats interface to src/types/index.ts
- [ ] T004 Add StorageProvider interface methods (loadDailyStats, saveDailyStats) to src/services/storage/index.ts
- [ ] T005 [P] Implement loadDailyStats and saveDailyStats in src/services/storage/localStorageProvider.ts
- [ ] T006 [P] Implement loadDailyStats and saveDailyStats in src/services/storage/firestoreProvider.ts
- [ ] T007 Create statsStore with DailyStats management in src/stores/statsStore.ts
- [ ] T008 Add findListIdByFlashcard helper method to src/stores/vocabStore.ts
- [ ] T009 Modify reviewFlashcard in src/stores/vocabStore.ts to record stats via statsStore.recordReview()
- [ ] T010 Create useProgressMetrics hook with memoized calculations in src/hooks/useProgressMetrics.ts
- [ ] T011 Create components/dashboard/ directory structure

**Checkpoint**: Foundation ready - all data flows established, user story UI can now begin

---

## Phase 3: User Story 1+2 - Due Cards Display (Priority: P1) MVP

**Goal**: Show total due cards and breakdown by list on dashboard

**Independent Test**: Create cards with past due dates, open dashboard, verify counts match

### Implementation for US1+US2

- [ ] T012 [P] [US1] Create StatsCard component for single metrics in src/components/dashboard/StatsCard.tsx
- [ ] T013 [P] [US2] Create ListBreakdown component showing due per list in src/components/dashboard/ListBreakdown.tsx
- [ ] T014 [US1] Add totalDue calculation to useProgressMetrics hook (count unique cards due in either direction)
- [ ] T015 [US2] Add dueByList calculation to useProgressMetrics hook (group by list with due/total counts)
- [ ] T016 [US1] Update Dashboard.tsx to display StatsCard with total due count
- [ ] T017 [US2] Update Dashboard.tsx to display ListBreakdown with per-list due counts
- [ ] T018 [US1] Add click handler on due count StatsCard to navigate to /study with due filter
- [ ] T019 [US2] Add Study button per list in ListBreakdown to navigate to /study filtered by list
- [ ] T020 [US1] Handle empty state when 0 cards due (show "All caught up!" message)

**Checkpoint**: Dashboard shows due cards total and per-list breakdown with navigation to study

---

## Phase 4: User Story 3+4 - Weekly Review Stats (Priority: P1) MVP

**Goal**: Show reviews completed and accuracy percentage for past 7 days

**Independent Test**: Complete reviews, return to dashboard, verify weekly count and accuracy update

### Implementation for US3+US4

- [ ] T021 [US3] Add getWeeklyStats method to statsStore returning last 7 days of DailyStats
- [ ] T022 [US3] Add weeklyReviews calculation to useProgressMetrics (sum of reviews for 7 days)
- [ ] T023 [US4] Add weeklyAccuracy calculation to useProgressMetrics (correct/total * 100)
- [ ] T024 [P] [US3] Create WeeklyChart component with 7-day bar visualization in src/components/dashboard/WeeklyChart.tsx
- [ ] T025 [US3] Update Dashboard.tsx to display StatsCard with weekly review count
- [ ] T026 [US4] Update Dashboard.tsx to display StatsCard with accuracy percentage
- [ ] T027 [US3] Add dailyActivity array to useProgressMetrics for chart data
- [ ] T028 [US3] Update Dashboard.tsx to display WeeklyChart component
- [ ] T029 [US4] Handle null accuracy state when no reviews exist (show "No reviews yet")

**Checkpoint**: Dashboard shows weekly reviews, accuracy percentage, and activity chart

---

## Phase 5: User Story 5 - Learning Progress Overview (Priority: P2)

**Goal**: Show card counts by learning stage (New, Learning, Mature)

**Independent Test**: Create cards in various SRS stages, verify counts match categories

### Implementation for US5

- [ ] T030 [P] [US5] Create LearningOverview component in src/components/dashboard/LearningOverview.tsx
- [ ] T031 [US5] Add learningOverview calculation to useProgressMetrics (new/learning/mature counts)
- [ ] T032 [US5] Update Dashboard.tsx to display LearningOverview component
- [ ] T033 [US5] Add click handlers on categories to filter card list view (optional navigation)

**Checkpoint**: Dashboard shows New/Learning/Mature card breakdown

---

## Phase 6: User Story 6 - Daily Review Streak (Priority: P2)

**Goal**: Show consecutive days with at least one review

**Independent Test**: Review cards over consecutive days, verify streak increments correctly

### Implementation for US6

- [ ] T034 [US6] Add getCurrentStreak method to statsStore (count consecutive days with reviews > 0)
- [ ] T035 [US6] Add currentStreak to useProgressMetrics return value
- [ ] T036 [US6] Update Dashboard.tsx to display StatsCard with streak count
- [ ] T037 [US6] Add streak visual indicator (flame icon or similar) to StatsCard
- [ ] T038 [US6] Handle streak messaging ("Keep it going!" if today has 0 reviews but streak exists)

**Checkpoint**: Dashboard shows current study streak with motivational messaging

---

## Phase 7: User Story 7+8 - Forecast & History (Priority: P3)

**Goal**: Show 7-day forecast of upcoming due cards and daily activity history

**Independent Test**: Create cards with future due dates, verify forecast shows correct counts per day

### Implementation for US7+US8

- [ ] T039 [P] [US7] Create ForecastChart component in src/components/dashboard/ForecastChart.tsx
- [ ] T040 [US7] Add forecast calculation to useProgressMetrics (cards due per day for next 7 days)
- [ ] T041 [US7] Update Dashboard.tsx to display ForecastChart component
- [ ] T042 [US7] Highlight overdue cards differently in forecast visualization
- [ ] T043 [US8] Enhance WeeklyChart to show per-day review count and accuracy on hover/tap
- [ ] T044 [US8] Add daily breakdown tooltip or expandable detail to WeeklyChart

**Checkpoint**: Dashboard shows future workload forecast and detailed daily history

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, responsiveness, and edge cases

- [ ] T045 Add visibility change listener to Dashboard.tsx for refresh on focus
- [ ] T046 Implement empty state for new users (no lists/cards) with onboarding CTA
- [ ] T047 Ensure mobile responsiveness for all dashboard components
- [ ] T048 Add Quick Actions section to Dashboard (Study Due Cards, Add New Words buttons)
- [ ] T049 Run npm run build to verify no TypeScript errors
- [ ] T050 Run npm run lint to verify no linting issues
- [ ] T051 Manual testing: verify all metrics update after completing reviews
- [ ] T052 Manual testing: verify Firebase sync works for DailyStats (if logged in)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ─────────────────────────────────────────┐
                                                          │
Phase 2 (Foundational) ◄──────────────────────────────────┘
    │
    ├──► Phase 3 (US1+US2: Due Cards) ──► MVP CHECKPOINT
    │
    ├──► Phase 4 (US3+US4: Weekly Stats) ──► MVP COMPLETE
    │
    ├──► Phase 5 (US5: Learning Overview)
    │
    ├──► Phase 6 (US6: Streak)
    │
    └──► Phase 7 (US7+US8: Forecast & History)
                │
                ▼
         Phase 8 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1+US2 | Phase 2 | US3+US4, US5, US6 |
| US3+US4 | Phase 2 | US1+US2, US5, US6 |
| US5 | Phase 2 | US1+US2, US3+US4, US6 |
| US6 | Phase 2 | US1+US2, US3+US4, US5 |
| US7+US8 | Phase 2 | Can start after Phase 2 |

### Parallel Opportunities

Within Phase 2:
- T005 and T006 can run in parallel (different storage providers)

Within Phase 3:
- T012 and T013 can run in parallel (different components)

Within Phase 4:
- T024 is parallel (separate component file)

Within Phase 5:
- T030 is parallel (separate component file)

Within Phase 7:
- T039 is parallel (separate component file)

---

## Parallel Example: Foundation Phase

```bash
# After T004 completes, launch storage implementations in parallel:
Task: "Implement loadDailyStats and saveDailyStats in src/services/storage/localStorageProvider.ts"
Task: "Implement loadDailyStats and saveDailyStats in src/services/storage/firestoreProvider.ts"
```

## Parallel Example: User Story Components

```bash
# After foundation is complete, launch component creation in parallel:
Task: "Create StatsCard component in src/components/dashboard/StatsCard.tsx"
Task: "Create ListBreakdown component in src/components/dashboard/ListBreakdown.tsx"
Task: "Create WeeklyChart component in src/components/dashboard/WeeklyChart.tsx"
Task: "Create LearningOverview component in src/components/dashboard/LearningOverview.tsx"
```

---

## Implementation Strategy

### MVP First (P1 Stories Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T011)
3. Complete Phase 3: US1+US2 Due Cards (T012-T020)
4. Complete Phase 4: US3+US4 Weekly Stats (T021-T029)
5. **STOP and VALIDATE**: Test MVP independently
6. Deploy if ready - user has functional progress dashboard

### Incremental Delivery

| Increment | Stories | Value Delivered |
|-----------|---------|-----------------|
| MVP | US1+US2+US3+US4 | Due cards, weekly stats, accuracy |
| +P2 | US5+US6 | Learning overview, streak tracking |
| +P3 | US7+US8 | Forecast, detailed history |
| Polish | - | Responsiveness, edge cases |

### Single Developer Strategy

1. Setup → Foundation → US1+US2 → US3+US4 (MVP complete)
2. US5 → US6 (P2 complete)
3. US7+US8 (P3 complete)
4. Polish

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 52 |
| **Setup Tasks** | 2 |
| **Foundational Tasks** | 9 |
| **US1+US2 Tasks** | 9 |
| **US3+US4 Tasks** | 9 |
| **US5 Tasks** | 4 |
| **US6 Tasks** | 5 |
| **US7+US8 Tasks** | 6 |
| **Polish Tasks** | 8 |
| **Parallel Opportunities** | 8 tasks marked [P] |

### MVP Scope (Recommended)

Complete through Phase 4 (29 tasks) for full P1 functionality:
- Total due cards with study navigation
- Due breakdown by list
- Weekly review count with chart
- Weekly accuracy percentage

---

## Notes

- All file paths are relative to repository root
- [P] tasks can run in parallel if different files
- [Story] labels map to spec.md user stories
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
