<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0
Bump type: MINOR — added a quality-focused principle set for maintainability, test discipline,
UX consistency, and performance requirements while retaining the existing governance model.

Modified principles (old title → new title):
  I. Spec-Driven Development → I. Code Quality & Maintainability
  II. Test-First / TDD → II. Testing Standards & Regression Prevention
  III. Vertical-Slice Architecture → III. User Experience Consistency & Accessibility
  IV. Metrics Persisted on Write → IV. Performance & Reliability Requirements
  V. Security by Default → V. Security & Data Protection
  VI. Structured Observability → VI. Operational Visibility

Added sections:
  - Explicit quality and maintainability rules for code clarity and reviewability
  - Testing standards tied to real user-visible behavior and regression prevention
  - UX consistency and accessibility expectations for consistent product behavior
  - Performance and reliability requirements for responsiveness and stability

Removed sections:
  - None; the original principles were re-scoped rather than deleted.

Templates requiring updates:
  ✅ .specify/templates/plan-template.md — Constitution Check remains valid and generic.
  ✅ .specify/templates/spec-template.md — no constitution-specific structural changes required.
  ✅ .specify/templates/tasks-template.md — generic task flow remains valid for the updated principles.
  ⚠ .github/copilot-instructions.md — confirm wording still aligns with the updated principle set.
  ⚠ .github/instructions/aspnet-webapi.instructions.md — confirm backend quality guidance remains aligned.
  ⚠ .github/instructions/nextjs.instructions.md — confirm UX/performance expectations remain aligned.
  ⚠ docs/spec-driven-development-process.md — confirm any old principle wording is still consistent.

Follow-up TODOs:
  - None.
-->

# Enablemint Builder Constitution

## Core Principles

### I. Code Quality & Maintainability

All implementation work MUST prioritize readable, consistent, and maintainable code.

- Code MUST be organized into small, named units with clear responsibility boundaries.
- Shared logic MUST be extracted to reusable abstractions only when it removes duplication or
  clarifies intent; speculative abstractions are prohibited.
- Backend and frontend changes MUST follow the repository's domain and feature structure without
  introducing inconsistent naming, layering, or duplication.
- Reviewers MUST reject changes that add complexity without a clear justification.
- Production code MUST avoid dead code, hidden side effects, and brittle coupling.

**Rationale**: High-quality code reduces regression risk, makes onboarding faster, and preserves the
ability to change features without destabilizing the application.

### II. Testing Standards & Regression Prevention

All user-facing behavior and business rules MUST be tested before release.

- New features, bug fixes, and schema changes MUST include failing tests before implementation.
- Backend contract and integration tests MUST cover API behavior and data integrity.
- Frontend behavior MUST be validated for rendering, interaction, and failure states.
- Tests MUST validate actual user-visible behavior rather than implementation details.
- Any skipped or intentionally deferred test coverage MUST be documented with a reason approved by
  the reviewer.
- Release validation MUST include the required build, lint, and test commands for the affected stack.

**Rationale**: Reliable software depends on evidence that changes work as expected under realistic
conditions, not on manual confidence alone.

### III. User Experience Consistency & Accessibility

The product MUST present a coherent, accessible, and predictable user experience across all surfaces.

- Shared UI patterns MUST be reused instead of introducing ad hoc variations.
- User flows MUST maintain consistent navigation, labeling, status messaging, and error handling.
- Accessibility is a requirement: keyboard access, semantic markup, visible focus states, and
  readable contrast MUST be preserved.
- Empty, loading, and error states MUST be designed explicitly and handled consistently.
- Frontend interactions MUST avoid ambiguous states and provide clear recovery paths for user errors.

**Rationale**: Consistency creates trust and accessibility expands the value of the product to every
user without requiring a second learning curve.

### IV. Performance & Reliability Requirements

Product changes MUST preserve responsiveness and operational stability under normal usage.

- UI interactions MUST remain responsive for the expected user workflows and data volumes.
- API and database operations MUST avoid unnecessary repeated work, large synchronous blocks, and
  avoidable data fetches.
- Performance-sensitive work MUST include measurable constraints or reviewable rationale when the
  requirement is non-trivial.
