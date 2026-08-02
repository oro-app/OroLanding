import { test, expect } from './fixtures'

// All backend responses are mocked (see fixtures.mockWaitlist) — these tests
// never touch the real Supabase waitlist table.

async function openModalAndSubmit(page, email) {
  await page.goto('/')
  await page.locator('.jr-subscribe').click()
  await expect(page.locator('.modal-backdrop')).toBeVisible()
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
  await page.goto('/')
  await page.locator('.jr-subscribe').click()
  await expect(page.locator('.modal-backdrop')).toBeVisible()
  await page.locator('.modal-close-x').click()
  await expect(page.locator('.modal-backdrop')).toHaveCount(0)
})
