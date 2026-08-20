# Feature Specification: Series Details (Description & Outcomes)

**Feature Branch**: `001-series-details`

**Created**: 2026-08-20

**Status**: Draft

**Input**: User description: "Add series details to the series page that describes the series and outcomes from attending. This is an optional field, but needs to support formatting for bullets and styles and bold/italic/underline."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add and edit series description with rich formatting (Priority: P1)

As a series owner, I want to add a description of the series and the outcomes attendees can expect, using bullet points and bold/italic/underline emphasis, so the series page clearly communicates value to viewers without me needing to write raw markup.

**Why this priority**: This is the core capability requested — without it, there is no series details field at all. It delivers the entire value of the feature on its own.

**Independent Test**: Can be fully tested by opening a series with no existing details, entering formatted text (a bulleted list with bold/italic/underline segments) into the details field, saving, and confirming the formatting renders correctly on the series page.

**Acceptance Scenarios**:

1. **Given** a series with no details set, **When** the owner opens the series page, **Then** the details section shows an empty/placeholder state inviting them to add details, without blocking any other page functionality.
2. **Given** the owner is editing series details, **When** they apply bold, italic, underline, or bullet-list formatting to selected text and save, **Then** the saved details render with that formatting preserved on the series page.
3. **Given** the owner has entered details text with formatting, **When** they save and reload the series page, **Then** the same formatted content is displayed exactly as it was saved.
4. **Given** the owner is editing series details, **When** they leave the field empty and save, **Then** the series is saved successfully with no details (field remains optional).

**Acceptance Scenarios (continued)**:

5. **Given** a series has existing formatted details, **When** the owner edits and changes some formatting (e.g., removes a bullet list, adds bold), **Then** the updated formatting is saved and reflected on next view.

---

### User Story 2 - View series details as a non-owner viewer (Priority: P2)

As anyone viewing a series page (not just the owner), I want to read the series description and expected outcomes with its formatting intact, so I can quickly understand what the series is about and what I'll get out of attending.

**Why this priority**: Viewing is a natural complement to authoring and is required for the feature to deliver value to its intended audience, but the authoring experience (P1) is the higher-risk, higher-effort piece.

**Independent Test**: Can be fully tested by loading a series page as a read-only viewer (or after page refresh) and confirming the details section displays formatted content correctly and is not editable if the viewer lacks permission.

**Acceptance Scenarios**:

1. **Given** a series has details saved, **When** any user with access to the series page views it, **Then** the formatted details (bullets, bold, italic, underline) are rendered read-only and correctly.
2. **Given** a series has no details saved, **When** a viewer without edit permission opens the series page, **Then** no empty editor or "add details" prompt is shown to them (only owners/editors see the prompt to add details).

---

### Edge Cases

- What happens when the details field is left completely empty? → Field is optional; series saves normally and the page shows a neutral empty state (for owners) or nothing (for other viewers).
- How does the system handle extremely long details text? → Content beyond a reasonable practical limit (see FR-006) is rejected with a clear validation message before saving; no data is lost silently.
- What happens if a user pastes content with unsupported formatting (e.g., images, tables, links) into the details editor? → Unsupported formatting is stripped or ignored on save; only supported formatting (bullets, bold, italic, underline) is retained.
- What happens if two owners edit series details concurrently? → The last successful save wins, consistent with existing series title editing behavior; no additional conflict resolution is introduced.
- How does the details field behave for a series that had details added and then fully cleared? → Clearing all text and saving removes the details, returning the series to the "no details" state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a series owner to add, edit, and clear a "series details" text field describing the series and the outcomes attendees can expect from attending.
- **FR-002**: The series details field MUST be optional — a series MUST be creatable and saveable with no details provided.
- **FR-003**: The series details editor MUST support the following formatting controls: bulleted lists, bold, italic, and underline text styling.
- **FR-004**: The system MUST persist series details formatting so that it renders identically (same structure and styling) when the series page is reloaded or viewed by a different user.
- **FR-005**: The series page MUST display the series details in a read-only, formatted view for any user who can view the series, and MUST offer an editable entry point only to users who have permission to edit the series (consistent with existing series edit permissions, e.g., series title editing).
- **FR-006**: The system MUST enforce a maximum length on series details content (10,000 characters of underlying text, excluding formatting markup) and MUST reject saves that exceed it with a clear, actionable validation message.
- **FR-007**: The system MUST sanitize saved series details content to prevent unsafe or unsupported content (e.g., scripts, embedded links, images, tables) from being stored or rendered, retaining only the supported formatting (bullets, bold, italic, underline) and plain text.
- **FR-008**: When series details are empty, the series page MUST show a neutral placeholder/empty state to users who can edit the series, and MUST show nothing (no empty section) to users who cannot edit the series.
- **FR-009**: Editing and saving series details MUST follow the same save/error-handling pattern as other series fields (e.g., inline save with error banner on failure), so the experience is consistent with the rest of the series page.

### Key Entities *(include if feature involves data)*

- **Series Details**: A formatted rich-text field associated with a single Series, describing the series and the outcomes of attending. Stores structured content supporting bullet lists and bold/italic/underline emphasis. Optional — a Series may have no details. Belongs to exactly one Series and is edited/viewed alongside the rest of that Series's data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Series owners can add or update formatted series details (bullets plus bold/italic/underline) in under 1 minute from opening the series page.
- **SC-002**: 100% of saved formatting (bullets, bold, italic, underline) is preserved and displayed correctly after a page reload, verified across all supported formatting combinations.
- **SC-003**: Series pages with no details set load and render without any error or broken UI element for both editors and non-editing viewers.
- **SC-004**: Attempting to save series details that exceed the allowed length is rejected with a clear message in 100% of cases, with no partial or corrupted data saved.

## Assumptions

- Series details editing permissions mirror existing series edit permissions (i.e., whoever can edit the series title/other series fields can edit series details); no new permission model is introduced.
- The supported formatting set is limited to bulleted lists and bold/italic/underline text styling, as explicitly requested; numbered lists, headings, links, images, tables, and other rich-text features are out of scope for this feature.
- Series details content is stored as structured/sanitized rich text (e.g., a constrained HTML or markdown subset) rather than plain text, since formatting must be preserved across save/reload.
- A maximum length of 10,000 characters (excluding formatting markup) is a reasonable default limit consistent with typical descriptive-text fields; this can be adjusted during planning if a different limit is required.
- The feature applies to the existing series detail page; no new page or route is introduced.
