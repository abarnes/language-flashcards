# Feature Specification: Study Modes

**Feature Branch**: `006-study-modes`
**Created**: 2025-12-09
**Status**: Draft
**Input**: Flashcard study interface with multiple modes and tag filtering

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Flashcard Study (Priority: P1)

A user studies vocabulary by flipping flashcards one at a time, seeing source word first, then revealing target word.

**Why this priority**: Core learning feature—this is what users are here for.

**Independent Test**: Start study session, see first card (source), flip to reveal target, navigate to next card.

**Acceptance Scenarios**:

1. **Given** I start a study session, **When** the first card loads, **Then** I see only the source word
2. **Given** I see a card, **When** I click/tap to flip, **Then** the target word is revealed (with animation)
3. **Given** I've flipped a card, **When** I click "Next", **Then** I advance to the next card
4. **Given** I'm on the last card, **When** I click "Next", **Then** [NEEDS CLARIFICATION: Loop to start? Show completion screen? End session?]

---

### User Story 2 - Reverse Mode Study (Priority: P1)

A user studies in reverse mode, seeing the target word first and recalling the source word.

**Why this priority**: Essential for bidirectional learning; tests recall in both directions.

**Independent Test**: Select reverse mode, start session, verify target word shown first.

**Acceptance Scenarios**:

1. **Given** I select "Reverse Mode", **When** study starts, **Then** I see the target word first
2. **Given** I flip a card in reverse mode, **When** revealed, **Then** I see the source word
3. **Given** I switch between modes, **When** I restart study, **Then** the correct side is shown first

---

### User Story 3 - Study with Tag Filter (Priority: P1)

A user filters their study session by tags to focus on specific vocabulary (e.g., only "verbs" or only "Chapter 2").

**Why this priority**: Key organizational feature enabling focused study sessions.

**Independent Test**: Select tag filter, start study, verify only matching cards appear.

**Acceptance Scenarios**:

1. **Given** I'm on Study page, **When** I select a tag filter, **Then** only flashcards with that tag are included
2. **Given** I filter by tag, **When** I see card count, **Then** it reflects filtered set size
3. **Given** no cards match my tag filter, **When** I try to study, **Then** I see a message saying no cards match

---

### User Story 4 - Mark Cards as Known/Unknown (Priority: P2)

A user marks each card as "Known" or "Unknown" during study to track progress within a session.

**Why this priority**: Immediate feedback loop for learning; foundation for future SRS.

**Independent Test**: Study cards, mark some known, mark some unknown, verify counts update.

**Acceptance Scenarios**:

1. **Given** I've flipped a card, **When** I mark it "Known", **Then** known count increases
2. **Given** I've flipped a card, **When** I mark it "Unknown", **Then** unknown count increases
3. **Given** I finish a session, **When** I see summary, **Then** I see known/unknown breakdown
4. **Given** I mark a card, **When** I move to next, **Then** [NEEDS CLARIFICATION: Store result? Or session-only?]

---

### User Story 5 - Study from Specific List (Priority: P2)

A user starts a study session from a specific vocabulary list rather than from all cards.

**Why this priority**: Most users will want to study one list at a time.

**Independent Test**: Open list, click "Study this list", verify only that list's cards appear.

**Acceptance Scenarios**:

1. **Given** I'm on List Detail, **When** I click "Study", **Then** study session starts with only that list's cards
2. **Given** I'm studying a list, **When** I apply tag filter, **Then** it filters within that list only
3. **Given** I started from a list, **When** I view session info, **Then** I see which list I'm studying

---

### User Story 6 - Study Across All Lists (Priority: P2)

A user studies all flashcards across all lists, optionally filtered by tag.

**Why this priority**: Useful for cumulative review sessions.

**Independent Test**: Start study from Dashboard without list selection, verify all cards available.

**Acceptance Scenarios**:

1. **Given** I'm on Dashboard, **When** I click "Study All", **Then** all flashcards from all lists are included
2. **Given** I'm studying all lists, **When** I filter by tag, **Then** matching cards from any list are included
3. **Given** I have multiple lists, **When** studying all, **Then** I can see which list each card belongs to [NEEDS CLARIFICATION: Show list name during study?]

---

### User Story 7 - Shuffle Cards (Priority: P3)

A user can shuffle the card order for varied study sessions.

**Why this priority**: Nice-to-have for learning variety, not blocking.

**Independent Test**: Start session, note order, enable shuffle, restart—verify different order.

**Acceptance Scenarios**:

1. **Given** shuffle is enabled, **When** I start study, **Then** cards appear in random order
2. **Given** shuffle is disabled, **When** I start study, **Then** cards appear in [NEEDS CLARIFICATION: Creation order? Alphabetical?]

---

### Edge Cases

- What if a list has 0 cards? Show message "No flashcards to study"
- What if user closes mid-session? Session progress is lost (acceptable for MVP)
- What happens at end of deck? Show completion summary with option to restart

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Study page MUST display flashcards one at a time with flip interaction
- **FR-002**: Flashcard MUST show source word initially, reveal target word on flip
- **FR-003**: System MUST support "Reverse Mode" showing target first, revealing source
- **FR-004**: Study sessions MUST support tag-based filtering (both list and flashcard tags)
- **FR-005**: Users MUST be able to navigate forward through cards (Previous is optional)
- **FR-006**: Users MUST be able to mark cards as Known/Unknown during session
- **FR-007**: System MUST show session progress (e.g., "Card 5 of 23")
- **FR-008**: System MUST show session summary at completion with Known/Unknown counts
- **FR-009**: Study sessions MAY be started from Dashboard (all lists) or List Detail (single list)
- **FR-010**: Flip animation MUST be smooth (recommend: 300-400ms CSS transition)
- **FR-011**: System SHOULD support optional card shuffling

### Key Entities

- **StudySession** (in-memory): mode, sourceListId?, tagFilters[], currentCardIndex, knownCount, unknownCount
- **Flashcard**: existing entity being studied

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Card flip animation completes in under 400ms
- **SC-002**: Navigation between cards is instantaneous (<100ms)
- **SC-003**: Study session with 500 cards loads in under 1 second
- **SC-004**: Touch gestures work reliably on mobile (swipe to flip optional, tap required)

## Open Questions

1. **End of Deck Behavior**: At the end of a study session, should it loop, show summary, or offer to restart?
2. **Known/Unknown Persistence**: Should known/unknown marks persist beyond the session, or are they session-only? (Note: Full SRS is post-MVP)
3. **Default Card Order**: When shuffle is off, what order should cards appear? Creation order, alphabetical by source, or list order?
4. **Previous Card Navigation**: Should users be able to go back to previous cards, or only forward?
5. **Show List Name**: When studying across multiple lists, should the current card's list name be displayed?
6. **Keyboard Shortcuts**: Should there be keyboard shortcuts for flip (Space), next (→), known (K), unknown (U)?
7. **Mobile Gestures**: Should swipe left/right navigate cards? Tap to flip?
