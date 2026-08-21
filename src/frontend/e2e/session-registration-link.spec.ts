/**
 * E2E tests for the session Registration Link feature (spec 002).
 *
 * Covers:
 *  - US1: adding/editing/persisting an optional registration URL through the
 *    Add/Edit Registration Link modal on session create and session detail.
 *  - US2: immediate client-side validation (relative paths, bare domains,
 *    malformed values, non-web schemes, overlong values, whitespace-only
 *    values) and Cancel preserving the prior value.
 *  - US3: the conditional far-right Registration Link action on the series
 *    session list and the compact action on the session detail page, both
 *    opening the destination in a new tab with safe `rel` behavior.
 *
 * ── Auth strategy ────────────────────────────────────────────────────────────
 * Same next-auth v4 session-token cookie injection approach as
 * `series-export.spec.ts`.
 *
 * ── Backend mocking strategy ─────────────────────────────────────────────────
 * The "New session" and "Session detail" pages are fully client-rendered
 * ('use client'), so every backend call happens as a browser fetch that
 * `page.route()` can intercept directly.
 *
 * The series detail page (`/series/[id]`) is a *server* component: its initial
 * data fetch is a Node.js `fetch()` from the Next.js dev server process, which
 * `page.route()` cannot intercept (see the doc comment in
 * `series-export.spec.ts`). To keep the "Series session list" scenarios
 * deterministic and fully offline, this file starts a tiny local HTTP stub on
 * the port referenced by `BACKEND_API_BASE_URL` (see `src/frontend/.env.local`)
 * for the duration of that describe block only.
 */
import { test, expect, type BrowserContext, type Locator } from '@playwright/test'
import { encode } from 'next-auth/jwt'
import http from 'node:http'

// ── Constants ─────────────────────────────────────────────────────────────────

const NEXTAUTH_SECRET = 'NFB3bPhTe11U9QEm+GQ72rjQ63e2Zhkn0dsC4lsWvq8='

const SERIES_ID = 'e2e-test-series-reg-001'
const SESSION_ID = 'e2e-test-session-reg-001'
const VALID_URL = 'https://teams.microsoft.com/registration/example'

// ── Interaction helper ───────────────────────────────────────────────────────
//
// This environment exhibits an intermittent Playwright/Chromium timing issue
// where a synthesized mouse click on a focusable control does not reliably
// reach React's event handler (reproducible even on pre-existing, unrelated
// controls such as the session schedule date picker button). Keyboard
// activation (focus + Enter) reliably triggers the same handlers and is an
// equally valid, fully accessible way to activate a button, so it is used
// here for controls that toggle Add/Edit Registration Link modal state.
async function activate(locator: Locator): Promise<void> {
  await locator.focus()
  await locator.press('Enter')
}

// ── Auth helper ───────────────────────────────────────────────────────────────