- User-visible loading, retry, and fallback states MUST be used when work is asynchronous or may fail.
- Changes that increase latency or instability without a documented product need are not permitted.

**Rationale**: Fast and resilient experiences are core product quality, not optional optimization
after the fact.

### V. Security & Data Protection

Authentication, authorization, and sensitive data handling are mandatory.

- User and business endpoints MUST enforce identity validation and minimum required authorization.
- Secrets, tokens, and connection strings MUST be stored outside source control.
- Logs and diagnostics MUST exclude sensitive data, PII, and auth material.
- Data access patterns MUST minimize exposure and follow least-privilege design.
- Security exceptions MUST be documented, reviewed, and time-bounded.

**Rationale**: Product trust depends on protecting identity and data even when a feature is otherwise
working as intended.

### VI. Operational Visibility

Engineering work MUST produce enough evidence to diagnose, validate, and support delivery.

- Structured logging and correlated request context MUST be used for critical flows.
- Metrics and diagnostics MUST support feature validation and incident triage.
- Changes that affect runtime behavior MUST include a clear verification path for operators and
  reviewers.
- Failure states MUST be observable without invasive debugging or guesswork.

**Rationale**: Observability is part of product quality; without it, teams cannot safely operate or
improve the system.

## Tech Stack & Constraints

The following technology selections are approved and locked for this project unless a constitution
amendment is approved.

| Layer | Approved Stack |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Primer React v38, next-auth |
| Backend | ASP.NET Core Minimal API (.NET 10), EF Core, Azure SQL |
| Auth | Microsoft Entra ID single-tenant with Microsoft.Identity.Web |
| Graph | Microsoft.Graph SDK, delegated OBO only |
| Hosting | Azure App Service |
| Testing | xUnit for backend, Playwright E2E for frontend |

**Project Constraints**:

- No new runtime dependency may be introduced without explicit product and review justification.
- Feature work MUST remain within the current architecture and not bypass established feature boundaries.
- V1 delivery prioritizes correctness, accessibility, and maintainability over speculative optimization.
- Migrations and schema changes MUST be reviewed and versioned with clear validation evidence.
- No undocumented security or privacy exceptions are permitted.

## Development Workflow

### Agent Routing

Agents are the authoritative implementation paths for feature work.

| Task | Assigned Agent |
|---|---|
| Feature spec authoring | `spec-driven-development` |
| Board and planning tasks | `devops-workitem-manager` |
| TDD and regression coverage | `frontend-backend-tdd-engineer` |
| Backend API and data work | `aspnet-api-expert` |
| Frontend UX and accessibility | `ui-ux-nextjs` |
| Observability and diagnostics | `observability-sre` |
| Cross-stack integration | `fullstack-integration` |
| CI/CD and release safety | `cicd-devops` |
| Constitution amendments | `speckit.constitution` |

### Quality Gates

All pull requests MUST satisfy the following before merge:

1. Build and lint commands for the changed stack MUST complete successfully.
2. Relevant automated tests MUST pass for all touched behavior.
3. New or changed functionality MUST include validation evidence tied to the affected user journey.
4. UX and accessibility regressions MUST be reviewed before approval.
5. Performance-sensitive changes MUST provide a documented impact assessment.
6. The constitution check MUST confirm no principle violation unless a documented exception is approved.

### Amendment Procedure

- PATCH changes require single-reviewer approval for clarification or wording updates.
- MINOR changes require two-reviewer approval for new guidance or expanded requirements.
- MAJOR changes require explicit team review and migration planning for incompatible or removed rules.
- All amendments MUST be executed through the `speckit.constitution` workflow to maintain version
  tracking and template consistency.

## Governance

This constitution governs feature delivery, code review, and release readiness. When conflicts arise
between this document and other guidance, the constitution takes precedence.

- All pull requests and code reviews MUST verify compliance with the Core Principles.
- Feature work that violates any governing principle MUST include documented rationale and approval
  before merge.
- The `speckit.constitution` workflow is the canonical mechanism for updating this document.
- Compliance review occurs at spec approval, pull request review, and release validation.
- This document is the governing baseline for quality, testing, UX, performance, and safety.

**Version**: 1.1.0 | **Ratified**: 2026-07-21 | **Last Amended**: 2026-08-13
