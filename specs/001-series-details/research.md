# Research: Series Details

## Decision 1: Store constrained HTML on `Series`

**Decision:** Add nullable `Series.Details` persisted as `nvarchar(max)`. Store normalized,
server-sanitized HTML: text plus paragraph/break structure, `ul`, `li`, `strong`, `em`, and `u`.
Empty or whitespace-only content becomes `null`.

**Rationale:** The existing series GET/PUT resource is the smallest compatible contract and the
spec requires formatting to survive reloads and different viewers. HTML maps directly to a
WYSIWYG editor and read-only rendering. A separate table or editor-specific JSON format adds
joins/coupling without value for one optional field. The list DTO and markdown export remain
unchanged to avoid over-fetching and scope expansion.

**Alternatives considered:** Markdown requires a renderer and can vary by dialect; editor JSON
couples persistence to a vendor; a separate details table is unnecessary for one field.

## Decision 2: Use an allow-list sanitizer on the server

**Decision:** Implement a focused sanitizer in the backend using .NET BCL parsing/encoding
facilities, normalizing editor aliases (`b`→`strong`, `i`→`em`) and dropping attributes and
unsupported elements/content while retaining safe text. Validate plain-text length after
sanitization and reject values over 10,000 characters before saving.

**Rationale:** The server is authoritative for FR-006/FR-007 and the repository currently has no
HTML-sanitization dependency. An allow-list is safer than a deny-list and avoids adding a
runtime package solely for five supported styles. The implementation must handle malformed
fragments deterministically and have dedicated unit tests for scripts, links, images, tables,
attributes, aliases, empty content, and boundary lengths.

**Alternatives considered:** Client-only sanitization is not a security boundary. A third-party
sanitizer may be considered only if BCL parsing cannot safely handle browser fragments; that
would require an explicit dependency review and is not assumed in this plan. Regex-only parsing
is insufficient for arbitrary HTML.

## Decision 3: Use a minimal accessible editor with no new runtime dependency by default

**Decision:** Plan a focused client component with a semantic editable surface and four toolbar
actions (bold, italic, underline, unordered list), keyboard operation, labels, focus styling,
save/cancel behavior, and a read-only rendering mode. Prefer native `contentEditable` only if
browser output is normalized before submission and covered in Chromium E2E; otherwise use the
smallest headless editor package after explicit dependency approval.

**Rationale:** The approved stack has no editor library and the feature needs only four commands.
Avoiding a dependency preserves the constitution's no-new-runtime-dependency constraint, while
the fallback protects accessibility and browser consistency if native editing proves inadequate.
The server sanitizer remains authoritative regardless of editor choice.

**Alternatives considered:** Tiptap/Lexical provide stronger editor semantics but add runtime
dependencies and package-review scope. A textarea with markdown is accessible but does not meet
the requested non-markup formatting workflow without another renderer.

## Decision 4: Extend existing series GET/PUT and ownership model

**Decision:** Add nullable `details` to `SeriesResponseDto` and `UpdateSeriesRequest`; optionally
accept it on create for consistency. Keep `GET /api/v1/series/{id}` and `PUT /api/v1/series/{id}`,
existing `OwnerUserId` authorization, inline error envelopes, and last-write-wins behavior.

**Rationale:** Existing title editing defines the save/error pattern and authorization boundary.
The feature assumptions explicitly prohibit a new permission model. Any user who can currently
view the series receives read-only details; the owner/edit-capable user receives the edit
affordance. If product later requires non-owner access, that is a separate authorization change.

**Alternatives considered:** A dedicated details endpoint or new permission table would duplicate
existing resource behavior and expand scope.

## Decision 5: Verification strategy

**Decision:** Add backend unit/service tests for sanitization, length enforcement, persistence,
clearing, and ownership; add Playwright coverage for empty state, formatting controls, reload
preservation, save failure, and the 10,000-character boundary. Run `dotnet build`, targeted
`dotnet test`, `npm run lint`, `npm run build`, and targeted Playwright tests.

**Rationale:** The repository has xUnit/FluentAssertions backend coverage and Playwright-only
frontend coverage. These checks map directly to the acceptance scenarios and constitution gates.

## Decision 6 (T001): Existing Series GET/PUT ownership, error-envelope, and inline-save patterns

**Recorded patterns:** The existing `src/backend/Features/Series/SeriesEndpoints.cs` maps
`/api/v1/series` behind `RequireAuthorization()`. Every handler resolves the caller via
`ctx.GetUserOid()` and returns `Results.Unauthorized()` when it is `null` (no oid claim). There is
no separate "viewer" role or ACL: `GET /api/v1/series/{id}` and `PUT /api/v1/series/{id}` both
scope the query with `SeriesService`'s `FirstOrDefaultAsync(s => s.SeriesId == id &&
s.OwnerUserId == ownerUserId)`. A series owned by a different user is therefore indistinguishable
from a nonexistent one and both `GetByIdAsync`/`UpdateAsync` return `null`, which the endpoint maps
to `Results.NotFound(new ErrorEnvelope("series_not_found", "Series not found.",
ctx.TraceIdentifier))`. This is the pattern Series Details reuses for authorization: there is no
new permission model, and non-owners never observe whether `Details` exists on a series they do
not own.

Validation failures (e.g. missing `Title`) return `Results.BadRequest(new
ErrorEnvelope("validation_error", <message>, ctx.TraceIdentifier))`. `ErrorEnvelope` is the single
error contract used across the API: `record ErrorEnvelope(string ErrorCode, string Message, string
CorrelationId, object? Details = null)` (`src/backend/Common/ErrorEnvelope.cs`), serialized with
the default minimal-API camelCase JSON naming policy (`errorCode`/`message`/`correlationId`).
Series Details' new over-length validation (`SeriesDetailsTooLongException`) follows this exact
shape and status code: `SeriesEndpoints.cs` wraps `CreateAsync`/`UpdateAsync` in a `try/catch
(SeriesDetailsTooLongException ex)` and returns `Results.BadRequest(new
ErrorEnvelope("validation_error", ex.Message, ctx.TraceIdentifier))`, matching the pre-existing
Title validation branch rather than introducing a new error shape or status code.

`PUT /api/v1/series/{id}` is an inline, full-resource save: the request carries the complete
editable shape (`Title` plus, now, `Details`) and the success response is `Results.Ok(result)`
where `result` is the full `SeriesResponseDto` (last-write-wins, no ETags/If-Match, no partial
`PATCH` semantics). Series Details' `SeriesService.UpdateAsync` follows this by validating
(sanitizing) `Details` before mutating the tracked entity or calling `SaveChangesAsync`, so a
rejected update (over the 10,000-character decoded limit) leaves the previously persisted `Title`
and `Details` completely untouched — no partial persistence. `POST /api/v1/series` similarly
returns `Results.Created($"/api/v1/series/{result.SeriesId}", result)` with the same full DTO
shape. Series Details extends both the create and update contracts with an optional nullable
`details` field rather than introducing a separate details endpoint, consistent with Decision 4.