# Research: Session Webinar Registration URL

## Decision 1: Use a nullable string field on Session

- **Decision**: Add `RegistrationUrl` as an optional string persisted with the session, with a
  maximum length of 2,048 characters and no uniqueness constraint.
- **Rationale**: The value belongs to one scheduled session, must survive create/edit/reload, and
  existing sessions must remain valid without it. A nullable column provides backward-compatible
  storage without introducing a separate entity or relationship.
- **Alternatives considered**: A separate registration-link table was rejected because the feature has
  one optional value per session and no independent lifecycle. Provider-specific columns were rejected
  because the requirement is explicitly provider-agnostic.

## Decision 2: Validate trimmed absolute HTTP(S) URLs before save

- **Decision**: Trim surrounding whitespace, treat empty input as null, enforce the 2,048-character
  limit, parse as an absolute URI, and accept only `http` and `https` schemes.
- **Rationale**: This rejects relative paths, bare domains, script/file schemes, and malformed values
  while allowing Teams, Zoom, Webex, and other browser-based registration providers. Validation is
  shape-only and does not make outbound requests.
- **Alternatives considered**: Reachability checks were rejected because they add latency and make
  saves dependent on third-party availability. A frontend-only check was rejected because API callers
  must receive the same protection.

## Decision 3: Reuse existing create/update session contracts

- **Decision**: Extend `CreateSessionRequest`, `UpdateSessionRequest`, `SessionResponseDto`, and the
  frontend session types/client payloads; keep the existing POST and PUT routes.
- **Rationale**: The field is part of the session resource and should save atomically with title and
  schedule. A separate URL endpoint would complicate modal state and create an unnecessary partial-save
  path.
- **Alternatives considered**: A dedicated `/registration-url` endpoint was rejected because it adds
  another round trip and does not improve the user journey.

## Decision 4: Use a shared compact modal for admin entry

- **Decision**: Add a reusable Registration Link dialog with URL input, inline validation, Done,
  Cancel, and clear/remove behavior. Render the saved value as a compact Registration Link action.
- **Rationale**: This satisfies the requirement to avoid a full-width textbox while keeping validation
  close to the action. Primer React already supplies accessible dialog/form primitives and the
  existing codebase has a ConfirmDialog pattern to follow.
- **Alternatives considered**: Always-visible raw URL input was rejected for visual density. A custom
  provider selector was rejected because provider neutrality is required.

## Decision 5: External links open in a new tab

- **Decision**: Render saved registration links with `target="_blank"` and a safe `rel` value, from
  both the series session list and session details page.
- **Rationale**: The current admin page remains available while the user visits the provider's page;
  this is explicitly required by the clarified specification.
- **Alternatives considered**: Same-tab navigation was rejected because it loses the current admin
  context. Client-side programmatic navigation was rejected because normal anchors are more accessible.

## Decision 6: Validate in the modal before save

- **Decision**: Run the same trim, empty, length, absolute-URL, and HTTP(S)-scheme checks in the
  frontend as the value changes or on blur; keep backend validation authoritative on Done and the
  containing session save.
- **Rationale**: Immediate feedback reduces correction time and avoids making the user wait for a
  network round trip. Duplicating the small pure validation rule is acceptable because it improves
  UX, while the backend remains necessary for API callers and cannot trust browser input.
- **Alternatives considered**: Waiting for the session Save action was rejected because it delays
  feedback and makes the modal less useful. Frontend-only validation was rejected because it would
  permit invalid values through non-browser callers.
