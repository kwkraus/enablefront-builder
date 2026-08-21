# Data Model: Session Webinar Registration URL

## Session

Existing entity: `src/backend/Domain/Entities/Session.cs`

| Field | Type | Required | Rules |
|---|---|---:|---|
| `SessionId` | `Guid` | yes | Existing primary key |
| `SeriesId` | `Guid` | yes | Existing series relationship |
| `OwnerUserId` | `string` | yes | Existing ownership boundary |
| `Title` | `string` | yes | Existing title validation |
| `StartsAt` | `DateTime` | yes | Existing UTC schedule |
| `EndsAt` | `DateTime` | yes | Existing UTC schedule |
| `RegistrationUrl` | `string?` | no | Null when omitted/whitespace; trimmed; max 2,048 chars; absolute `http`/`https` URL |

## Relationships

- Session remains owned by one Series through the existing `SeriesId` foreign key.
- Registration URL has no separate entity, foreign key, uniqueness rule, metric behavior, or provider
  relationship.
- Existing sessions migrate with `RegistrationUrl = null`.

## State transitions

1. **Absent -> Present**: valid trimmed URL supplied during create or update.
2. **Present -> Replaced**: a different valid URL supplied during update.
3. **Present -> Absent**: empty or whitespace-only value supplied during update.
4. **Any state -> unchanged**: invalid URL or Cancel in the modal; no persistence occurs.

## Validation ownership

- Backend service/API validation is authoritative for all callers.
- Frontend modal validation provides immediate feedback using the same absolute HTTP(S), trim, and
  length rules before sending the request.
