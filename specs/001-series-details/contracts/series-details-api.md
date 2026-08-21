# Series Details API Contract

Base path: `/api/v1/series`

## GET `/{id}`

Existing authenticated series-detail response, extended with:

```json
{
  "seriesId": "guid",
  "title": "Series title",
  "details": "<p>Attend to <strong>learn</strong>.</p><ul><li>Outcome</li></ul>",
  "createdAt": "2026-08-20T00:00:00Z",
  "updatedAt": "2026-08-20T00:00:00Z"
}
```

`details` is `null` when absent. The returned value is canonicalized and sanitized.

## PUT `/{id}`

Existing title update payload, extended with optional nullable `details`:

```json
{
  "title": "Series title",
  "details": "<p>Updated <em>details</em>.</p>"
}
```

The service sanitizes before persistence. `null`, empty, or whitespace-only content clears the
field. Success returns `200` with the full response. Existing ownership and authentication rules
remain unchanged.

### Validation error

For more than 10,000 decoded text characters, return `400` using the existing error envelope:

```json
{
  "code": "validation_error",
  "message": "Series details must not exceed 10,000 characters.",
  "traceId": "request-trace-id"
}
```

No partial update is persisted.