async function injectSessionCookie(context: BrowserContext): Promise<void> {
  const sessionToken = await encode({
    token: {
      name: 'E2E Test User',
      email: 'e2e-test@example.com',
      sub: 'e2e-test-user-id',
      accessToken: 'e2e-test-access-token',
    },
    secret: NEXTAUTH_SECRET,
  })

  await context.addCookies([
    {
      name: 'next-auth.session-token',
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ])
}

// ── US1 & US2: New session page (fully client-rendered) ──────────────────────

test.describe('New session — Add Registration Link modal', () => {
  test.beforeEach(async ({ context, page }) => {
    await injectSessionCookie(context)
    await page.goto(`/series/${SERIES_ID}/sessions/new`)
  })

  test('shows a compact action instead of a full-width URL textbox', async ({ page }) => {
    await expect(
      page.getByPlaceholder('https://teams.microsoft.com/registration/example'),
    ).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Add Registration Link' })).toBeVisible()
  })

  test('opens a compact modal with a labeled URL field, Done, and Cancel', async ({ page }) => {
    await activate(page.getByRole('button', { name: 'Add Registration Link' }))
    await expect(page.getByRole('dialog', { name: 'Add Registration Link' })).toBeVisible()
    await expect(page.getByLabel('Registration URL')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Done' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
  })

  test('a valid URL is saved and rendered as a compact Registration Link', async ({ page }) => {
    await activate(page.getByRole('button', { name: 'Add Registration Link' }))
    await page.getByLabel('Registration URL').fill(VALID_URL)
    await activate(page.getByRole('button', { name: 'Done' }))

    await expect(page.getByRole('dialog')).toHaveCount(0)
    const link = page.getByRole('link', { name: 'Registration Link' })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', VALID_URL)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
  })

  test('Cancel discards unsaved changes', async ({ page }) => {
    await activate(page.getByRole('button', { name: 'Add Registration Link' }))
    await page.getByLabel('Registration URL').fill(VALID_URL)
    await activate(page.getByRole('button', { name: 'Cancel' }))

    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Add Registration Link' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Registration Link' })).toHaveCount(0)
  })

  test('whitespace-only input is treated as clear, not an error', async ({ page }) => {
    await activate(page.getByRole('button', { name: 'Add Registration Link' }))
    const input = page.getByLabel('Registration URL')
    await input.fill('   ')
    await input.blur()

    await expect(page.getByRole('button', { name: 'Done' })).toBeEnabled()
    await activate(page.getByRole('button', { name: 'Done' }))

    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Add Registration Link' })).toBeVisible()
  })

  test('an overlong URL is rejected and Done is disabled', async ({ page }) => {
    await activate(page.getByRole('button', { name: 'Add Registration Link' }))
    const input = page.getByLabel('Registration URL')
    const overlong = `https://example.com/${'a'.repeat(2100)}`
    await input.fill(overlong)
    await input.blur()

    await expect(page.getByText(/2048 characters or fewer/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Done' })).toBeDisabled()
  })

  const invalidValues: Array<{ label: string; value: string }> = [
    { label: 'a relative path', value: '/register' },
    { label: 'a bare domain with no scheme', value: 'example.com/register' },
    { label: 'a malformed value', value: 'not a url' },
    { label: 'a javascript: scheme', value: 'javascript:alert(1)' },
    { label: 'a file: scheme', value: 'file:///etc/passwd' },
  ]

  for (const { label, value } of invalidValues) {
    test(`rejects ${label} with field-specific feedback and disables Done`, async ({ page }) => {
      await activate(page.getByRole('button', { name: 'Add Registration Link' }))
      const input = page.getByLabel('Registration URL')
      await input.fill(value)
      await input.blur()

      await expect(page.getByText(/http:\/\/ or https:\/\/|valid absolute URL/)).toBeVisible()
      await expect(page.getByRole('button', { name: 'Done' })).toBeDisabled()
    })
  }

  test('creating a session sends the registration URL to the create endpoint', async ({ page }) => {
    const captured: { body: { registrationUrl?: string | null } | null } = { body: null }

    await page.route(`**/api/v1/series/${SERIES_ID}/sessions`, async (route) => {
      if (route.request().method() === 'POST') {
        captured.body = route.request().postDataJSON()
        await route.fulfill({
          status: 201,
          json: {
            sessionId: SESSION_ID,
            seriesId: SERIES_ID,
            title: 'Intro Session',
            startsAt: '2026-09-01T17:00:00.000Z',
            endsAt: '2026-09-01T18:00:00.000Z',
            registrationUrl: VALID_URL,
          },
        })
      } else {
        await route.continue()
      }
    })

    await page.getByLabel('Title').fill('Intro Session')
    await activate(page.getByRole('button', { name: 'Add Registration Link' }))
    await page.getByLabel('Registration URL').fill(VALID_URL)
    await activate(page.getByRole('button', { name: 'Done' }))
    await page.getByRole('button', { name: 'Save' }).click()

    await page.waitForURL(`**/series/${SERIES_ID}`)
    expect(captured.body?.registrationUrl).toBe(VALID_URL)
  })
})

// ── US1, US2 & US3: Session detail page (fully client-rendered) ──────────────

test.describe('Session detail page — Registration Link', () => {
  test.beforeEach(async ({ context }) => {
    await injectSessionCookie(context)
  })

  function mockSession(registrationUrl: string | null) {
    return {
      sessionId: SESSION_ID,
      seriesId: SERIES_ID,
      title: 'Existing Session',
      startsAt: '2026-09-01T17:00:00.000Z',
      endsAt: '2026-09-01T18:00:00.000Z',
      registrationUrl,
    }
  }

  test('shows a compact Registration Link that opens in a new tab when a URL is stored', async ({
    page,
  }) => {
    await page.route(`**/api/v1/sessions/${SESSION_ID}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, json: mockSession(VALID_URL) })
      } else {
        await route.continue()
      }
    })
    await page.route(`**/api/v1/sessions/${SESSION_ID}/metrics`, (route) =>
      route.fulfill({ status: 404 }),
    )

    await page.goto(`/sessions/${SESSION_ID}`)

    const link = page.getByRole('link', { name: 'Registration Link' })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', VALID_URL)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
    await expect(page.getByRole('button', { name: 'Add Registration Link' })).toHaveCount(0)
  })

  test('shows Add Registration Link with no link affordance when no URL is stored', async ({
    page,
  }) => {
    await page.route(`**/api/v1/sessions/${SESSION_ID}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, json: mockSession(null) })
      } else {
        await route.continue()
      }
    })
    await page.route(`**/api/v1/sessions/${SESSION_ID}/metrics`, (route) =>
      route.fulfill({ status: 404 }),
    )

    await page.goto(`/sessions/${SESSION_ID}`)

    await expect(page.getByRole('button', { name: 'Add Registration Link' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Registration Link' })).toHaveCount(0)
  })

  test('Cancel on an edit preserves the previously saved link', async ({ page }) => {
    await page.route(`**/api/v1/sessions/${SESSION_ID}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, json: mockSession(VALID_URL) })
      } else {
        await route.continue()
      }
    })
    await page.route(`**/api/v1/sessions/${SESSION_ID}/metrics`, (route) =>
      route.fulfill({ status: 404 }),
    )

    await page.goto(`/sessions/${SESSION_ID}`)
    await activate(page.getByRole('button', { name: 'Edit registration link' }))
    await expect(page.getByRole('dialog', { name: 'Edit Registration Link' })).toBeVisible()
    await expect(page.getByLabel('Registration URL')).toHaveValue(VALID_URL)

    await page.getByLabel('Registration URL').fill('javascript:alert(1)')
    await activate(page.getByRole('button', { name: 'Cancel' }))

    const link = page.getByRole('link', { name: 'Registration Link' })
    await expect(link).toHaveAttribute('href', VALID_URL)
  })

  test('saving with an updated registration link sends the new value to the update endpoint', async ({
    page,
  }) => {
    const captured: { putBody: { registrationUrl?: string | null } | null } = { putBody: null }

    await page.route(`**/api/v1/sessions/${SESSION_ID}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, json: mockSession(VALID_URL) })
      } else if (route.request().method() === 'PUT') {
        captured.putBody = route.request().postDataJSON()
        await route.fulfill({ status: 200, json: mockSession(captured.putBody?.registrationUrl ?? null) })
      } else {
        await route.continue()
      }
    })
    await page.route(`**/api/v1/sessions/${SESSION_ID}/metrics`, (route) =>
      route.fulfill({ status: 404 }),
    )

    await page.goto(`/sessions/${SESSION_ID}`)
    await activate(page.getByRole('button', { name: 'Edit registration link' }))
    const newUrl = 'https://zoom.us/webinar/register/updated'
    await page.getByLabel('Registration URL').fill(newUrl)
    await activate(page.getByRole('button', { name: 'Done' }))
    await page.getByRole('button', { name: 'Save' }).click()

    await expect.poll(() => captured.putBody?.registrationUrl).toBe(newUrl)
  })
})

