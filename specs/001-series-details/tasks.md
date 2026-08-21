# Tasks: Series Details (Description & Outcomes)

**Input**: Design documents from `/specs/001-series-details/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing vertical slice, validation commands, and dependency constraints before implementation.

- [X] T001 Record the existing Series GET/PUT ownership, error-envelope, and inline-save patterns in `specs/001-series-details/research.md`
- [X] T002 [P] Verify the no-new-runtime-dependency decision and editor fallback criteria in `src/frontend/package.json`
- [X] T003 [P] Add the feature verification command list and 10,000-character boundary cases to `specs/001-series-details/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the persisted field and shared API/domain contracts required by both user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Add nullable `Details` to the Series aggregate in `src/backend/Domain/Entities/Series.cs`
- [X] T005 [P] Map nullable `Series.Details` to `nvarchar(max)` without an index in `src/backend/Infrastructure/Data/AppDbContext.cs`
- [X] T006 [P] Generate and review the nullable `Details` schema migration and model snapshot in `src/backend/Migrations/20260820_AddSeriesDetails.cs`, `src/backend/Migrations/20260820_AddSeriesDetails.Designer.cs`, and `src/backend/Migrations/AppDbContextModelSnapshot.cs`
- [X] T007 Extend the detail response contract with nullable `details` in `src/backend/Features/Series/Dtos/SeriesResponseDto.cs` and `src/frontend/lib/api/types.ts`
- [X] T008 Extend the update request contract with nullable `details` (and preserve optional create semantics) in `src/backend/Features/Series/Dtos/UpdateSeriesRequest.cs` and `src/backend/Features/Series/Dtos/CreateSeriesRequest.cs`
- [X] T009 [P] Update the typed GET/PUT client payloads to carry `details` in `src/frontend/lib/api/series.ts`
- [X] T010 Add API contract assertions for GET/PUT response shape, clearing behavior, validation envelope, and no partial update in `tests/backend/EnableFront.Builder.Api.Tests/Features/Series/SeriesDetailsApiContractTests.cs`

**Checkpoint**: Database, DTOs, typed client, and contract expectations are ready for story implementation.

---

## Phase 3: User Story 1 - Add and edit series description with rich formatting (Priority: P1) 🎯 MVP

**Goal**: Let an owner add, format, save, edit, clear, and reload optional series details using only bullets, bold, italic, and underline.

**Independent Test**: Open a series with no details as its owner, enter a mixed bulleted list with bold/italic/underline text, save, reload, and confirm the formatting is preserved; also verify empty save, failed save, and the 10,000/10,001 decoded-character boundary.

### Tests for User Story 1

> Write these tests first and verify they fail before implementation.

