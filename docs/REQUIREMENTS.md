# AI-Powered Vocabulary Flashcard Web App — Requirements Document

## 1. Project Overview

This project is a browser-based React application that helps users learn a new language by extracting vocabulary from uploaded textbook photos (via Gemini API) and converting them into editable flashcards. Data is stored locally as JSON; no backend or login system is used.

A key organizational feature is tagging vocabulary lists and individual flashcards (e.g., "Chapter 3", "verbs", "food", "colors") to enable filtering and flexible study modes.

The application emphasizes simplicity, privacy, and fast iteration.

## 2. User Roles

**Language Learner** (default; no user accounts)

All data remains local to the browser.

## 3. Core Features

### 3.1 Vocabulary Extraction from Images

- Users upload images (JPG, PNG, HEIC, PDF pages, etc.).
- Users must enter their Gemini API key through a Settings page.
- The app sends images to Gemini with instructions to extract vocabulary pairs for a selected language direction.
- The extraction result is returned as structured JSON.
- The user can review/edit before saving.

### 3.2 Flashcard Generation

- Flashcards automatically generated from extracted entries.
- Each flashcard contains:
  - Source word
  - Target word
  - Optional metadata: gender, part of speech, example sentence
  - User-created tags (e.g., "verb", "chapter 2")
- All flashcards are editable manually.

### 3.3 Tagging System

#### List-Level Tags

- Each vocabulary list can have one or more tags (e.g., "Chapter 4", "Food Unit", "Adjectives").
- Tags help organize lists in the dashboard.

#### Flashcard-Level Tags

- Individual flashcards can also have tags.
- Useful when one list contains mixed content (verbs, nouns, phrases).
- Tag editor available on Flashcard or List Detail page.

#### Tag Browsing & Filtering

- Users can filter lists or study sessions by tags (*both list and flashcard tags*).
- Tag suggestions auto-populate from existing tags.

### 3.4 Local Storage

- All data stored locally as JSON using:
  - LocalStorage (MVP)
  - IndexedDB (optional upgrade)
- Users can export their full dataset as .json and re-import later.

### 3.5 Vocabulary List Management

- Create, rename, delete lists.
- Merge lists.
- Apply tags to lists.
- View/edit flashcards inside a list.
- Import/export entire database or individual lists.

### 3.6 Study Modes

**Flashcard Mode**
- Flip cards, mark known/unknown.

**Reverse Mode**
- Target → Source.

**Multiple Choice Mode** (optional)

**Tag-Filtered Study Sessions**
- e.g., "Study all cards tagged 'verbs' from any list."

### 3.7 Image History

- Optional toggle to keep uploaded images.
- Re-run extraction on previous images.

### 3.8 Settings

- Gemini API key input + validation.
- Source language / target language selection.
- Toggle for retaining uploaded images.

## 4. Nice-to-Have (Not in MVP)

- Camera capture (webcam/mobile)
- Spaced repetition (SM-2)
- UI themes
- Cloud sync (e.g., Google Drive)

(Local model extraction, OCR preprocessing, and pronunciation audio have been removed per updated scope.)

## 5. Data Structures

### Vocabulary List

```typescript
interface VocabList {
  id: string;
  name: string;
  createdAt: number;
  tags: string[];            // list-level tags
  flashcards: Flashcard[];
}
```

### Flashcard

```typescript
interface Flashcard {
  id: string;
  source: string;
  target: string;
  gender?: string;
  partOfSpeech?: string;
  example?: string;
  notes?: string;
  tags: string[];            // flashcard-level tags
  lastReviewed?: number;
  interval?: number;
  easeFactor?: number;
}
```

### Settings

```typescript
interface Settings {
  apiKey: string;
  sourceLang: string;
  targetLang: string;
  keepImages: boolean;
}
```

### Tag Index (optional helper)

```typescript
interface TagIndex {
  [tag: string]: {
    lists: string[];       // list IDs
    flashcards: string[];  // flashcard IDs
  };
}
```

## 6. UI / UX Requirements

### 6.1 Pages

**Home / Dashboard**
- Shows all vocab lists with list-level tags.
- Filter lists by tag.
- Upload image CTA.

**List Detail Page**
- Table/grid of flashcards.
- Add/edit/delete cards.
- Apply tags to flashcards.
- Tag-based filtering inside the list.

**Study Page**
- Flashcard UI.
- Mode selector.
- Tag selector to filter study set.

**Settings Page**
- API key input.
- Language selection.
- Data import/export.
- Toggle "keep images."

**Image History Page** (optional)
- Thumbnails of previously uploaded images.
- Button to re-run extraction.

### 6.2 Key Components

- ImageUploader
- TagEditor (for lists and flashcards)
- Flashcard component (flip animation)
- ListCard (dashboard)
- EditableFlashcardTable
- StudyModeSelector
- SettingsPanel
- ImportExportDialog

## 7. AI Integration

### 7.1 Gemini API

- User provides their own API key.
- Requests include:
  - Base64-encoded image
  - System prompt with extraction rules
  - Language pair context

### 7.2 Prompt Template

```
You are parsing vocabulary lists from textbook pages.

Extract all vocabulary entries for the language pair:
SOURCE_LANG → TARGET_LANG.

Return JSON ONLY using the schema:
[
  {
    "source": "...",
    "target": "...",
    "gender": "...",
    "partOfSpeech": "...",
    "example": "...",
    "notes": ""
  }
]

Ignore headings, numbering, unrelated text, example sentences unless they directly illustrate the vocabulary word, and any non-vocabulary content.
Do not include explanations or comments.
```

### 7.3 Error Handling

- Retry on transient failures.
- Show raw model output when parsing fails.
- Allow user to edit AI output before saving.

## 8. Security & Privacy

- No backend service.
- All data stored locally on the device.
- Gemini API key stored locally only.
- Images retained only if the user enables "keep images."

## 9. Technical Stack

- React + TypeScript
- Vite
- Tailwind CSS
- ShadCN UI components
- React Router
- State management:
  - Lightweight: Zustand (recommended)
  - Or React Context

## 10. MVP Scope

### Included

- Upload image → extract vocab → edit → save
- Create multiple vocab lists
- Apply/manage tags (list + flashcard)
- Basic flashcard mode + reverse mode
- Settings page with API key
- JSON export/import
- LocalStorage persistence

### Excluded (Post-MVP)

- Webcam capture
- SRS
- OCR/local models
- Audio
- Cloud sync

## 11. Example Prompts for AI-Assisted Development

### 11.1 Project Scaffold

"Create a Vite + React + TypeScript project with Tailwind, Zustand, and ShadCN set up, along with routes for Dashboard, List Detail, Study, Settings, and Image Upload."

### 11.2 Data Layer

"Generate TypeScript services for managing vocabulary lists, flashcards, tags, and settings in LocalStorage, using the provided interfaces."

### 11.3 Components

"Generate a ShadCN-based TagEditor component that supports adding/removing tags with autocomplete from existing tags."

### 11.4 Gemini API Integration

"Write a function extractVocabFromImage(apiKey, base64Image, sourceLang, targetLang) that uses the Gemini API and normalizes the output."
