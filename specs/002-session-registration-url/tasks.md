# Tasks: Session Webinar Registration URL

**Input**: Design documents from `specs/002-session-registration-url/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/session-api.md`,
and `quickstart.md`

**Tests**: Included because the constitution requires backend contract/data coverage, frontend
behavior coverage, and regression protection for schema changes.

## Phase 1: Setup

**Purpose**: Confirm the existing project surfaces and avoid introducing new dependencies.

- [X] T001 Confirm the existing backend target and frontend scripts in `src/backend/EnableFront.Builder.Api.csproj` and `src/frontend/package.json` remain sufficient for this feature

---

## Phase 2: Foundational

**Purpose**: Establish shared validation and persistence prerequisites before story-specific UI work.

- [X] T002 [P] Add the nullable `RegistrationUrl` property to `src/backend/Domain/Entities/Session.cs` and configure its nullable 2,048-character column in `src/backend/Infrastructure/Data/AppDbContext.cs`
- [X] T003 [P] Add the shared frontend registration URL validation helper in `src/frontend/lib/registration-url.ts` for trimming, empty values, length limits, absolute URL parsing, and HTTP(S) schemes
- [X] T004 Create the EF Core migration `src/backend/Migrations/<timestamp>_AddRegistrationUrlToSession.cs` and update its model snapshot for the nullable `Sessions.RegistrationUrl` column

**Checkpoint**: Shared persistence and validation primitives are ready; user-story implementation can begin.

---

## Phase 3: User Story 1 - Record a registration link on a session (Priority: P1) 🎯 MVP

**Goal**: Store an optional provider-agnostic registration URL during session creation and editing,
and return it when the session is read.

**Independent Test**: Create a session with a valid URL, reload it, edit the URL, clear it, and
confirm each persisted value is returned without requiring a provider-specific URL.

### Tests for User Story 1

- [X] T005 [P] [US1] Add service tests in `tests/backend/EnableFront.Builder.Api.Tests/Features/Sessions/SessionServiceTests.cs` covering create with a URL, create without a URL, update/replacement, clear-to-null, and response mapping
- [X] T006 [P] [US1] Add frontend Playwright coverage in `src/frontend/e2e/session-registration-link.spec.ts` for creating a session through the Add Registration Link modal and verifying the saved link survives reload

### Implementation for User Story 1

- [X] T007 [US1] Extend `src/backend/Features/Sessions/Dtos/CreateSessionRequest.cs` and `src/backend/Features/Sessions/Dtos/UpdateSessionRequest.cs` with the optional `RegistrationUrl` request property
- [X] T008 [US1] Extend `src/backend/Features/Sessions/Dtos/SessionResponseDto.cs` and `src/backend/Features/Sessions/Dtos/SessionListItemDto.cs` with nullable registration URL output
- [X] T009 [US1] Normalize and persist `RegistrationUrl` in `src/backend/Features/Sessions/SessionService.cs` for create, update, get, and series-list projections while preserving atomic session saves
- [X] T010 [US1] Wire the optional registration URL through `src/frontend/lib/api/types.ts` and `src/frontend/lib/api/sessions.ts` for create and update payloads and session responses
- [X] T011 [US1] Create the reusable accessible modal in `src/frontend/components/registration-link-dialog.tsx` with URL input, immediate validation feedback, Done, Cancel, edit prefill, and remove behavior
- [X] T012 [US1] Integrate Add Registration Link and modal state into `src/frontend/app/series/[id]/sessions/new/page.tsx` without rendering a full-width raw URL textbox
- [X] T013 [US1] Integrate edit, clear, and save behavior into `src/frontend/app/sessions/[id]/page.tsx` using the shared registration-link dialog and existing error/loading patterns

**Checkpoint**: User Story 1 is independently functional for optional create/edit persistence.

---

## Phase 4: User Story 2 - Reject invalid registration links at entry (Priority: P2)

**Goal**: Provide immediate client-side feedback and authoritative backend rejection for malformed,
relative, non-HTTP(S), whitespace-only, and overlong values without changing saved session data.

**Independent Test**: Exercise invalid values in the modal and API service, confirm field-specific
messages appear before session save, and confirm invalid updates leave the prior URL unchanged.

### Tests for User Story 2

- [X] T014 [P] [US2] Add backend validation tests in `tests/backend/EnableFront.Builder.Api.Tests/Features/Sessions/SessionServiceTests.cs` for relative URLs, bare domains, malformed URLs, `javascript:`, `file:`, overlong input, trimming, whitespace-only null, and unchanged-on-error behavior
- [X] T015 [P] [US2] Add frontend Playwright coverage in `src/frontend/e2e/session-registration-link.spec.ts` for change/blur validation, field-specific error text, disabled/blocked Done behavior, and Cancel preserving the prior value

### Implementation for User Story 2

