import { test, expect } from './fixtures'
import { readFileSync } from 'node:fs'

const definitions = JSON.parse(readFileSync(new URL('../test/fixtures/feedback-forms.json', import.meta.url)))

const token = 'synthetic-form-invitation'
const id = '11111111-1111-4111-8111-111111111111'
const endpoint = '**/agent2/beta-feedback/**'
const stored = (page) => page.evaluate(() => JSON.parse(sessionStorage.getItem('oro_feedback_session')))
const form = (kind = 'daily', questions = definitions[kind]) => ({ invitation_id: id, survey_kind: kind, survey_version: 1,
  status: 'open', submission_id: null, receipt: null, expires_at: '2020-01-01T00:00:00Z', questions,
  context: { beta_label: 'Oro beta', task_label: 'Your Oro task', local_date: '2026-09-24', timezone: 'America/Toronto' } })
const button = (page) => page.getByRole('button', { name: /^(Continue|Review answers)$/ })
const prompt = (kind, questionId) => definitions[kind].find((question) => question.id === questionId).prompt

async function advanceTo(page, kind, target) {
  for (let attempts = 0; attempts < 25; attempts++) {
    if (await page.getByRole('heading', { name: prompt(kind, target), exact: true }).isVisible()) return
    const heading = await page.locator('#feedback-question-title').innerText()
    const question = definitions[kind].find((item) => item.prompt === heading)
    expect(question, `Unexpected step: ${heading}`).toBeTruthy()
    if (question.required) {
      if (question.type === 'text') await page.getByRole('textbox').first().fill('Required answer')
      else await page.getByRole('radio').first().check()
    }
    await button(page).click()
  }
  throw new Error(`Did not reach ${target}`)
}

