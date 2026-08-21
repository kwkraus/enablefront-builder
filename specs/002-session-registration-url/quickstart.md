# Quickstart: Session Webinar Registration URL

## Prerequisites

- .NET 10 SDK and Node.js/npm installed.
- Backend dependencies restored.
- Frontend dependencies installed in `src/frontend`.
- Authenticated local environment configured according to the repository README.

## Automated validation

From the repository root:

```powershell
dotnet test tests/backend/EnableFront.Builder.Api.Tests/EnableFront.Builder.Api.Tests.csproj
```

From `src/frontend`:

```powershell
npm run lint
npm run build
npx playwright test
```

## Manual acceptance flow

1. Open a series and choose **Add Session**.
2. Choose **Add Registration Link**; confirm a compact modal appears rather than a page-width field.
3. Enter a valid Teams, Zoom, or Webex registration URL and choose **Done**.
4. Save the session and confirm the session list shows a far-right **Registration Link** action.
5. Activate the list action and confirm the provider page opens in a new browser tab.
6. Open the session details page and confirm the same compact link is available and also opens a new tab.
7. Reopen the modal, verify the existing URL is pre-populated, then test Cancel, replacement, and
   clearing the link.
8. Try a relative path, bare domain, `javascript:` URL, `file:` URL, whitespace-only value, and a
   URL longer than 2,048 characters. Confirm each invalid value is rejected with field-specific
   feedback and existing saved data remains unchanged.
9. Export the series and confirm sessions with links include them while sessions without links omit
   the field.
