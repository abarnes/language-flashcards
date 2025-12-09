# Feature Specification: Vocabulary List Management

**Feature Branch**: `003-vocab-lists`
**Created**: 2025-12-09
**Status**: Draft
**Input**: CRUD operations for vocabulary lists and the dashboard view

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View All Lists on Dashboard (Priority: P1)

A user opens the app and sees all their vocabulary lists displayed as cards on the Dashboard, with list names and tags visible.

**Why this priority**: Dashboard is the entry point; users need to see their data immediately.

**Independent Test**: Create a list manually in LocalStorage, load app, verify list appears on Dashboard.

**Acceptance Scenarios**:

1. **Given** I have vocabulary lists saved, **When** I open the Dashboard, **Then** I see all lists as cards
2. **Given** I have no lists, **When** I open the Dashboard, **Then** I see an empty state with prompt to create or upload
3. **Given** a list has tags, **When** I view the Dashboard, **Then** tags are displayed on the list card

---

### User Story 2 - Create a New List (Priority: P1)

A user creates a new empty vocabulary list from the Dashboard to manually add flashcards.

**Why this priority**: Users need to create lists before they can add cards (alternative to AI extraction).

**Independent Test**: Click "New List", enter name, verify list appears on Dashboard and persists.

**Acceptance Scenarios**:

1. **Given** I'm on the Dashboard, **When** I click "New List" and enter a name, **Then** a new list is created
2. **Given** I create a list, **When** I refresh the page, **Then** the list persists
3. **Given** I try to create a list with no name, **When** I submit, **Then** I see a validation error

---

### User Story 3 - View List Details (Priority: P1)

A user clicks on a list to view all flashcards within it, displayed in an editable table/grid format.

**Why this priority**: Core functionality—users need to see and work with their flashcards.

**Independent Test**: Navigate to list detail page, verify all flashcards are displayed with source/target words.

**Acceptance Scenarios**:

1. **Given** I click on a list, **When** the List Detail page loads, **Then** I see all flashcards in a table
2. **Given** a list has no flashcards, **When** I view it, **Then** I see an empty state with add card prompt
3. **Given** I'm on List Detail, **When** I click a flashcard row, **Then** I can edit it inline [NEEDS CLARIFICATION: Inline edit or modal?]

---

### User Story 4 - Rename a List (Priority: P2)

A user renames an existing vocabulary list to better organize their content.

**Why this priority**: Organization feature, not blocking for core workflow.

**Independent Test**: Rename a list, verify name updates in Dashboard and persists.

**Acceptance Scenarios**:

1. **Given** I'm viewing a list, **When** I click the rename option and enter a new name, **Then** the list name updates
2. **Given** I rename a list, **When** I return to Dashboard, **Then** the new name is shown

---

### User Story 5 - Delete a List (Priority: P2)

A user deletes a vocabulary list they no longer need.

**Why this priority**: Cleanup feature, not blocking but important for usability.

**Independent Test**: Delete a list, verify it's removed from Dashboard and LocalStorage.

**Acceptance Scenarios**:

1. **Given** I want to delete a list, **When** I click delete and confirm, **Then** the list is removed
2. **Given** I delete a list, **When** I refresh, **Then** it's permanently gone
3. **Given** I click delete, **When** the confirmation appears, **Then** I can cancel without deleting

---

### User Story 6 - Merge Lists (Priority: P3)

A user combines two vocabulary lists into one, useful when reorganizing content.

**Why this priority**: Advanced organization feature; can be deferred to post-MVP if needed.

**Independent Test**: Select two lists, merge, verify combined flashcards in single list.

**Acceptance Scenarios**:

1. **Given** I have two lists, **When** I select merge and choose a target, **Then** flashcards are combined
2. **Given** I merge lists, **When** complete, **Then** the source list is deleted [NEEDS CLARIFICATION: Or keep both?]
3. **Given** lists have overlapping flashcards, **When** merged, **Then** [NEEDS CLARIFICATION: Deduplicate or keep duplicates?]

---

### Edge Cases

- What if a list name already exists? (Allow duplicates—use ID for uniqueness)
- What is the maximum number of lists? (No hard limit for MVP; warn at 100+ for LocalStorage concerns)
- What is the maximum flashcards per list? (No hard limit; recommend splitting large lists)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Dashboard MUST display all vocabulary lists as cards with name and tags
- **FR-002**: Dashboard MUST show empty state when no lists exist
- **FR-003**: Users MUST be able to create a new list with a name
- **FR-004**: List names MUST be non-empty strings
- **FR-005**: Users MUST be able to navigate to List Detail page by clicking a list
- **FR-006**: List Detail MUST show all flashcards in editable table format
- **FR-007**: Users MUST be able to rename a list
- **FR-008**: Users MUST be able to delete a list with confirmation dialog
- **FR-009**: All list operations MUST persist to LocalStorage immediately
- **FR-010**: Lists MUST be sorted by [NEEDS CLARIFICATION: createdAt desc? alphabetical? user choice?]

### Key Entities

- **VocabList**: id, name, createdAt, tags[], flashcards[]

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dashboard loads and displays 50 lists in under 1 second
- **SC-002**: Create/rename/delete operations complete in under 200ms
- **SC-003**: List Detail page displays 200 flashcards without pagination in under 1 second
- **SC-004**: All CRUD operations persist across browser sessions

## Open Questions

1. **Inline vs Modal Edit**: Should flashcard editing be inline in the table or open a modal?
2. **Merge Behavior**: When merging lists, should the source list be deleted or kept?
3. **Duplicate Handling**: When merging, should duplicate flashcards be detected and handled?
4. **List Sorting**: How should lists be sorted on Dashboard? Created date, alphabetical, last modified, or user choice?
5. **List Card Info**: What info should display on list cards? (Name, tag count, flashcard count, last studied?)