for (const kind of ['daily', 'task', 'task-no-outfit', 'final']) {
  test(`invitation completes the ${kind} survey and clears private state after confirmation`, async ({ page }) => {
    const calls = [], errors = [], writes = []
    page.on('request', (request) => { if (/google-analytics|googletagmanager|posthog/.test(request.url())) calls.push(request.url()) })
    page.on('pageerror', (error) => errors.push(error.message))
    const survey = kind.startsWith('task') ? 'task' : kind
    const questions = definitions[survey].filter((question) => kind !== 'task-no-outfit' || question.id !== 'R9')
    await page.route(endpoint, (route) => {
      if (route.request().method() === 'GET') return route.fulfill({ json: form(survey, questions) })
      writes.push(route.request().postDataJSON())
      return route.fulfill({ json: { submission_id: route.request().url().split('/').at(-1), submitted_at: '2026-09-25T00:00:00Z' } })
    })
    await page.goto(`/feedback#token=${token}`)
    await expect(page.getByRole('heading', { name: 'Beta feedback', exact: true })).toBeVisible()
    await expect(page.locator('input:checked')).toHaveCount(0)
    await expect(page.locator('#feedback-question-title')).not.toBeFocused()
    const visited = []
    for (let steps = 0; steps < 25 && await button(page).isVisible(); steps++) {
      const heading = await page.locator('#feedback-question-title').innerText()
      visited.push(heading)
      const question = definitions[survey].find((item) => item.prompt === heading)
      if (question.required) {
        if (question.type === 'text') await page.getByRole('textbox').first().fill('Sample response')
        else await page.getByRole('radio').first().check()
      }
      await button(page).click()
    }
    await expect(page.getByRole('heading', { name: 'Ready to send your feedback?' })).toBeVisible()
    if (kind === 'task-no-outfit') expect(visited).not.toContain(prompt('task', 'R9'))
    if (kind === 'task') expect(visited).toContain(prompt('task', 'R9'))
    await page.getByRole('button', { name: 'Send feedback', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('Your feedback is saved')
    expect(writes).toHaveLength(1)
    expect(writes[0].survey_version).toBe(1)
    expect(await stored(page)).toBeNull()
    expect(calls).toEqual([])
    expect(errors).toEqual([])
  })
}

test('question transitions preserve keyboard typing and honor reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.route(endpoint, (route) => route.fulfill({ json: form() }))
  await page.goto(`/feedback#token=${token}`)
  await advanceTo(page, 'daily', 'D13')
  await expect(page.getByRole('heading', { name: prompt('daily', 'D13'), exact: true })).toBeFocused()
  await expect(page.locator('#feedback-question-title')).toHaveCSS('outline-style', 'none')
  await page.keyboard.press('Tab')
  const answer = page.getByRole('textbox')
  await expect(answer).toBeFocused()
  await expect(answer).toHaveAttribute('autocapitalize', 'sentences')
  await expect(answer).toHaveAttribute('spellcheck', 'true')
  await answer.pressSequentially('A small improvement. Another thought.', { delay: 8 })
  await expect(answer).toHaveValue('A small improvement. Another thought.')
  await expect(answer).toBeFocused()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.feedback-step')).toHaveCSS('animation-name', 'none')
  expect(await page.locator('.feedback-prompt-char').evaluateAll((letters) => letters.every((letter) => {
    const style = getComputedStyle(letter)
    return style.animationName === 'none' && style.opacity === '1'
  }))).toBe(true)
  await button(page).click()
  await page.getByRole('button', { name: 'Review answers' }).click()
  await expect(page.getByRole('progressbar', { name: 'Feedback progress' })).toHaveAttribute('aria-valuetext', 'Ready to review')
  await expect(page.locator('.feedback-review')).toContainText('A small improvement. Another thought.')
})

test('daily branching clears old answers, validates accessibly, and submits IDs with trimmed text', async ({ page }) => {
  let payload
  await page.route(endpoint, async (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: form() })
    payload = route.request().postDataJSON()
    return route.fulfill({ json: { submission_id: route.request().url().split('/').at(-1), submitted_at: '2026-09-25T00:00:00Z' } })
  })
  await page.goto(`/feedback#token=${token}`)
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('radio').first()).toBeFocused()
  await expect(page.getByText('Choose an answer.', { exact: true })).toBeVisible()
  await page.getByRole('radio', { name: 'No', exact: true }).check()
  await button(page).click()
  await page.getByRole('radio', { name: 'Other', exact: true }).check()
  await button(page).click()
  await expect(page.getByRole('textbox', { name: 'Please explain your Other answer' })).toBeFocused()
  await page.getByRole('textbox').fill('old reason')
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page.getByRole('radio', { name: 'Yes, with changes', exact: true }).check()
  await button(page).click()
  await page.getByRole('textbox').fill('old changes')
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page.getByRole('radio', { name: 'No', exact: true }).check()
  await button(page).click()
  await expect(page.locator('input:checked')).toHaveCount(0)
  expect((await stored(page)).draft.D5).toBeUndefined()
  await page.getByRole('radio', { name: 'I was planning an outfit for another day', exact: true }).check()
  await button(page).click()
  await page.getByRole('radio', { name: 'Much easier', exact: true }).check()
  await button(page).click()
  await page.getByRole('textbox').pressSequentially('  private answer  ')
  await expect(page.getByRole('textbox')).toBeFocused()
  await button(page).click()
  await button(page).click()
  await expect(page.getByRole('heading', { name: 'Ready to send your feedback?' })).toBeVisible()
  await expect(page.locator('.feedback-review')).not.toContainText('old reason')
  await expect(page.locator('.feedback-review')).not.toContainText('old changes')
  await page.getByRole('button', { name: 'Send feedback', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Your feedback is saved')
  expect(payload).toEqual({ survey_version: 1, answers: { D3: { choice: 'no' }, D6: { choice: 'planned_for_later' }, D7: { choice: 'much_easier' }, D13: { text: 'private answer' } } })
  expect(await stored(page)).toBeNull()
})

