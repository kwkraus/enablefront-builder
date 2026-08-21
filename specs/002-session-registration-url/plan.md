# Implementation Plan: Session Webinar Registration URL

**Branch**: `kwkraus-register-link-icon` | **Date**: 2026-08-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-session-registration-url/spec.md`

## Summary

Add an optional, provider-agnostic registration URL to `Session`. The backend will normalize and
validate the value before persistence, expose it through existing session DTOs, and include it in
series export. The frontend will use a compact Add/Edit Registration Link modal on create and edit
flows, show a conditional Registration Link action at the far right of the series session list, and
open saved links in a new browser tab from both admin surfaces.

## Technical Context

**Language/Version**: C# / .NET 10; TypeScript / React 19

**Primary Dependencies**: ASP.NET Core Minimal API, EF Core 10 SQL Server, Next.js 16 App Router,
Primer React v38, Primer Octicons

**Storage**: Azure SQL through EF Core; nullable `nvarchar(2048)` session column

**Testing**: xUnit + FluentAssertions backend tests; Playwright E2E and existing frontend lint/build

**Target Platform**: Authenticated desktop-first web application hosted on Azure App Service

**Project Type**: Full-stack web application with separate `src/backend` and `src/frontend`

**Performance Goals**: Preserve current session list/detail request shape and responsiveness; no
additional destination-network calls

**Constraints**: Existing API base path `/api/v1`, owner authorization, UTC persistence, no new
runtime dependencies, no URL reachability checks, and no optimistic UI updates

**Scale/Scope**: One nullable field and one reusable modal shared by session create/edit; changes
touch session API/DTOs, EF migration, export, series list, session detail, and targeted tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status: PASS**

- Code Quality & Maintainability: reuse the existing Session service, DTO, API, feature folders, and
  Primer UI patterns; introduce only a focused URL validator and reusable modal.
- Testing Standards & Regression Prevention: add backend validation/persistence/export coverage and
  frontend flow coverage for modal states, conditional action rendering, and new-tab behavior.
- UX Consistency & Accessibility: use semantic labels, keyboard-accessible modal controls, explicit
  validation/error states, and preserve the current page when opening external links.
- Performance & Reliability: validate locally without network resolution; keep session queries and
  exports bounded to existing data access patterns.
- Security & Data Protection: preserve authenticated owner filtering; only validated `http`/`https`
  URLs are rendered as external links; no secrets or tokens are logged.
- Operational Visibility: reuse existing API error envelopes and frontend error banners; no new
  telemetry is required because this is a synchronous CRUD field.

## Project Structure

### Documentation

```text
specs/002-session-registration-url/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/session-api.md
```

### Source Code

```text
src/
├── backend/
│   ├── Domain/Entities/Session.cs
│   ├── Features/Sessions/
│   │   ├── Dtos/
│   │   ├── SessionEndpoints.cs
│   │   └── SessionService.cs
│   ├── Features/Export/MarkdownExportService.cs
│   ├── Infrastructure/Data/AppDbContext.cs
│   └── Migrations/<timestamp>_AddRegistrationUrlToSession.cs
└── frontend/
    ├── app/series/[id]/sessions/new/page.tsx
    ├── app/sessions/[id]/page.tsx
    ├── components/series-detail-view.tsx
    ├── components/registration-link-dialog.tsx
    └── lib/api/{sessions.ts,types.ts}

tests/
└── backend/EnableFront.Builder.Api.Tests/
    └── Features/Sessions/SessionServiceTests.cs
```

**Structure Decision**: Use the existing vertical-slice backend and App Router frontend structure.
The modal is a shared component because create and edit need identical validation and save semantics;
API types remain in the existing typed client model rather than adding a new endpoint.

## Implementation Phases

### Phase 0: Research

Research outcomes are captured in [research.md](research.md). Decisions cover nullable persistence,
HTTP(S) URL validation, existing create/update contracts, the shared modal, and safe new-tab links.

### Phase 1: Design and contracts

- [data-model.md](data-model.md) defines the nullable field, validation, relationships, and states.
- [contracts/session-api.md](contracts/session-api.md) defines request, response, and validation error
  behavior.
- [quickstart.md](quickstart.md) defines automated and manual acceptance validation.

### Phase 2: Implementation sequencing

1. Add the nullable Session property, EF configuration, and migration.
2. Extend request/response DTOs and frontend API types/client payloads.
3. Add shared backend URL normalization/validation and cover create/update/error behavior.
4. Include the URL in session responses, list items, and markdown exports.
5. Build the accessible frontend modal with immediate client-side validation on change/blur, then
   integrate it with new-session and session-detail flows.
6. Add the conditional far-right Registration Link action to the series session list.
7. Verify `target="_blank"`/safe `rel` behavior from list and detail views.
8. Run focused backend tests, frontend lint/build, and the documented Playwright scenarios.

## Complexity Tracking

No constitution violations.
