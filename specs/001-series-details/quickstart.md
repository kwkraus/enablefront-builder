# Series Details Validation Quickstart

## Prerequisites

- .NET 10 SDK and Node.js/npm installed.
- Repository dependencies restored.
- Configured backend database/test settings and an authenticated local app session for E2E.

## Backend validation

From `src/backend`:

```powershell
dotnet build
dotnet test ..\..\tests\backend\EnableFront.Builder.Api.Tests\EnableFront.Builder.Api.Tests.csproj
```

Verify tests cover details in responses, supported formatting, removal of unsafe/unsupported
markup, exactly 10,000 versus 10,001 decoded characters, clearing to `null`, and wrong-owner
protection. Apply the generated EF migration through the normal deployment pipeline; do not use
automatic startup migrations.

## Dependency verification (no new runtime dependency)

From `src/frontend`, confirm no rich-text/editor package was added:

```powershell
git diff --stat -- package.json package-lock.json
```

The editor is implemented with native `contentEditable` + `document.execCommand`, and the
read-only renderer is a hand-written allow-list HTML-to-React parser (no `dangerouslySetInnerHTML`
and no new npm dependency). `package.json`'s `dependencies` block should show no additions.

## Frontend validation

From `src/frontend`:

```powershell
npm run lint
npm run build
npm run test:e2e -- e2e/series-details.spec.ts
```

Use the authenticated-cookie and backend-stubbing approach documented in
`e2e/series-export.spec.ts`, or a local backend stub for server-component requests.

> **Known local/E2E limitation**: `app/series/[id]/page.tsx` is a Server Component that fetches
> the series (including `details`) on the Node side. Playwright's `page.route()` only intercepts
> browser-originated requests, so scenarios that require specific *pre-seeded* details on first
> load (reload-preservation, edit-existing, clear-to-empty, cancel-discard) need a real or stubbed
> backend listening on `BACKEND_API_BASE_URL` (default `http://localhost:5187`) to pass headlessly;
> otherwise they fail with `ECONNREFUSED`/`fetch failed`. This is pre-existing and already
> documented in `e2e/series-export.spec.ts`, not introduced by this feature. Scenarios that only
> depend on browser-side interactions after initial load (empty state, format-and-save,
> save-failure, over-limit validation) pass without a backend.

Verify these user flows:

1. Owner sees an accessible “add details” empty state when no details exist.
2. Owner applies bold, italic, underline, and a mixed bulleted list, saves, and sees read-only
   formatted output.
3. Reload preserves the same structure/styles.
4. Editing existing details and saving replaces the previously rendered content.
5. Clearing all content saves successfully and returns to the empty state.
6. Canceling an edit discards the in-progress draft and keeps the prior saved value.
7. Failed PUT keeps the draft editable and shows the standard error banner.
8. Over-limit input (10,001+ decoded characters) is rejected with a clear message and no data
   corruption; exactly 10,000 decoded characters is accepted.
9. A read-only authorized user sees formatted content and no empty editor prompt, when such a
   route exists in the current access configuration. No distinct non-owner viewer role exists yet
   (see `research.md` Decision 4), so these two scenarios are currently `test.fixme()` in
   `e2e/series-details.spec.ts` pending a real viewer permission model.