test('final Depends and optional payment branches support Other, comments, clearing and review edits', async ({ page }) => {
  await page.route(endpoint, (route) => route.fulfill({ json: form('final') }))
  await page.goto(`/feedback#token=${token}`)
  await advanceTo(page, 'final', 'F17')
  await page.getByRole('radio', { name: 'Depends', exact: true }).check()
  await page.getByRole('textbox', { name: 'Add an explanation (optional)' }).fill('main reason')
  await button(page).click()
  await button(page).click()
  await expect(page.getByRole('textbox')).toBeFocused()
  await page.getByRole('textbox').fill('depends on consistency')
  await button(page).click()
  await advanceTo(page, 'final', 'F21')
  await page.getByRole('radio', { name: 'Yes', exact: true }).check()
  await button(page).click()
  await page.getByRole('checkbox', { name: 'Other', exact: true }).check()
  await page.getByRole('checkbox', { name: 'It depends on the price', exact: true }).check()
  await page.getByRole('textbox', { name: 'Please explain your Other answer' }).fill('payment reason')
  await page.getByRole('textbox', { name: 'Add an explanation (optional)' }).fill('payment comment')
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page.getByRole('button', { name: 'Clear answer', exact: true }).click()
  expect((await stored(page)).draft.F21_reasons).toBeUndefined()
  await button(page).click()
  await expect(page.getByRole('heading', { name: prompt('final', 'F22'), exact: true })).toBeVisible()
  await button(page).click()
  await expect(page.locator('.feedback-review')).toContainText('depends on consistency')
  await expect(page.locator('.feedback-review')).not.toContainText(prompt('final', 'F19'))
  await expect(page.locator('.feedback-review')).not.toContainText('payment reason')
  await page.getByRole('button', { name: 'Edit answer 1', exact: true }).click()
  await expect(page.getByRole('heading', { name: prompt('final', 'F1'), exact: true })).toBeFocused()
})

test('draft refresh restores the step and a new invitation starts empty', async ({ page }) => {
  await page.clock.install()
  await page.route(endpoint, (route) => route.fulfill({ json: form() }))
  await page.goto(`/feedback#token=${token}`)
  await page.getByRole('radio', { name: 'Yes, with changes', exact: true }).check()
  await button(page).click()
  await page.getByRole('textbox').fill('  saved in this tab  ')
  await page.reload()
  await page.clock.fastForward(15000)
  await expect(page.getByRole('textbox')).toHaveValue('  saved in this tab  ')
  await page.evaluate(() => { location.hash = 'token=another-invitation' })
  await expect(page.getByRole('heading', { name: prompt('daily', 'D3'), exact: true })).toBeVisible()
  expect((await stored(page)).draft).toEqual({})
})

test('uncertain submission stays locked across reload and retries the identical write', async ({ page }) => {
  await page.clock.install()
  const small = form('final', [definitions.final[0]])
  const writes = []
  await page.route(endpoint, async (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: small })
    writes.push({ url: route.request().url(), body: route.request().postData() })
    if (writes.length === 1) return route.abort()
    return route.fulfill({ json: { submission_id: writes.at(-1).url.split('/').at(-1), submitted_at: '2026-09-25T00:00:00Z' } })
  })
  await page.goto(`/feedback#token=${token}`)
  await page.getByRole('textbox').fill('keep this response')
  await button(page).click()
  await page.getByRole('button', { name: 'Send feedback', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('answers are locked')
  await expect(page.getByRole('textbox')).toHaveCount(0)
  await page.reload()
  await page.clock.fastForward(60000)
  await expect(page.getByRole('button', { name: 'Retry sending' })).toBeVisible()
  await page.getByRole('button', { name: 'Retry sending' }).click()
  await expect(page.getByRole('status')).toContainText('Your feedback is saved')
  expect(writes).toHaveLength(2)
  expect(writes[1]).toEqual(writes[0])
})

