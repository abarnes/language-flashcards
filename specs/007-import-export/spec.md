# Feature Specification: Import/Export

**Feature Branch**: `007-import-export`
**Created**: 2025-12-09
**Status**: Draft
**Input**: Export and import vocabulary data as JSON files

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export All Data (Priority: P1)

A user exports their entire database (all lists, flashcards, settings) as a JSON file for backup or transfer.

**Why this priority**: Data portability is critical—users must be able to backup and own their data.

**Independent Test**: Create some lists and cards, export, verify JSON file contains all data.

**Acceptance Scenarios**:

1. **Given** I'm on Settings, **When** I click "Export All Data", **Then** a JSON file downloads
2. **Given** I have multiple lists, **When** I export, **Then** all lists and flashcards are in the file
3. **Given** I export, **When** I open the JSON file, **Then** data is readable and properly structured

---

### User Story 2 - Import Data from Backup (Priority: P1)

A user imports a previously exported JSON file to restore their data or transfer to a new device/browser.

**Why this priority**: Completes the data portability story; enables device migration.

**Independent Test**: Export data, clear LocalStorage, import file—verify data restored.

**Acceptance Scenarios**:

1. **Given** I'm on Settings, **When** I select a JSON file to import, **Then** data is loaded into the app
2. **Given** I import data, **When** I view Dashboard, **Then** all imported lists are present
3. **Given** I import data, **When** import completes, **Then** I see a success message with summary

---

### User Story 3 - Handle Import Conflicts (Priority: P1)

When importing, if data already exists, the user can choose how to handle conflicts (merge or replace).

**Why this priority**: Prevents accidental data loss during import.

**Independent Test**: Have existing data, import file with overlapping content, verify conflict resolution options.

**Acceptance Scenarios**:

1. **Given** I have existing data, **When** I import a file, **Then** I'm asked how to handle conflicts
2. **Given** conflict dialog, **When** I choose "Replace All", **Then** existing data is overwritten
3. **Given** conflict dialog, **When** I choose "Merge", **Then** [NEEDS CLARIFICATION: How exactly does merge work?]
4. **Given** conflict dialog, **When** I choose "Cancel", **Then** import is aborted, existing data unchanged

---

### User Story 4 - Export Single List (Priority: P2)

A user exports a single vocabulary list to share or backup independently.

**Why this priority**: Enables sharing specific content without full database.

**Independent Test**: Export one list, verify JSON contains only that list's data.

**Acceptance Scenarios**:

1. **Given** I'm on List Detail, **When** I click "Export List", **Then** a JSON file with that list downloads
2. **Given** I export a single list, **When** I open the JSON, **Then** only that list's data is present
3. **Given** I export a list, **When** filename is generated, **Then** it includes the list name

---

### User Story 5 - Import Single List (Priority: P2)

A user imports a single list JSON file, adding it to their existing data.

**Why this priority**: Enables receiving shared lists from others.

**Independent Test**: Export single list, import into different browser/device, verify list added.

**Acceptance Scenarios**:

1. **Given** I select a single-list JSON file, **When** I import, **Then** the list is added to my data
2. **Given** imported list has same name as existing, **When** imported, **Then** [NEEDS CLARIFICATION: Rename? Ask user?]
3. **Given** import completes, **When** I view Dashboard, **Then** the new list appears

---

### User Story 6 - Validate Import File (Priority: P2)

The system validates JSON files before import to prevent corruption from malformed files.

**Why this priority**: Protects user data from bad imports.

**Independent Test**: Attempt import with invalid JSON, verify error message, data unchanged.

**Acceptance Scenarios**:

1. **Given** I select a non-JSON file, **When** I try to import, **Then** I see "Invalid file format" error
2. **Given** I select malformed JSON, **When** I try to import, **Then** I see a validation error
3. **Given** I select JSON missing required fields, **When** I try to import, **Then** I see specific validation errors

---

### Edge Cases

- What if exported file is very large (>5MB)? Still works, but may be slow—warn user.
- What if imported file has future schema version? Fail gracefully with version mismatch error.
- What if LocalStorage is full during import? Show error, suggest exporting and clearing old data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST export all data (lists, flashcards, settings) as a single JSON file
- **FR-002**: System MUST support importing a full database JSON file
- **FR-003**: System MUST prompt user for conflict resolution when importing into non-empty database
- **FR-004**: Export MUST generate a valid, downloadable JSON file
- **FR-005**: Import MUST validate JSON structure before applying changes
- **FR-006**: System SHOULD support exporting individual lists
- **FR-007**: System SHOULD support importing individual lists
- **FR-008**: Export filename MUST include date (e.g., `flashcards-export-2025-12-09.json`)
- **FR-009**: Import MUST NOT modify existing data if validation fails
- **FR-010**: System MUST include schema version in export for future compatibility

### Key Entities

- **ExportData**: { version: string, exportedAt: number, settings: Settings, lists: VocabList[] }
- **SingleListExport**: { version: string, exportedAt: number, list: VocabList }

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Export of 1000 flashcards completes in under 2 seconds
- **SC-002**: Import of 1000 flashcards completes in under 3 seconds
- **SC-003**: Invalid JSON files are rejected 100% of the time
- **SC-004**: Successful import/export round-trip preserves all data exactly

## Open Questions

1. **Merge Strategy**: When merging imports, how should conflicts be resolved?
   - By ID: If same ID exists, keep existing? Replace? Ask?
   - By content: Detect duplicate source/target pairs?
2. **Include Settings in Full Export**: Should settings (API key, languages) be included in export? Security consideration for API key.
3. **Include Images**: If "Keep Images" is enabled, should images be included in export? Could make file very large.
4. **Schema Versioning**: What's the version migration strategy if schema changes in future?
5. **Duplicate List Names**: When importing a list with same name as existing, rename automatically ("List (2)") or ask user?
6. **Partial Import Failure**: If import partially fails (some lists valid, some not), should it import the valid ones or reject entirely?