- [X] T011 [P] [US1] Add sanitizer unit tests for allowed tags, `b`/`i` canonicalization, attribute stripping, unsupported scripts/links/images/tables, safe-text preservation, empty-to-null normalization, and malformed fragments in `tests/backend/EnableFront.Builder.Api.Tests/Features/Series/SeriesDetailsSanitizerTests.cs`
- [X] T012 [P] [US1] Add service tests for sanitized persistence, optional empty details, clearing to null, exactly 10,000 accepted, 10,001 rejected, no partial update, and wrong-owner protection in `tests/backend/EnableFront.Builder.Api.Tests/Features/Series/SeriesServiceTests.cs`
- [X] T013 [P] [US1] Add owner Playwright coverage for empty placeholder, toolbar formatting, save/reload preservation, edit changes, clear-to-empty, save failure draft retention, and over-limit validation in `src/frontend/e2e/series-details.spec.ts` (all scenarios authored; 4/8 pass headlessly — the 4 requiring pre-seeded initial details fail only because Playwright `page.route()` cannot intercept the Next.js Server Component's Node-side SSR fetch, a pre-existing limitation already documented in `e2e/series-export.spec.ts`; verified with a temporary local stub backend, not part of this change)

### Implementation for User Story 1

- [X] T014 [P] [US1] Implement the constrained allow-list sanitizer and decoded plain-text length validator in `src/backend/Common/SeriesDetailsSanitizer.cs`
- [X] T015 [US1] Apply sanitization and length validation before persistence, return actionable validation errors, and preserve owner authorization in `src/backend/Features/Series/SeriesService.cs` and `src/backend/Features/Series/SeriesEndpoints.cs` (depends on T014)
- [X] T016 [US1] Map `Details` through Series create/update/detail DTOs without changing list or export contracts in `src/backend/Features/Series/Dtos/CreateSeriesRequest.cs`, `src/backend/Features/Series/Dtos/UpdateSeriesRequest.cs`, `src/backend/Features/Series/Dtos/SeriesResponseDto.cs`, and `src/backend/Features/Series/SeriesService.cs` (depends on T007, T008, T014)
- [X] T017 [US1] Build an accessible headless details editor with bold, italic, underline, unordered-list, keyboard-focus, save, cancel, saving, empty, and validation-error states in `src/frontend/components/series-details-editor.tsx`
- [X] T018 [US1] Build a sanitized read-only details renderer and edit/add affordance composition in `src/frontend/components/series-details.tsx`
- [X] T019 [US1] Integrate owner details state, inline save/error handling, router refresh, and the new details components before metrics in `src/frontend/components/series-detail-view.tsx` using `src/frontend/lib/api/series.ts` (depends on T009, T017, T018)
- [X] T020 [US1] Update frontend API/domain types and client payload typing for nullable details in `src/frontend/lib/api/types.ts` and `src/frontend/lib/api/series.ts` (depends on T007, T009)

**Checkpoint**: User Story 1 is independently functional and testable as the MVP.

---

## Phase 4: User Story 2 - View series details as a non-owner viewer (Priority: P2)

**Goal**: Let any authorized viewer read sanitized formatted details while hiding empty editor prompts and edit affordances from users without edit permission.

**Independent Test**: Load a series with saved details as a read-only authorized viewer and confirm bullets/bold/italic/underline render semantically with no editor; load a series without details and confirm no empty prompt appears.

### Tests for User Story 2

- [ ] T021 [P] [US2] Add read-only viewer Playwright scenarios for formatted rendering, absence of edit controls, and absence of an empty prompt when details are null in `src/frontend/e2e/series-details.spec.ts` (BLOCKED: left as `test.fixme()` placeholders — no distinct non-owner viewer role exists yet per `research.md` Decision 4, so a genuine read-only session cannot be authenticated in e2e; revisit once a viewer permission model lands)
- [X] T022 [P] [US2] Add API/service coverage proving authorized detail reads return canonical sanitized HTML while unauthorized access follows existing series access behavior in `tests/backend/EnableFront.Builder.Api.Tests/Features/Series/SeriesDetailsApiContractTests.cs` and `tests/backend/EnableFront.Builder.Api.Tests/Features/Series/SeriesServiceTests.cs` (owner round-trip and non-owner 404 coverage added)

### Implementation for User Story 2

- [X] T023 [US2] Render canonical sanitized details as semantic read-only HTML with no unsafe markup in `src/frontend/components/series-details.tsx` (depends on T018)
- [X] T024 [US2] Gate the add/edit affordances using the existing series access/edit result without introducing a new permission model in `src/frontend/components/series-detail-view.tsx` (depends on T019)
- [X] T025 [US2] Verify the existing series detail loader passes nullable details to the read-only component without an additional request in `src/frontend/app/series/[id]/page.tsx` (depends on T007, T023)

**Checkpoint**: Both user stories work independently after Foundational; read-only viewers never receive an empty editor prompt.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete feature, accessibility, security, performance, and deployment readiness.

- [X] T026 [P] Run backend build and targeted Series tests, including sanitizer, API contract, migration, and ownership coverage, from `src/backend/` and `tests/backend/EnableFront.Builder.Api.Tests/`
- [X] T027 [P] Run frontend lint and production build from `src/frontend/`
- [X] T028 [P] Run targeted Chromium E2E coverage with `npm run test:e2e -- e2e/series-details.spec.ts` from `src/frontend/` (4/8 real scenarios pass headlessly; remaining 4 require a live/stubbed backend because the Server Component's SSR fetch is not interceptable by Playwright, matching the pre-existing limitation documented in `e2e/series-export.spec.ts`; full-green run verified locally against a temporary stub backend, not committed)
- [X] T029 Review editor keyboard accessibility, visible focus, semantic output, empty/loading/error states, and contrast against `specs/001-series-details/contracts/series-details-ui.md` (manual review: labeled toolbar buttons with `aria-pressed`, Escape-to-cancel, semantic `section`/`h2`/list markup, no empty prompt for non-editors, error banner via the existing parent convention; no automated axe/contrast tooling was run, so a follow-up automated a11y pass is still recommended)
- [X] T030 Review sanitizer security, no unsafe HTML rendering, no new runtime dependency, and no extra detail fetches against `specs/001-series-details/contracts/series-details-api.md`, `specs/001-series-details/research.md`, and `specs/001-series-details/plan.md`
- [ ] T031 Apply the EF migration through the normal deployment pipeline and document rollback/verification evidence in `specs/001-series-details/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No implementation dependency; documentation and dependency checks can run in parallel.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational; MVP and primary implementation increment.
- **User Story 2 (Phase 4)**: Depends on Foundational and reuses the US1 details renderer/integration, but has independent viewer tests.
- **Polish (Phase 5)**: Depends on the desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2; no dependency on another user story.
- **US2 (P2)**: Can start after Phase 2; implementation reuses US1's sanitized read-only component, while viewer behavior remains independently testable.

### Within Each User Story

- Tests precede implementation and should fail before production changes.
- Sanitizer/domain persistence precedes service/endpoint integration.
- API client/types precede UI integration.
- Editor and renderer components precede page-level composition.

### Parallel Opportunities

- T002–T003 and T005–T006, T009–T010 can run in parallel where files do not overlap.
- T011–T013 are independent red tests and can run in parallel.
- T017 and T018 can be implemented in parallel after the API/service contract is stable.
- T021–T022 can run in parallel.
- T026–T030 can run in parallel after implementation.

## Parallel Example: User Story 1

```text
Track A: T011 sanitizer tests → T014 sanitizer → T015/T016 service and endpoint wiring
Track B: T012 service tests → T015/T016 persistence and API behavior
Track C: T013 Playwright tests → T017 editor → T019 detail-page integration
Track D: T018 read-only renderer and T020 typed client updates
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and the blocking Phase 2 foundation.
2. Execute T011–T020 using red-green-refactor.
3. Stop and validate with the independent US1 criteria and targeted backend/E2E commands.
4. Demo or deploy the owner authoring increment only after migration and security reviews pass.

### Incremental Delivery

1. Foundation ready.
2. Deliver US1 as the MVP.
3. Deliver US2 read-only viewer behavior and permission-gated empty states.
4. Run the cross-cutting validation and deployment checks.

## Notes

- Every task uses the required `- [ ] T###` checklist format; `[P]` marks only file-independent parallel work.
- Story tasks carry exactly one `[US1]` or `[US2]` label; setup, foundation, and polish tasks intentionally have no story label.
- Exact repository-relative file paths are included in every task description.
