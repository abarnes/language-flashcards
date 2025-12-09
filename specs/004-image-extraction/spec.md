# Feature Specification: Image Upload & AI Vocabulary Extraction

**Feature Branch**: `004-image-extraction`
**Created**: 2025-12-09
**Status**: Draft
**Input**: Upload images of textbook pages and extract vocabulary using Gemini API

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload Image and Extract Vocabulary (Priority: P1)

A user uploads a photo of a textbook page, and the app uses Gemini API to extract vocabulary pairs, which the user can review before saving.

**Why this priority**: This is THE core feature—AI-powered vocabulary extraction from images.

**Independent Test**: Upload a test image with vocabulary, verify extraction returns structured JSON, verify user can review results.

**Acceptance Scenarios**:

1. **Given** I have an API key configured, **When** I upload an image, **Then** the app sends it to Gemini for extraction
2. **Given** Gemini returns results, **When** extraction completes, **Then** I see a preview of extracted vocabulary
3. **Given** I see extracted vocabulary, **When** I click "Save", **Then** flashcards are created in a new or existing list
4. **Given** extraction is in progress, **When** waiting, **Then** I see a loading indicator

---

### User Story 2 - Edit Extracted Vocabulary Before Saving (Priority: P1)

A user reviews AI-extracted vocabulary and can edit, add, or remove entries before saving to ensure accuracy.

**Why this priority**: AI is not perfect; user control is a core principle.

**Independent Test**: Extract vocabulary, modify an entry, delete one, add one, save—verify saved flashcards reflect edits.

**Acceptance Scenarios**:

1. **Given** I see extraction results, **When** I edit a source/target word, **Then** the edit is reflected in preview
2. **Given** I see extraction results, **When** I delete an entry, **Then** it's removed from preview
3. **Given** I see extraction results, **When** I add a new entry manually, **Then** it appears in preview
4. **Given** I've made edits, **When** I click Save, **Then** only my edited version is saved

---

### User Story 3 - Handle Extraction Errors Gracefully (Priority: P1)

When AI extraction fails (network error, invalid response, API error), the user sees a helpful error message and can retry or input manually.

**Why this priority**: Errors are inevitable; graceful handling is essential for usability.

**Independent Test**: Simulate API failure, verify error message displayed, verify retry button works.

**Acceptance Scenarios**:

1. **Given** the API request fails, **When** error occurs, **Then** I see a clear error message
2. **Given** an error occurred, **When** I click "Retry", **Then** extraction is attempted again
3. **Given** Gemini returns unparseable JSON, **When** parsing fails, **Then** I see raw output and can edit manually
4. **Given** no API key is configured, **When** I try to extract, **Then** I'm prompted to add key in Settings

---

### User Story 4 - Choose Destination List (Priority: P2)

A user can choose to save extracted vocabulary to a new list or an existing list.

**Why this priority**: Flexibility for organization, but can default to new list for MVP.

**Independent Test**: Extract vocabulary, select existing list as destination, save—verify cards added to that list.

**Acceptance Scenarios**:

1. **Given** I have extraction results, **When** I click Save, **Then** I can choose "New List" or select existing
2. **Given** I choose "New List", **When** I save, **Then** I'm prompted to name the new list
3. **Given** I choose an existing list, **When** I save, **Then** flashcards are appended to that list

---

### User Story 5 - Support Multiple Image Formats (Priority: P2)

A user can upload images in various formats (JPG, PNG, HEIC, PDF pages) for extraction.

**Why this priority**: Users have photos from various devices; format flexibility is important.

**Independent Test**: Upload JPG, PNG, HEIC, and PDF—verify all are processed successfully.

**Acceptance Scenarios**:

1. **Given** I select a JPG file, **When** I upload, **Then** extraction proceeds normally
2. **Given** I select a PNG file, **When** I upload, **Then** extraction proceeds normally
3. **Given** I select a HEIC file, **When** I upload, **Then** [NEEDS CLARIFICATION: Convert to JPG first? Gemini supports HEIC?]
4. **Given** I select a PDF, **When** I upload, **Then** [NEEDS CLARIFICATION: Extract first page only? All pages? Let user choose?]

---

### User Story 6 - Image History for Re-extraction (Priority: P3)

A user with "Keep Images" enabled can view previously uploaded images and re-run extraction on them.

**Why this priority**: Nice-to-have feature; depends on image retention setting.

**Independent Test**: Enable keep images, upload, navigate to Image History, click re-extract—verify new extraction runs.

**Acceptance Scenarios**:

1. **Given** "Keep Images" is enabled, **When** I extract from an image, **Then** it's saved to history
2. **Given** I have image history, **When** I view Image History page, **Then** I see thumbnails
3. **Given** I click an image in history, **When** I select "Re-extract", **Then** extraction runs again

---

### Edge Cases

- What if the image contains no vocabulary? Show empty results, allow manual entry.
- What if the image is too large? Resize/compress before sending to API (document size limits).
- What if the image is blurry/unreadable? AI will do its best; user can edit results.
- Rate limiting: What if user hits Gemini API rate limits? Show error with retry-after guidance.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept image uploads via file picker or drag-and-drop
- **FR-002**: System MUST convert images to base64 for Gemini API transmission
- **FR-003**: System MUST send images to Gemini with vocabulary extraction prompt including language pair
- **FR-004**: System MUST parse Gemini JSON response into Flashcard array
- **FR-005**: System MUST display extraction results for user review before saving
- **FR-006**: Users MUST be able to edit, add, and remove extracted entries before saving
- **FR-007**: System MUST handle API errors with clear error messages and retry option
- **FR-008**: System MUST show raw API output when JSON parsing fails
- **FR-009**: System MUST require API key before allowing extraction attempts
- **FR-010**: System MUST support at minimum JPG and PNG formats
- **FR-011**: System MUST show loading state during extraction (typically 5-15 seconds)
- **FR-012**: If "Keep Images" enabled, system MUST store original image in LocalStorage/IndexedDB

### Key Entities

- **Flashcard**: Extracted vocabulary entries with source, target, gender, partOfSpeech, example, notes
- **ImageHistory**: (if implemented) id, imageData (base64), extractedAt, listId (if saved)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Extraction completes within 30 seconds for typical textbook page image
- **SC-002**: Successfully extracts >80% of vocabulary from clear, well-lit textbook images
- **SC-003**: Error recovery allows user to continue workflow without data loss
- **SC-004**: UI remains responsive during extraction (loading state, not frozen)

## Open Questions

1. **HEIC Support**: Does Gemini API support HEIC directly, or do we need to convert to JPG first?
2. **PDF Handling**: For multi-page PDFs, extract all pages, first page only, or let user select pages?
3. **Image Size Limits**: What's the maximum image size Gemini accepts? Do we need to resize large images?
4. **Batch Upload**: Should users be able to upload multiple images at once for batch extraction?
5. **Extraction Preview Location**: Should extraction preview/edit be a modal, a new page, or inline on upload page?
6. **Default Tags**: Should newly extracted flashcards inherit any default tags (e.g., from the list)?
