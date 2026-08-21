# Feature Specification: Session Webinar Registration URL

**Feature Branch**: `kwkraus-register-link-icon`

**Created**: 2026-08-20

**Status**: Draft

**Input**: User description: "Each session needs to have a reference to their associated Microsoft Teams Webinar URL for registration. This is an optional field but I would like this field to be a valid Absolute URL. because it's just a URL, it should also support any conferencing software webinar registration link, it just so happens I will be using Teams initially"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record a registration link on a session (Priority: P1)

A session owner is planning a session and already has a webinar registration link from their
conferencing provider (initially Microsoft Teams). While creating or editing the session, they paste
that registration link into an optional field on the session. The link is saved with the session and
is visible whenever the session details are viewed.

**Why this priority**: Without the ability to store the link at all, no downstream value exists. This
is the minimum viable slice — capture and persist the registration link alongside the session.

**Independent Test**: Can be fully tested by creating a session with a registration link, reloading
the session, and confirming the link was stored and is displayed. Delivers immediate value: the
owner no longer tracks registration links outside the product.

**Acceptance Scenarios**:

1. **Given** an owner is creating a new session, **When** they supply a well-formed absolute
   registration URL and save, **Then** the session is created and the registration URL is stored and
   returned with the session.
2. **Given** an owner is creating a new session, **When** they leave the registration URL empty and
   save, **Then** the session is created successfully with no registration URL.
3. **Given** an existing session with no registration URL, **When** the owner edits the session and
   adds a valid absolute registration URL, **Then** the change is persisted and visible on reload.
4. **Given** an existing session that already has a registration URL, **When** the owner clears the
   field and saves, **Then** the registration URL is removed and the session remains valid.
5. **Given** an owner supplies a registration URL from a non-Teams provider (for example a Zoom or
   Webex registration link), **When** they save, **Then** it is accepted the same way a Teams link is.

---

### User Story 2 - Reject invalid registration links at entry (Priority: P2)

A session owner accidentally pastes an incomplete or malformed value (for example a bare domain with
no scheme, an internal note, or a relative path). The product refuses to save it and explains what a
valid value looks like, so a broken link is never distributed to attendees.

**Why this priority**: Storing a broken registration link is worse than storing none — attendees hit
a dead end. Validation protects the value delivered by Story 1, but the feature still functions
without it, so it is second.

**Independent Test**: Can be fully tested by attempting to save several malformed values and
confirming each is rejected with a clear, actionable message and the session is left unchanged.

**Acceptance Scenarios**:

1. **Given** an owner is saving a session, **When** they supply a value that is not an absolute URL
   (for example `example.com/register` or `/register`), **Then** the save is rejected with a clear
   validation message identifying the registration URL field.
2. **Given** an owner is saving a session, **When** they supply an absolute URL that does not use a
   web address scheme (for example a `javascript:` or `file:` value), **Then** the save is rejected.
3. **Given** a save is rejected for an invalid registration URL, **When** the owner reviews the
   session, **Then** no partial change was applied — the session retains its previous values.
4. **Given** an owner types a registration URL with leading or trailing whitespace, **When** they
   save, **Then** the surrounding whitespace is ignored and the trimmed URL is stored.

---

### User Story 3 - Reach the registration page from the session (Priority: P3)

A session owner (or anyone reviewing the session) wants to open or share the registration page. From
the session view they can follow the stored registration link directly, and when the session details
are exported the registration link travels with it.

**Why this priority**: This is the payoff of storing the link, but it depends on Stories 1 and 2 and
is a convenience rather than a data requirement.

**Independent Test**: Can be fully tested by opening a session that has a registration link, following
the link, and exporting the containing series to confirm the link appears in the exported document.

**Acceptance Scenarios**:

1. **Given** a session with a registration URL, **When** the owner views the session and activates
   the registration link, **Then** the registration page opens in a new browser tab and the
   Enablemint Builder page remains available in the original tab.
