# Data Model: Series Details

## Series

Existing aggregate in `src/backend/Domain/Entities/Series.cs`.

| Field | Type | Required | Rules |
|---|---|---:|---|
| `SeriesId` | `Guid` | yes | Existing UUID primary key |
| `OwnerUserId` | `string` | yes | Existing authorization boundary |
| `Title` | `string` | yes | Existing non-empty title rule |
| `Details` | `string?` | no | Sanitized constrained HTML; `null` means no details |
| `CreatedAt` | `DateTime` | yes | Existing UTC timestamp |
| `UpdatedAt` | `DateTime` | yes | Updated on successful details/title save |

### Storage mapping

Add nullable `nvarchar(max)` column `Details` to `Series`. Do not add an index: details is not
used for filtering or sorting. Existing rows migrate with `NULL`; no default or destructive
backfill is required.

### Content rules

1. Accept plain text and supported structure/styles only.
2. Normalize equivalent editor tags (`b`/`i`) to canonical `strong`/`em`.
3. Remove attributes and unsupported elements such as scripts, links, images, tables, styles, and
   event handlers; preserve safe text when an unsupported wrapper is removed.
4. Convert empty/whitespace-only sanitized content to `null`.
5. Count decoded underlying text characters after sanitization; reject values above 10,000 with
   an actionable validation error and do not persist partial content.

### Relationships and transitions

`Series` remains the owner of the details value; no new entity or relationship is introduced.
The value transitions `null → sanitized content`, `content → sanitized content`, and
`content → null` on successful owner saves. Concurrent saves retain existing last-successful-save
wins semantics.
