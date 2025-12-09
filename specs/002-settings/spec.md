# Feature Specification: Settings & Configuration

**Feature Branch**: `002-settings`
**Created**: 2025-12-09
**Status**: Draft
**Input**: Settings page for API key, language selection, and preferences

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Gemini API Key (Priority: P1)

A user enters their Gemini API key on the Settings page so they can use AI vocabulary extraction.

**Why this priority**: Without an API key, the core AI feature cannot work.

**Independent Test**: Enter API key, save, refresh page—key persists. Attempt extraction in another feature—key is available.

**Acceptance Scenarios**:

1. **Given** I'm on the Settings page, **When** I enter an API key and click Save, **Then** the key is stored in LocalStorage
2. **Given** I've saved an API key, **When** I refresh the page, **Then** the key field shows the saved value (masked)
3. **Given** I enter an invalid API key format, **When** I click Save, **Then** I see a validation error [NEEDS CLARIFICATION: What constitutes "invalid format"? Just empty, or check prefix/length?]

---

### User Story 2 - Select Language Pair (Priority: P1)

A user selects their source language (language they're learning from) and target language (language they're learning) so vocabulary extraction knows the direction.

**Why this priority**: Language pair is required context for AI extraction prompts.

**Independent Test**: Select languages, save, check extraction prompt includes correct languages.

**Acceptance Scenarios**:

1. **Given** I'm on the Settings page, **When** I select source and target languages, **Then** selections are persisted
2. **Given** I've set languages, **When** I trigger vocabulary extraction, **Then** the prompt includes my language pair
3. **Given** I select the same language for source and target, **When** I try to save, **Then** I see an error [NEEDS CLARIFICATION: Should we allow same language? Edge case for dialects?]

---

### User Story 3 - Toggle Image Retention (Priority: P2)

A user toggles whether uploaded images are kept after extraction, allowing them to re-extract later if desired.

**Why this priority**: Privacy feature but not blocking for core functionality.

**Independent Test**: Toggle on, upload image, verify image persists. Toggle off, upload image, verify image is discarded after extraction.

**Acceptance Scenarios**:

1. **Given** "Keep Images" is enabled, **When** I upload and extract from an image, **Then** the image is stored locally
2. **Given** "Keep Images" is disabled, **When** I upload and extract from an image, **Then** the image is discarded after extraction
3. **Given** I toggle "Keep Images" off, **When** I have existing stored images, **Then** [NEEDS CLARIFICATION: Delete existing images or keep them?]

---

### Edge Cases

- What if LocalStorage is full? Show error message suggesting export/cleanup.
- What if user clears browser data? Settings reset to defaults; show onboarding prompt.
- API key field: Should it be masked/hidden by default with reveal toggle? (Recommend: Yes)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST persist Settings to LocalStorage on save
- **FR-002**: System MUST load Settings from LocalStorage on app initialization
- **FR-003**: API key field MUST be masked by default with optional reveal toggle
- **FR-004**: System MUST provide language selection dropdowns for source and target languages
- **FR-005**: System MUST include a toggle for "Keep Images" preference
- **FR-006**: System MUST validate that API key is not empty before allowing save
- **FR-007**: System MUST provide default values for new users (empty API key, English as source, [NEEDS CLARIFICATION: default target language?])
- **FR-008**: Settings changes MUST take effect immediately without app restart

### Key Entities

- **Settings**: apiKey (string), sourceLang (string), targetLang (string), keepImages (boolean)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Settings persist across browser sessions (refresh, close/reopen)
- **SC-002**: API key is never visible in plain text in DevTools LocalStorage (base64 encode or similar obfuscation—not security, just casual privacy)
- **SC-003**: Language selection includes at least 10 common languages
- **SC-004**: Settings page loads in under 500ms

## Open Questions

1. **API Key Validation**: Should we validate the API key format (e.g., starts with specific prefix, has certain length)? Or just check non-empty?
2. **Same Language Pair**: Should we allow source === target for edge cases like regional dialects?
3. **Toggle Off Images**: When user disables "Keep Images", should existing stored images be deleted?
4. **Default Target Language**: What should the default target language be for new users?
5. **Language List**: Should we hardcode a list of languages or fetch from an API? (Recommend: Hardcode common languages for MVP)
