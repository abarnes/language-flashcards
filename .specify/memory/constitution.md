<!--
SYNC IMPACT REPORT
==================
Version change: 0.0.0 → 1.0.0
Bump rationale: Initial constitution creation (MAJOR)

Modified principles: N/A (initial creation)
Added sections:
  - Core Principles (6 principles)
  - Technology Stack
  - Development Workflow
  - Governance
Removed sections: N/A

Templates requiring updates:
  ✅ .specify/templates/plan-template.md - Compatible (Constitution Check section exists)
  ✅ .specify/templates/spec-template.md - Compatible (no changes needed)
  ✅ .specify/templates/tasks-template.md - Compatible (no changes needed)

Follow-up TODOs: None
-->

# Language Flashcards Constitution

## Core Principles

### I. Privacy-First Local Storage

All user data MUST remain on the user's device. No backend servers, no user accounts, no telemetry.

- All vocabulary lists, flashcards, settings, and images MUST be stored locally using browser storage APIs
- LocalStorage is the MVP persistence layer; IndexedDB may be used for larger datasets
- Users MUST have full control over their data via export/import functionality
- Gemini API keys MUST be stored locally only and never transmitted to any service other than Google's API
- Images MUST only be retained if the user explicitly enables the "keep images" setting

### II. AI-Assisted but User-Controlled

AI extracts vocabulary from images, but humans always have final say before data is saved.

- Gemini API responses MUST be presented for user review before saving to storage
- Users MUST be able to edit, add, or remove extracted vocabulary entries before confirmation
- Raw AI output MUST be displayed when JSON parsing fails, allowing manual correction
- AI extraction is a suggestion tool, not an authoritative source
- Error states MUST be recoverable—users can retry or manually input data

### III. Progressive Enhancement

Start with MVP features using simple implementations; design architecture to support future upgrades.

- MVP uses LocalStorage; architecture MUST allow migration to IndexedDB without data loss
- Data structures MUST include optional fields for future features (e.g., SRS fields on Flashcard)
- Component interfaces MUST be designed for extensibility (e.g., StudyMode as a pattern, not hardcoded modes)
- Post-MVP features (SRS, cloud sync, themes) MUST NOT require breaking changes to core data models
- Feature flags or conditional rendering may be used to gate incomplete features during development

### IV. Component-Based Architecture

UI is built from composable, reusable React components following ShadCN patterns.

- All UI elements MUST use ShadCN UI components as the foundation
- Custom components MUST follow ShadCN composition patterns (variants, slots, compound components)
- Components MUST be organized by domain: `components/ui/` for primitives, `components/` for domain-specific
- Pages MUST be thin orchestrators that compose domain components
- State MUST flow predictably: Zustand stores for global state, props for component-local data
- Styling MUST use Tailwind CSS utility classes; no custom CSS files unless absolutely necessary

### V. Type Safety

TypeScript provides compile-time guarantees for data integrity across the application.

- All code MUST be written in TypeScript with strict mode enabled
- Core data interfaces (VocabList, Flashcard, Settings) MUST be defined in a shared `types/` directory
- API responses MUST be validated at runtime using schema validation (e.g., Zod)
- Component props MUST have explicit TypeScript interfaces
- `any` type is prohibited except in exceptional circumstances with documented justification
- Generic types SHOULD be used for reusable utilities and hooks

### VI. Simplicity Over Complexity

Build only what's needed. Avoid premature abstraction and over-engineering.

- YAGNI: Do not implement features until they are explicitly required
- Prefer inline logic over abstraction until a pattern repeats 3+ times
- One component per file; split only when a component exceeds ~200 lines
- No unnecessary layers: direct Zustand store access is preferred over wrapper hooks unless reuse is proven
- Avoid dependency bloat: evaluate necessity before adding any npm package
- Code comments explain "why," not "what"—self-documenting code is the goal

## Technology Stack

The following technologies are mandated for this project:

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | React 18+ | Functional components, hooks only |
| Language | TypeScript 5+ | Strict mode enabled |
| Build | Vite | Fast HMR, ESM-native |
| Styling | Tailwind CSS | Utility-first, no custom CSS |
| Components | ShadCN UI | Copy-paste components, full control |
| Routing | React Router 6+ | Client-side routing |
| State | Zustand | Lightweight, no boilerplate |
| Storage | LocalStorage (MVP) | IndexedDB for future scale |
| AI | Gemini API | User-provided API key |

## Development Workflow

### File Organization

```
src/
├── components/          # Domain-specific components
│   └── ui/             # ShadCN primitives
├── pages/              # Route page components
├── stores/             # Zustand stores
├── services/           # Business logic, API calls
├── types/              # TypeScript interfaces
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── App.tsx             # Root component with router
```

### Code Quality Gates

- TypeScript compilation MUST pass with no errors
- ESLint MUST pass with no warnings (rules TBD based on team preference)
- Components SHOULD be tested if they contain complex logic
- Manual testing of user flows is acceptable for MVP

### Commit Standards

- Commits SHOULD be atomic and focused on a single change
- Commit messages SHOULD follow conventional commits format (feat:, fix:, docs:, etc.)

## Governance

This constitution establishes the foundational principles for the Language Flashcards application.

- Constitution principles MUST be verified during code review
- Violations require explicit justification and team approval
- Amendments to this constitution require:
  1. Written proposal with rationale
  2. Impact assessment on existing code
  3. Version increment following semver rules

**Version**: 1.0.0 | **Ratified**: 2025-12-09 | **Last Amended**: 2025-12-09