- [X] T016 [US2] Add backend registration URL normalization and validation in `src/backend/Features/Sessions/SessionService.cs` or a focused helper under `src/backend/Features/Sessions/`, returning stable validation error codes for invalid URL input
- [X] T017 [US2] Map registration URL validation failures to the existing error envelope in `src/backend/Features/Sessions/SessionEndpoints.cs` with HTTP 400 and a message identifying `registrationUrl`
- [X] T018 [US2] Connect `src/frontend/lib/registration-url.ts` to `src/frontend/components/registration-link-dialog.tsx` so validation runs on value change and blur, trims on save, treats whitespace-only input as clear, and prevents Done for invalid values
- [X] T019 [US2] Preserve existing session state on invalid or cancelled registration-link edits in `src/frontend/app/series/[id]/sessions/new/page.tsx` and `src/frontend/app/sessions/[id]/page.tsx`

**Checkpoint**: User Stories 1 and 2 both work independently with immediate and server-side validation.

---

## Phase 5: User Story 3 - Reach the registration page from the session (Priority: P3)

**Goal**: Expose saved links as compact admin actions, open them in new tabs from list and detail
views, and include them in series exports.

**Independent Test**: View sessions with and without URLs, activate both admin link surfaces, and
export a series to confirm only sessions with URLs include a registration link.

### Tests for User Story 3

- [X] T020 [P] [US3] Extend `src/frontend/e2e/session-registration-link.spec.ts` to assert the conditional far-right Registration Link action, absent state, session-detail action, `target="_blank"`, and safe `rel` behavior
- [X] T021 [P] [US3] Add markdown export coverage in `tests/backend/EnableFront.Builder.Api.Tests/Features/Export/MarkdownExportServiceTests.cs` for including stored registration URLs and omitting the field for null URLs

### Implementation for User Story 3

- [X] T022 [US3] Render the conditional far-right Registration Link icon/action in `src/frontend/components/series-detail-view.tsx`, stopping row navigation and opening the validated URL in a new tab with safe link attributes
- [X] T023 [US3] Render the compact Registration Link action on `src/frontend/app/sessions/[id]/page.tsx`, opening the destination in a new tab while preserving the current detail page
- [X] T024 [US3] Include non-empty registration URLs in `src/backend/Features/Export/MarkdownExportService.cs` and omit the registration field entirely for sessions without a URL
- [X] T025 [US3] Verify `src/backend/Features/Sessions/Dtos/SessionListItemDto.cs`, `src/frontend/lib/api/types.ts`, and `src/frontend/components/series-detail-view.tsx` remain aligned so list rendering receives the URL without an extra request

**Checkpoint**: All three user stories are independently demonstrable and preserve existing session navigation.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Complete accessibility, documentation, and release validation.

- [X] T026 [P] Add accessible labels, focus handling, Escape/Cancel behavior, and keyboard-submit behavior to `src/frontend/components/registration-link-dialog.tsx`
- [X] T027 [P] Update `specs/002-session-registration-url/quickstart.md` if implementation details or test selectors differ from the delivered flow
- [X] T028 Run backend regression and feature tests with `dotnet test tests/backend/EnableFront.Builder.Api.Tests/EnableFront.Builder.Api.Tests.csproj`
- [X] T029 Run frontend quality gates with `npm run lint` and `npm run build` from `src/frontend`
- [X] T030 Run the documented browser acceptance coverage with `npx playwright test` from `src/frontend`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational; delivers the MVP.
- **User Story 2 (Phase 4)**: Depends on Foundational and integrates with US1's modal/service paths.
- **User Story 3 (Phase 5)**: Depends on US1 data/API output and US2 validation guarantees.
- **Polish (Phase 6)**: Depends on all desired user stories.

### User Story Dependencies

- **US1 (P1)**: Foundational only; independent MVP.
- **US2 (P2)**: Foundational plus shared modal/service integration from US1.
- **US3 (P3)**: US1 response data and US2's validated URL guarantee.

### Parallel Opportunities

- T002, T003, and T004 can be prepared in parallel after setup, subject to migration generation
  occurring after the model configuration is finalized.
- T005 and T006 can be written in parallel before implementation.
- T007, T008, and T010 can be implemented in parallel because they touch separate contract/type files.
- T014 and T015 can be written in parallel.
- T020 and T021 can be written in parallel.
- T026 and T027 can be completed in parallel with each other after feature behavior stabilizes.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3, including its backend and frontend tests.
3. Stop and validate create/edit/reload persistence before adding link presentation and export.

### Incremental Delivery

1. Deliver US1 for optional URL persistence.
2. Deliver US2 for immediate and authoritative validation.
3. Deliver US3 for list/detail navigation and export.
4. Complete Phase 6 quality gates.

## Independent Test Criteria

- **US1**: A valid URL can be added, retrieved, replaced, and cleared on a session; omitted URLs
  remain valid.
- **US2**: Invalid values show immediate field feedback, cannot be confirmed, are rejected by the
  API, and never overwrite the previous saved value.
- **US3**: Only sessions with URLs show the compact Registration Link action; list/detail links open
  new tabs; exports include only non-empty URLs.

## Task Format Validation

All tasks use the required `- [ ] T###` checklist format, include `[P]` only for parallelizable
work, include `[US1]`, `[US2]`, or `[US3]` on user-story tasks, and specify concrete repository file
paths.
