# Implementation Plan: Progress Dashboard

**Branch**: `008-progress-dashboard` | **Date**: 2025-01-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-progress-dashboard/spec.md`

## Summary

Transform the existing Dashboard page into a progress-tracking hub that displays:
- Words due for review (total and per-list breakdown)
- Weekly review activity and accuracy metrics
- Study streak tracking
- Learning stage overview (new/learning/mature)

Requires a new `DailyStats` data structure to track historical review activity, stored in Firebase alongside vocab lists. Uses daily aggregates (not per-event) to minimize Firebase operations (~98% reduction vs. per-event approach).

## Technical Context

**Language/Version**: TypeScript 5.9+ (strict mode enabled)
**Primary Dependencies**: React 19, Zustand 5, Firebase 12, Vite 7, Tailwind CSS 4, ShadCN UI
**Storage**: LocalStorage (MVP) + Firestore (optional sync via StorageProvider interface)
**Testing**: Manual testing (no test framework currently configured)
**Target Platform**: Web browser (SPA deployed to Vercel)
**Project Type**: Single-page web application (frontend only, no backend)
**Performance Goals**: Dashboard metrics must render within 500ms for up to 5000 cards
**Constraints**: Offline-capable, privacy-first (no telemetry), local-first data storage
**Scale/Scope**: Single user, up to ~5000 flashcards across multiple lists

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Privacy-First Local Storage | ✅ PASS | All data stored locally. DailyStats follows same pattern as VocabList. Firebase sync is optional and user-controlled. |
| II. AI-Assisted but User-Controlled | ✅ N/A | This feature does not use AI. |
| III. Progressive Enhancement | ✅ PASS | Extends existing storage patterns. DailyStats includes optional fields for future metrics. No breaking changes to existing data. |
| IV. Component-Based Architecture | ✅ PASS | Will use ShadCN Card, Badge, Progress components. Dashboard remains thin orchestrator. Metrics computed in Zustand store. |
| V. Type Safety | ✅ PASS | DailyStats interface defined in types/. Firestore data validated at runtime. No `any` types. |
| VI. Simplicity Over Complexity | ✅ PASS | Daily aggregates chosen over per-event (simpler, fewer writes). No new abstractions—extends existing StorageProvider. |

**Gate Result**: ✅ PASS - No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/008-progress-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no API)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── ui/                    # ShadCN primitives (existing)
│   └── dashboard/             # NEW: Dashboard-specific components
│       ├── StatsCard.tsx      # Reusable metric card (due, accuracy, streak)
│       ├── ListBreakdown.tsx  # Due cards by list table
│       ├── WeeklyChart.tsx    # 7-day activity visualization
│       └── LearningOverview.tsx # New/Learning/Mature breakdown
├── pages/
│   └── Dashboard.tsx          # MODIFY: Replace current implementation
├── stores/
│   ├── vocabStore.ts          # MODIFY: Add due card calculations
│   └── statsStore.ts          # NEW: DailyStats management
├── services/
│   └── storage/
│       ├── index.ts           # MODIFY: Add DailyStats methods to interface
│       ├── localStorageProvider.ts  # MODIFY: Implement DailyStats persistence
│       └── firestoreProvider.ts     # MODIFY: Implement DailyStats sync
├── types/
│   └── index.ts               # MODIFY: Add DailyStats interface
└── hooks/
    └── useProgressMetrics.ts  # NEW: Computed metrics hook (memoized)
```

**Structure Decision**: Follows existing single-project web app structure. New dashboard components placed in `components/dashboard/` subdirectory to group related UI. Stats logic in dedicated `statsStore.ts` to separate concerns from vocab data.

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