2. **Given** a session with no registration URL, **When** the owner views the session, **Then** no
   empty or broken link affordance is shown.
3. **Given** a series containing sessions with and without registration URLs, **When** the owner
   exports the series, **Then** sessions with a link show it and sessions without one are exported
   without an empty placeholder.
4. **Given** the owner is viewing the session list on the series details page, **When** a session has
   a registration URL, **Then** a clearly labeled Registration Link icon is shown at the far right
   of that session's row and opens the registration page in a new browser tab.
5. **Given** the owner is viewing the session list on the series details page, **When** a session has
   no registration URL, **Then** the Registration Link icon is not shown for that session.
6. **Given** the owner is viewing the session details page for a session with a registration URL,
   **When** they activate the registration link, **Then** the registration page opens in a new
   browser tab and the session details page remains available in the original tab.
7. **Given** the owner is creating or editing a session, **When** they choose Add Registration Link,
   **Then** a compact modal opens with a clearly labeled URL field, validation feedback, and explicit
   Done and Cancel actions rather than rendering a full-width URL textbox in the page layout.
8. **Given** the owner enters a valid URL in the registration-link modal and chooses Done, **When** the
   modal closes, **Then** the session surface shows a compact clickable link labeled Registration
   Link instead of exposing the full URL as a wide input.
9. **Given** the owner opens the registration-link modal for a session that already has a URL,
   **When** they choose to edit it, **Then** the modal is pre-populated with the current URL and
   Done saves the replacement while Cancel leaves the existing URL unchanged.
10. **Given** the owner is entering a registration URL, **When** the value changes or the field loses
    focus, **Then** the modal provides immediate client-side feedback without requiring the owner to
    submit the containing session form.

---

### Edge Cases

- What happens when a very long registration URL is supplied? It is accepted up to a documented
  maximum length; values beyond that maximum are rejected with a clear message rather than silently
  truncated.
- What happens when the same registration URL is used on multiple sessions? It is allowed —
  registration links are not required to be unique across sessions.
- What happens when a registration URL becomes stale or the registration page is later taken down?
  The product does not verify that the destination is reachable; it only validates the shape of the
  URL. A stale link remains stored until the owner changes it.
- What happens when a user supplies a URL containing tracking parameters or a fragment? It is stored
  as supplied, without rewriting or stripping parameters.
- What happens when a user submits a value that is only whitespace? It is treated the same as leaving
  the field empty — no registration URL is stored.
- How does the system handle an owner viewing a session they do not own? Existing ownership rules are
  unchanged; the registration URL is exposed only where the session itself is already exposed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A session MUST support an optional registration URL that references an external webinar
  registration page.
- **FR-002**: The registration URL MUST be provider-agnostic — any conferencing provider's
  registration link is accepted, with no Microsoft Teams-specific requirement on the value.
- **FR-003**: When a registration URL is supplied, the system MUST validate that it is a well-formed
  absolute URL using a standard web address scheme, and MUST reject values that are relative,
  incomplete, or use a non-web scheme.
- **FR-004**: The system MUST allow the registration URL to be omitted entirely when creating or
  updating a session, and MUST treat an empty or whitespace-only value as "no registration URL".
- **FR-005**: Users MUST be able to add, change, and remove a session's registration URL after the
  session has been created.
- **FR-006**: The system MUST trim surrounding whitespace from a supplied registration URL before
  validating and storing it, and MUST otherwise store the URL exactly as supplied.
- **FR-007**: When a supplied registration URL fails validation, the system MUST reject the entire
  save with a clear message identifying the registration URL field, and MUST leave the session
  unchanged.
- **FR-008**: The system MUST enforce a maximum registration URL length of 2,048 characters and
  reject longer values with a clear message rather than truncating them.
- **FR-009**: The system MUST return the stored registration URL whenever session details are
  retrieved, so that any surface displaying a session can present the link.
