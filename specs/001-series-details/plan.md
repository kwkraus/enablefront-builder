# Implementation Plan: Series Details (Description & Outcomes)

**Branch**: `001-series-details` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-series-details/spec.md`

## Summary

Add an optional, formatted series-details field that owners can edit inline and authorized
viewers can read. Store sanitized constrained HTML on `Series`, expose it through the existing
series GET/PUT contract, enforce a 10,000-character plain-text limit on the server, and use a
headless editor with only bold, italic, underline, and bulleted-list controls. Reuse existing
inline-save/error patterns and current ownership enforcement.

## Technical Context

**Language/Version**: C#/.NET 10; TypeScript/Next.js 16, React 19

**Primary Dependencies**: ASP.NET Core Minimal API, EF Core 10, Azure SQL, Primer React 38,
next-auth, Playwright; no new runtime dependency by default (see research.md)

**Storage**: Nullable `nvarchar(max)` column on `Series`, containing sanitized constrained HTML

**Testing**: xUnit + FluentAssertions + EF Core InMemory for backend; Playwright E2E plus
frontend lint/build

**Target Platform**: Azure App Service backend and browser-based Next.js frontend

**Project Type**: Full-stack web application with ASP.NET Core API and Next.js App Router

**Performance Goals**: One details value fetched with the existing series-detail request; no
additional read round trip; editor interactions remain local and responsive for 10,000 text
characters

**Constraints**: Optional field; 10,000 characters excluding markup; allow only plain text,
paragraph/break structure, bullets, bold, italic, underline; server-authoritative sanitization;
no new permission model; no optimistic save; preserve existing API/auth/error conventions

**Scale/Scope**: One field on the existing series detail route, one nullable schema column,
existing series GET/PUT endpoints, one reusable editor/view component, backend and E2E
regression coverage; export/list previews remain out of scope

## Constitution Check

* **PASS — Code Quality & Maintainability:** Extend the existing Series vertical slice and extract
  sanitizer/editor into focused units; no speculative new abstraction.
* **PASS — Testing Standards:** Add sanitizer/service/API coverage and Playwright scenarios for
  empty, formatted, save-error, and length-limit behavior.
* **PASS — UX & Accessibility:** Reuse Primer and inline-save patterns; provide semantic labels,
  keyboard toolbar access, visible focus, and explicit empty/loading/error states.
* **PASS — Performance & Reliability:** Reuse the existing detail fetch and PUT; validate before
  persistence and avoid extra queries; document the 10,000-character boundary.
* **PASS — Security & Data Protection:** Server-side allow-list sanitization before storage and
  rendering; no unsafe HTML, scripts, links, images, or tables; preserve owner authorization.
* **PASS — Operational Visibility:** Use existing error envelope/banner behavior and retain a
  clear validation path; no new sensitive logging.
* **PASS — Technology constraints:** Existing approved stacks remain in use. No new runtime
  package is assumed; any exception requires explicit dependency review.

**Post-design re-check:** PASS. The design preserves all six principles and introduces no
constitution violation or undocumented exception.

## Project Structure

### Documentation (this feature)

```text
specs/001-series-details/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    ├── series-details-api.md
    └── series-details-ui.md
```

### Source Code (repository root)

```text
src/
├── backend/
│   ├── Common/                  # constrained rich-text sanitizer
│   ├── Domain/Entities/         # Series.Details
│   ├── Features/Series/         # DTOs, endpoints, service
│   ├── Infrastructure/Data/     # EF model configuration
│   └── Migrations/              # AddSeriesDetails migration
└── frontend/
    ├── components/              # series details editor/view
    ├── lib/api/                 # typed series contract/client
    └── e2e/                     # user-visible series details flows
tests/
└── backend/EnableFront.Builder.Api.Tests/
    └── Features/Series/         # sanitizer/service/API regression tests
```

**Structure Decision**: Use the existing two-component vertical-slice structure. Backend changes
stay under `src/backend/Features/Series` with shared sanitization in `src/backend/Common`; the
frontend adds a focused component under `src/frontend/components` and extends the existing typed
series client. Tests mirror the current backend feature folder and frontend Playwright layout.

## Complexity Tracking

No violations identified; no complexity exception is required.
