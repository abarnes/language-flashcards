# Language Flashcards - Claude Code Guide

## Project Overview

A browser-based React application for language learning that extracts vocabulary from textbook photos using Gemini API and converts them into editable flashcards. All data is stored locally—no backend required.

## Quick Reference

### Tech Stack
- **Framework**: React 18+ with TypeScript (strict mode)
- **Build**: Vite
- **Styling**: Tailwind CSS + ShadCN UI
- **Routing**: React Router 6+
- **State**: Zustand
- **Storage**: LocalStorage (MVP), IndexedDB (future)
- **AI**: Gemini API (user-provided key)

### Project Structure
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

## Core Data Types

```typescript
interface VocabList {
  id: string;
  name: string;
  createdAt: number;
  tags: string[];
  flashcards: Flashcard[];
}

interface Flashcard {
  id: string;
  source: string;
  target: string;
  gender?: string;
  partOfSpeech?: string;
  example?: string;
  notes?: string;
  tags: string[];
  lastReviewed?: number;
  interval?: number;
  easeFactor?: number;
}

interface Settings {
  apiKey: string;
  sourceLang: string;
  targetLang: string;
  keepImages: boolean;
}
```

## Key Principles (from Constitution)

1. **Privacy-First**: All data stays local. No backend, no telemetry.
2. **AI-Assisted, User-Controlled**: Gemini extracts vocabulary, but user always reviews before saving.
3. **Progressive Enhancement**: MVP with LocalStorage; design for future IndexedDB/SRS upgrades.
4. **Component-Based**: ShadCN UI components, Zustand for state, Tailwind for styling.
5. **Type Safety**: Strict TypeScript, Zod for runtime validation, no `any`.
6. **Simplicity**: YAGNI, minimal abstraction, avoid dependency bloat.

## Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Type checking
npx tsc --noEmit     # Check types without emitting
```

## Key Files

| File | Purpose |
|------|---------|
| `docs/REQUIREMENTS.md` | Full requirements document |
| `.specify/memory/constitution.md` | Project principles and governance |
| `src/types/index.ts` | Core TypeScript interfaces |
| `src/stores/` | Zustand state stores |
| `src/services/gemini.ts` | Gemini API integration |

## Pages/Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | List all vocab lists, filter by tag, upload CTA |
| `/list/:id` | List Detail | View/edit flashcards in a list |
| `/study` | Study | Flashcard UI with mode selector |
| `/settings` | Settings | API key, languages, import/export |

## Development Guidelines

### Adding Components
1. Use ShadCN UI as foundation (`npx shadcn-ui@latest add <component>`)
2. Place in `components/ui/` for primitives, `components/` for domain-specific
3. Keep components under ~200 lines; split if larger

### State Management
- Global state: Zustand stores in `src/stores/`
- Component state: React useState/useReducer
- No prop drilling—use stores for shared state

### Styling
- Tailwind utility classes only
- No custom CSS files unless absolutely necessary
- Follow ShadCN patterns for variants

### Type Safety
- Define interfaces in `src/types/`
- Validate external data (API responses) with Zod
- Never use `any` without documented justification

## MVP Scope

**Included:**
- Upload image → extract vocab → edit → save
- Multiple vocab lists with tags
- Flashcard + reverse study modes
- Settings with API key
- JSON export/import
- LocalStorage persistence

**Excluded (Post-MVP):**
- Webcam capture
- Spaced repetition (SRS)
- UI themes
- Cloud sync
