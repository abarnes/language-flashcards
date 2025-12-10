# Tasks: Project Setup & Core Infrastructure

**Input**: Design documents from `/specs/001-project-setup/`
**Prerequisites**: None (foundational)

## Phase 1: Setup (Project Initialization)

**Purpose**: Create Vite project and configure build tools

- [x] T001 Initialize Vite project with React + TypeScript template
- [x] T002 Configure TypeScript with strict mode in tsconfig.json
- [x] T003 [P] Install and configure Tailwind CSS
- [x] T004 [P] Install and configure ESLint for TypeScript/React

**Checkpoint**: `npm run dev` starts successfully

---

## Phase 2: UI Foundation (ShadCN + Routing)

**Purpose**: Set up component library and navigation

- [x] T005 Initialize ShadCN UI with default configuration
- [x] T006 [P] Add core ShadCN components: Button, Card, Input, Dialog
- [x] T007 [P] Install React Router 6
- [x] T008 Create App.tsx with router configuration and 4 routes
- [x] T009 [P] Create placeholder page components (Dashboard, ListDetail, Study, Settings)
- [x] T010 Create responsive layout shell with navigation

**Checkpoint**: All routes navigate correctly with consistent layout

---

## Phase 3: State & Types (Zustand + Interfaces)

**Purpose**: Establish state management and type definitions

- [x] T011 Install Zustand
- [x] T012 Create core type definitions in src/types/index.ts
- [x] T013 Create placeholder Zustand stores structure
- [x] T014 Set up lib/utils.ts with ShadCN cn() utility

**Checkpoint**: Types importable, stores accessible, ready for feature implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: No dependencies - start immediately
- **Phase 2**: Depends on Phase 1 completion
- **Phase 3**: Depends on Phase 2 completion (routing needed for page components)

### Parallel Opportunities

- T003 and T004 can run in parallel (independent config files)
- T006 and T007 can run in parallel (independent installations)
- T009 can run in parallel once T008 creates router structure

---

## Notes

- All tasks are foundational - no user stories yet
- Commit after each phase
- Verify `npm run build` passes before moving to next spec
