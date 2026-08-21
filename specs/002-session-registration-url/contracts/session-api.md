# Session API Contract

Base path: `/api/v1`

## Create session

`POST /series/{seriesId}/sessions`

Request additions:

```json
{
  "title": "Intro to EnableFront",
  "startsAt": "2026-09-01T17:00:00.000Z",
  "endsAt": "2026-09-01T18:00:00.000Z",
  "registrationUrl": "https://teams.microsoft.com/registration/example"
}
```

`registrationUrl` is optional. Null, omitted, and whitespace-only values mean no link.

## Update session

`PUT /sessions/{sessionId}`

The request keeps the existing title and schedule fields and adds the same optional
`registrationUrl` property. The update is atomic: invalid URL input leaves the session unchanged.

## Successful response

The existing session response includes:

```json
{
  "sessionId": "00000000-0000-0000-0000-000000000000",
  "seriesId": "00000000-0000-0000-0000-000000000000",
  "title": "Intro to EnableFront",
  "startsAt": "2026-09-01T17:00:00Z",
  "endsAt": "2026-09-01T18:00:00Z",
  "registrationUrl": "https://teams.microsoft.com/registration/example"
}
```

The property is null when no URL is stored.

## Validation errors

Invalid URL input returns the existing error envelope with a 400 status, a stable validation code,
and a message identifying `registrationUrl`. The service must reject relative URLs, malformed URLs,
non-HTTP(S) schemes, and values longer than 2,048 characters.