// ── US3: Series session list far-right Registration Link action ──────────────

test.describe('Series session list — Registration Link action', () => {
  let server: http.Server

  const MOCK_SERIES = {
    seriesId: SERIES_ID,
    title: 'Registration Link E2E Series',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-02T10:00:00.000Z',
  }

  const MOCK_SESSIONS = [
    {
      sessionId: 'session-with-link',
      title: 'Session With Link',
      startsAt: '2026-09-01T17:00:00.000Z',
      endsAt: '2026-09-01T18:00:00.000Z',
      totalRegistrations: 0,
      totalAttendees: 0,
      ownerDisplayName: 'E2E Test User',
      registrationUrl: VALID_URL,
    },
    {
      sessionId: 'session-without-link',
      title: 'Session Without Link',
      startsAt: '2026-09-02T17:00:00.000Z',
      endsAt: '2026-09-02T18:00:00.000Z',
      totalRegistrations: 0,
      totalAttendees: 0,
      ownerDisplayName: 'E2E Test User',
      registrationUrl: null,
    },
  ]

  const MOCK_METRICS = {
    seriesId: SERIES_ID,
    totalRegistrations: 0,
    totalAttendees: 0,
    uniqueRegistrantAccountDomains: 0,
    uniqueAccountsInfluenced: 0,
    warmAccounts: [] as { accountDomain: string; warmRule: 'W1' | 'W2' }[],
  }

  test.beforeAll(async () => {
    server = await new Promise<http.Server>((resolve) => {
      const s = http.createServer((req, res) => {
        const url = req.url ?? ''
        res.setHeader('Content-Type', 'application/json')

        if (url === `/api/v1/series/${SERIES_ID}`) {
          res.writeHead(200)
          res.end(JSON.stringify(MOCK_SERIES))
        } else if (url === `/api/v1/series/${SERIES_ID}/sessions`) {
          res.writeHead(200)
          res.end(JSON.stringify(MOCK_SESSIONS))
        } else if (url === `/api/v1/series/${SERIES_ID}/metrics`) {
          res.writeHead(200)
          res.end(JSON.stringify(MOCK_METRICS))
        } else {
          res.writeHead(404)
          res.end(JSON.stringify({ error: 'not_found' }))
        }
      })
      s.listen(5187, () => resolve(s))
    })
  })

  test.afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()))
    })
  })

  test.beforeEach(async ({ context }) => {
    await injectSessionCookie(context)
  })

  test('shows the Registration Link action only for sessions with a URL', async ({ page }) => {
    await page.goto(`/series/${SERIES_ID}`)

    await expect(
      page.getByRole('link', { name: 'Registration Link for Session With Link' }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Registration Link for Session Without Link' }),
    ).toHaveCount(0)
  })

  test('the Registration Link action opens the destination in a new tab safely', async ({
    page,
  }) => {
    await page.goto(`/series/${SERIES_ID}`)

    const link = page.getByRole('link', { name: 'Registration Link for Session With Link' })
    await expect(link).toHaveAttribute('href', VALID_URL)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
  })
})
