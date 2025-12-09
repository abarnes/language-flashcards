# Feature Specification: Project Setup & Core Infrastructure

**Feature Branch**: `001-project-setup`
**Created**: 2025-12-09
**Status**: Draft
**Input**: Initialize React project with all core dependencies and routing structure

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Runs the App (Priority: P1)

A developer clones the repo and runs `npm install && npm run dev` to start the development server. They see a working application shell with navigation.

**Why this priority**: Without a working dev environment, no other features can be built.

**Independent Test**: Run `npm run dev`, navigate to localhost, see the app shell with working routes.

**Acceptance Scenarios**:

1. **Given** a fresh clone of the repo, **When** I run `npm install && npm run dev`, **Then** the dev server starts without errors
2. **Given** the dev server is running, **When** I visit `http://localhost:5173`, **Then** I see the Dashboard page
3. **Given** the app is loaded, **When** I click navigation links, **Then** I'm routed to the correct pages

---

### User Story 2 - Type-Safe Development (Priority: P1)

A developer writes code with full TypeScript support, including strict mode and proper IDE autocomplete.

**Why this priority**: Type safety is a core principle; must be established from the start.

**Independent Test**: Run `npx tsc --noEmit` with no errors; IDE shows type hints for all core interfaces.

**Acceptance Scenarios**:

1. **Given** the project is set up, **When** I run `npx tsc --noEmit`, **Then** there are no TypeScript errors
2. **Given** I import `VocabList` from types, **When** I use it in a component, **Then** IDE provides full autocomplete

---

### User Story 3 - Styled Components Ready (Priority: P1)

A developer can use ShadCN UI components with Tailwind styling immediately.

**Why this priority**: Component library foundation needed before building features.

**Independent Test**: Import and render a ShadCN Button with Tailwind classes; it displays correctly.

**Acceptance Scenarios**:

1. **Given** ShadCN is configured, **When** I add a Button component, **Then** it renders with correct styles
2. **Given** Tailwind is configured, **When** I add utility classes, **Then** styles apply correctly

---

### Edge Cases

- What happens if Node version is incompatible? (Document minimum Node version in README)
- What happens if port 5173 is in use? (Vite auto-increments port)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Project MUST use Vite as the build tool with React and TypeScript templates
- **FR-002**: TypeScript MUST be configured with strict mode enabled
- **FR-003**: Project MUST include Tailwind CSS configured with ShadCN compatible settings
- **FR-004**: Project MUST include ShadCN UI initialized with at least Button component
- **FR-005**: Project MUST include React Router with routes for: Dashboard (`/`), List Detail (`/list/:id`), Study (`/study`), Settings (`/settings`)
- **FR-006**: Project MUST include Zustand for state management
- **FR-007**: Project MUST have core type definitions for VocabList, Flashcard, and Settings interfaces
- **FR-008**: Project MUST have a responsive layout shell with navigation between routes
- **FR-009**: ESLint MUST be configured for TypeScript and React

### Key Entities

- **VocabList**: Core entity for vocabulary collections (id, name, createdAt, tags, flashcards)
- **Flashcard**: Individual vocabulary item with source/target words and metadata
- **Settings**: Application configuration (apiKey, sourceLang, targetLang, keepImages)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `npm run dev` starts successfully in under 5 seconds
- **SC-002**: `npm run build` completes without errors
- **SC-003**: `npx tsc --noEmit` passes with zero errors
- **SC-004**: All 4 routes render without errors
- **SC-005**: Lighthouse accessibility score > 90 on initial shell