test('accepted submission shows pending until receipt; a fresh tab only polls', async ({ page, context }) => {
  await page.clock.install()
  let accepted, confirmed = false, puts = 0
  await context.route(endpoint, (route) => {
    if (route.request().method() === 'PUT') {
      puts++
      accepted = route.request().url().split('/').at(-1)
      return route.fulfill({ status: 202, json: { status: 'saving', submission_id: accepted } })
    }
    const data = form('final', [definitions.final[0]])
    if (accepted) Object.assign(data, { status: confirmed ? 'submitted' : 'saving', questions: [], submission_id: accepted,
      receipt: confirmed ? { submission_id: accepted, submitted_at: '2026-09-25T00:00:00Z' } : null })
    return route.fulfill({ json: data })
  })
  await page.goto(`/feedback#token=${token}`)
  await button(page).click()
  await page.getByRole('button', { name: 'Send feedback', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('still saving')
  await expect(page.getByRole('button', { name: /Send feedback|Retry sending/ })).toHaveCount(0)
  const other = await context.newPage()
  await other.goto(`/feedback#token=${token}`)
  await expect(other.getByRole('status')).toContainText('still saving')
  expect(puts).toBe(1)
  confirmed = true
  await page.clock.fastForward(15000)
  await expect(page.getByRole('status')).toContainText('Your feedback is saved')
  await other.close()
})

test('mobile layouts and keyboard navigation stay usable with long Other text', async ({ page }) => {
  await page.route(endpoint, (route) => route.fulfill({ json: form() }))
  await page.goto(`/feedback#token=${token}`)
  await page.getByRole('radio', { name: 'No', exact: true }).focus()
  await page.keyboard.press('Space')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('radio', { name: 'Other', exact: true }).check()
  await page.getByRole('textbox').fill('x'.repeat(2001))
  await button(page).click()
  await expect(page.getByText('Please keep your answer to 2,000 characters.', { exact: true })).toBeVisible()
  await expect(page.getByRole('textbox')).toBeFocused()
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    for (const option of await page.locator('.feedback-option').all()) expect((await option.boundingBox()).height).toBeGreaterThanOrEqual(44)
  }
})

test('backend field rejection preserves input, focuses its error, and keeps answers out of analytics', async ({ page }) => {
  const requests = [], errors = []
  await page.addInitScript(() => {
    localStorage.setItem('oro_cookie_consent', 'accepted')
    window.dataLayer = []
    window.gtag = (...args) => window.dataLayer.push(args)
  })
  page.on('request', (request) => requests.push(request.url()))
  page.on('pageerror', (error) => errors.push(error.message))
  let rejected = false
  await page.route(endpoint, (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: form('final', [definitions.final[0]]) })
    if (!rejected) {
      rejected = true
      return route.fulfill({ status: 422, json: { detail: { code: 'invalid_answers', question_ids: ['F1'], message: 'private-marker' } } })
    }
    return route.fulfill({ json: { submission_id: route.request().url().split('/').at(-1), submitted_at: '2026-09-25T00:00:00Z' } })
  })
  await page.goto(`/feedback#token=${token}`)
  await page.getByRole('textbox').fill('private answer')
  await button(page).click()
  await page.getByRole('button', { name: 'Send feedback', exact: true }).click()
  await expect(page.getByRole('textbox')).toBeFocused()
  await expect(page.getByRole('textbox')).toHaveValue('private answer')
  await expect(page.getByText('Please check this answer.', { exact: true })).toBeVisible()
  await expect(page.locator('body')).not.toContainText('private-marker')
  const captured = await page.evaluate(() => JSON.stringify([localStorage, document.cookie, window.dataLayer]))
  expect(captured).not.toContain('private answer')
  expect(captured).not.toContain(token)
  expect(requests.filter((url) => /google-analytics|googletagmanager|posthog/.test(url))).toEqual([])
  expect(requests.join()).not.toContain(token)
  await page.getByRole('textbox').fill('corrected')
  await button(page).click()
  await page.getByRole('button', { name: 'Send feedback', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Your feedback is saved')
  expect(errors).toEqual([])
})

test('legacy demo links no longer bypass the invitation flow', async ({ page }) => {
  await page.goto('/feedback?demo=daily')
  await expect(page.getByRole('status')).toContainText('Open your personal feedback link')
  await expect(page.getByRole('link', { name: 'Back to Oro', exact: true })).toHaveAttribute('href', '/')
  await expect(page.getByRole('textbox')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Feedback demo', exact: true })).toHaveCount(0)
})
