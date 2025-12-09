# Feature Specification: Tagging System

**Feature Branch**: `005-tagging`
**Created**: 2025-12-09
**Status**: Draft
**Input**: Tagging for vocabulary lists and individual flashcards with filtering

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add Tags to a Vocabulary List (Priority: P1)

A user adds tags to a vocabulary list (e.g., "Chapter 3", "Food", "Verbs") to organize their content on the Dashboard.

**Why this priority**: List-level tags are fundamental for organization and filtering.

**Independent Test**: Add tags to a list, verify tags display on list card, verify tags persist.

**Acceptance Scenarios**:

1. **Given** I'm editing a list, **When** I add a tag, **Then** the tag appears on the list
2. **Given** I add a tag, **When** I return to Dashboard, **Then** the tag shows on the list card
3. **Given** I type a tag name, **When** similar tags exist, **Then** I see autocomplete suggestions

---

### User Story 2 - Add Tags to Individual Flashcards (Priority: P1)

A user adds tags to individual flashcards within a list to categorize mixed content (e.g., marking some as "verb", others as "noun").

**Why this priority**: Flashcard-level tags enable granular filtering during study.

**Independent Test**: Add tag to flashcard, verify tag displays in table, verify it's filterable.

**Acceptance Scenarios**:

1. **Given** I'm on List Detail, **When** I add a tag to a flashcard, **Then** the tag appears on that card
2. **Given** multiple flashcards have tags, **When** I view the list, **Then** I see tags in the table
3. **Given** I type a tag, **When** that tag exists elsewhere, **Then** autocomplete suggests it

---

### User Story 3 - Filter Dashboard by Tags (Priority: P1)

A user filters the Dashboard to show only lists that have a specific tag.

**Why this priority**: Core organization feature for users with many lists.

**Independent Test**: Create lists with different tags, filter by one tag, verify only matching lists shown.

**Acceptance Scenarios**:

1. **Given** I'm on Dashboard, **When** I select a tag filter, **Then** only lists with that tag are shown
2. **Given** I have a filter active, **When** I clear it, **Then** all lists are shown again
3. **Given** no lists match my filter, **When** filtering, **Then** I see an empty state message

---

### User Story 4 - Filter Flashcards by Tags Within a List (Priority: P2)

A user filters flashcards within a list to show only cards with specific tags.

**Why this priority**: Useful for focused review but less critical than list filtering.

**Independent Test**: Tag some flashcards in a list, filter by tag, verify only matching cards shown.

**Acceptance Scenarios**:

1. **Given** I'm on List Detail, **When** I select a tag filter, **Then** only flashcards with that tag are shown
2. **Given** I filter flashcards, **When** I clear filter, **Then** all flashcards are shown
3. **Given** flashcards are filtered, **When** I count them, **Then** count reflects filtered results

---

### User Story 5 - Remove Tags (Priority: P2)

A user removes tags from lists or flashcards when reorganizing content.

**Why this priority**: Maintenance feature for organization.

**Independent Test**: Remove a tag from a list and a flashcard, verify removal persists.

**Acceptance Scenarios**:

1. **Given** a list has tags, **When** I remove a tag, **Then** it's no longer on the list
2. **Given** a flashcard has tags, **When** I remove a tag, **Then** it's no longer on the flashcard
3. **Given** I remove the last tag, **When** viewing the entity, **Then** it shows no tags

---

### User Story 6 - Tag Autocomplete Across All Content (Priority: P2)

When typing a tag, the system suggests existing tags from anywhere in the user's data to encourage consistent naming.

**Why this priority**: UX improvement for consistency but not blocking.

**Independent Test**: Create tags on different lists, when adding new tag elsewhere, verify suggestions appear.

**Acceptance Scenarios**:

1. **Given** I start typing a tag, **When** matching tags exist, **Then** suggestions appear
2. **Given** suggestions appear, **When** I click one, **Then** the tag is applied
3. **Given** I type a new tag, **When** no matches exist, **Then** I can create it by pressing Enter

---

### Edge Cases

- What if a tag is very long? Truncate display, show full on hover (max length?)
- What if user creates hundreds of tags? Consider tag management/cleanup feature post-MVP
- Case sensitivity: "Verbs" vs "verbs"? (Recommend: case-insensitive matching, preserve original case)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Lists MUST support multiple tags stored in `tags[]` array
- **FR-002**: Flashcards MUST support multiple tags stored in `tags[]` array
- **FR-003**: Dashboard MUST provide tag filter dropdown/chips showing all list-level tags
- **FR-004**: List Detail MUST provide tag filter for flashcard-level tags
- **FR-005**: Tag input MUST provide autocomplete from existing tags across all data
- **FR-006**: Users MUST be able to remove tags from lists and flashcards
- **FR-007**: Tags MUST be case-insensitive for matching (e.g., "Verb" matches "verb" suggestions)
- **FR-008**: Tag display MUST preserve original case as entered
- **FR-009**: System MUST support multi-tag filtering [NEEDS CLARIFICATION: AND or OR logic? User toggle?]
- **FR-010**: Tag changes MUST persist immediately to LocalStorage

### Key Entities

- **VocabList.tags**: string[] - list-level tags
- **Flashcard.tags**: string[] - flashcard-level tags
- **TagIndex** (optional): Computed index mapping tags to list/flashcard IDs for faster filtering

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Tag autocomplete appears within 100ms of typing
- **SC-002**: Filtering by tag updates display within 200ms
- **SC-003**: Tag operations persist across browser sessions
- **SC-004**: System handles 100+ unique tags without performance degradation

## Open Questions

1. **Multi-Tag Filter Logic**: When filtering by multiple tags, should it be AND (all tags match) or OR (any tag matches)? Or user-selectable?
2. **Tag Limit**: Should there be a maximum number of tags per list/flashcard? (Recommend: No limit for MVP)
3. **Tag Length**: What's the maximum character length for a tag? (Recommend: 50 characters)
4. **Tag Management**: Should there be a dedicated tag management page to rename/delete tags globally? (Recommend: Post-MVP)
5. **Tag Colors**: Should tags have colors for visual distinction? (Recommend: Post-MVP, single color for MVP)
6. **Study Mode Tag Filtering**: Should tag filtering in study mode pull from both list AND flashcard tags? (Recommend: Yes)