- **FR-010**: Session views MUST present a stored registration URL as a followable link, and MUST
  present no link affordance when no registration URL is stored. The session list on the series
  details page MUST render this as a clearly labeled Registration Link icon aligned at the far right
  of the session row when a URL exists. Activating the link from either the list or session details
  page MUST open the registration destination in a new browser tab, preserving the current
  application page in its original tab.
- **FR-011**: Series exports MUST include a session's registration URL when one is stored, and MUST
  omit the field entirely for sessions without one.
- **FR-012**: Existing sessions created before this feature MUST remain valid with no registration
  URL, and MUST continue to be readable and editable without supplying one.
- **FR-013**: The system MUST NOT require the registration URL to be unique across sessions.
- **FR-014**: The system MUST NOT attempt to contact, resolve, or verify the availability of the
  registration destination.
- **FR-015**: The series details session list MUST omit the Registration Link icon entirely for sessions
  without a registration URL, rather than showing a disabled, empty, or broken control.
- **FR-016**: Session create and edit surfaces MUST provide an Add Registration Link action that
  opens a compact modal for entering, validating, saving, editing, or removing the optional URL.
- **FR-017**: The registration-link modal MUST provide a clearly labeled URL field, inline validation
  feedback as the value changes or on field blur, and explicit Done and Cancel actions. Cancel MUST
  discard unsaved changes.
- **FR-018**: After a URL is saved, admin session surfaces MUST display a compact clickable
  Registration Link label or icon rather than a full-width URL textbox or an always-visible raw URL
  field.
- **FR-019**: The future public series landing page MAY use the shorter Register label for the same
  destination; the admin create/edit experience MUST use Registration Link terminology.

### Key Entities *(include if data involved)*

- **Session**: An individual scheduled occurrence within a series. Gains one new optional attribute —
  a registration URL that points to the external webinar registration page for that session. The
  attribute is independent of the session's schedule, title, and metrics, and has no effect on
  registration or attendance counting.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An owner can attach a registration link to a session in under 30 seconds without leaving
  the session create or edit flow.
- **SC-002**: 100% of malformed registration link submissions are rejected before being stored, with
  a message that names the field and states what a valid value looks like.
- **SC-003**: 100% of sessions that existed before this feature continue to load, display, and save
  successfully without a registration URL.
- **SC-004**: An owner can retrieve a session's registration link from the session view without
  consulting any system outside the product.
- **SC-005**: Registration links stored for at least three different conferencing providers are
  accepted and displayed identically, confirming provider neutrality.

## Assumptions

- Registration links are entered manually by the session owner; there is no automated retrieval or
  synchronization from Microsoft Teams or any other conferencing provider.
- Validation confirms the shape of the URL only. Reachability, ownership, and continued availability
  of the destination are the owner's responsibility.
- "Web address scheme" means the standard secure and insecure hypertext schemes; both are accepted so
  that internal or test registration pages are not blocked.
- The registration URL is not sensitive data and may appear in session views and series exports
  alongside the session title and schedule.
- The registration URL does not participate in registration, attendance, or warm-account metric
  computation.
- Existing session ownership and authorization rules govern who can view and edit the registration
  URL; this feature introduces no new permission model.
- The maximum length of 2,048 characters follows the common practical browser URL limit and is
  sufficient for provider registration links that include tracking parameters.
- The current feature covers admin session management surfaces; a future public series landing page
  may present the same destination with attendee-oriented "Register" wording.

## Clarifications

### Session 2026-08-20

- Q: Should the series details session list expose the registration URL as a Registration Link icon at the far right? → A: Yes; show it only when a registration URL exists and open the URL when activated.
- Q: Should registration links open in a new tab from both the series session list and session details page? → A: Yes; preserve the current application page in the original tab.
- Q: Should admin surfaces use "Registration Link" while a future public landing page uses "Register"? → A: Yes; use Registration Link for admin create/edit/list surfaces and reserve Register for public attendee-facing UI.
- Q: Should URL validation wait for the containing session Save action? → A: No; the modal provides client-side feedback while typing or on blur, with backend validation still authoritative on Done/save.
