import { test, expect } from './fixtures'

// All backend responses are mocked (see fixtures.mockWaitlist) — these tests
// never touch the real Supabase waitlist table.
test.use({ seedStorage: false })

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    window.localStorage.setItem('oro_cookie_consent', 'declined')
  })
})

async function openModal(page) {
  await page.goto('/from-the-closet', { waitUntil: 'domcontentloaded' })
  await page.locator('a[href^="/newsletter/"]').first().click()
  await expect(page.locator('.modal-backdrop')).toBeVisible()
}

async function openModalAndSubmit(page, email) {
  await openModal(page)
  await page.locator('.email-input').fill(email)
  await page.locator('button[aria-label="Subscribe to newsletter"]').click()
}

test('successful signup shows the subscribed state', async ({ page, mockWaitlist }) => {
  const getBody = await mockWaitlist(201)
  await openModalAndSubmit(page, '  E2E-Test@Example.COM ')

  await expect(page.locator('.modal-success')).toContainText("you're subscribed")
  await expect(page.locator('.modal-done-btn')).toBeVisible()

  // Email is trimmed + lowercased and consent is always sent.
  const body = getBody()
  expect(body.email).toBe('e2e-test@example.com')
  expect(body.consent).toBe(true)
  expect(body.consent_timestamp).toBeTruthy()

  await page.locator('.modal-done-btn').click()
  await expect(page.locator('.modal-backdrop')).toHaveCount(0)
})

test('duplicate email shows already-on-list state', async ({ page, mockWaitlist }) => {
  await mockWaitlist(409)
  await openModalAndSubmit(page, 'dupe@example.com')
  await expect(page.locator('.modal-success')).toContainText("already on the list")
})

test('server error shows the retry message', async ({ page, mockWaitlist }) => {
  await mockWaitlist(500)
  await openModalAndSubmit(page, 'error@example.com')
  await expect(page.locator('.modal-error')).toContainText('Something went wrong. Try again.')
  // Form is still there for a retry.
  await expect(page.locator('.email-input')).toBeVisible()
})

test('close button dismisses the modal', async ({ page }) => {
  await openModal(page)
  await page.locator('.modal-close-x').click()
  await expect(page.locator('.modal-backdrop')).toHaveCount(0)
})

test('newsletter dialog keeps keyboard focus inside and fits a small screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await openModal(page)
  const dialog = page.getByRole('dialog', { name: 'Get style notes from Oro' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('Your email')).toBeFocused()
  const bounds = await dialog.boundingBox()
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320)
  await dialog.getByRole('button', { name: 'Close', exact: true }).focus()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('link', { name: 'Privacy Policy' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})
