import { test, expect } from './fixtures'

test('resending waits 60 seconds and refreshing verification returns to the phone step', async ({ page }) => {
  await page.clock.install()
  let sends = 0
  await page.route('**/api/beta-request', (route) => route.fulfill({ json: { enabled: true } }))
  await page.route('**/api/beta-verify', (route) => {
    if (route.request().postDataJSON().action === 'start') sends++
    return route.fulfill({ json: { ok: true } })
  })

  await page.goto('/signup?step=phone')
  await page.getByLabel('phone number', { exact: true }).fill('4165550123')
  await page.getByRole('button', { name: 'send my code' }).click()
  await expect(page).toHaveURL(/\/signup\?step=verify-phone$/)
  await expect(page.getByRole('button', { name: 'Send a new code in 60s' })).toBeDisabled()

  await page.clock.runFor(60000)
  await page.getByRole('button', { name: 'Send a new code', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Send a new code in 60s' })).toBeDisabled()
  expect(sends).toBe(2)

  await page.reload()
  await expect(page).toHaveURL(/\/signup\?step=phone$/)
  await expect(page.getByLabel('phone number', { exact: true })).toBeVisible()
})

for (const testerPage of [false, true]) {
  for (const failure of [429, 503]) {
    test(`${testerPage ? 'tester' : 'invite'} retries a ${failure} lookup without checking the consumed OTP again`, async ({ page }) => {
      let checks = 0
      let lookups = 0
      const proof = `${Math.floor(Date.now() / 1000) + 3600}.${'a'.repeat(64)}`
      await page.route('**/api/beta-request', (route) => route.fulfill({ json: { enabled: true } }))
      await page.route('**/api/beta-verify', (route) => {
        if (route.request().postDataJSON().action === 'check') checks++
        return route.fulfill({ status: checks > 1 ? 400 : 200, json: checks > 1 ? { code: 'invalid_code' } : { ok: true, proof } })
      })
      await page.route('**/api/beta-existing', (route) => {
        lookups++
        expect(route.request().postDataJSON().phone_verification).toBe(proof)
        return route.fulfill({ status: lookups === 1 ? failure : 200, json: lookups === 1 ? { code: failure === 429 ? 'rate_limited' : 'temporarily_unavailable' } : testerPage ? { ok: true, found: true, tester: true, referral_code: 'a'.repeat(64), referred_signups: 1 } : { ok: true, found: false } })
      })
      await page.goto(testerPage ? '/tester/referrals' : `/signup?ref=${'b'.repeat(64)}&step=phone`)
      await page.getByLabel('phone number', { exact: true }).fill('4165550123')
      await page.getByRole('button', { name: 'send my code' }).click()
      await page.getByLabel('Verification code').fill('123456')
      await page.getByRole('button', { name: testerPage ? 'see my progress' : 'verify my number' }).click()
      await expect(page.getByText(failure === 429 ? /wait a minute/ : testerPage ? /couldn’t check your progress/ : /couldn’t load your signup/)).toBeVisible()
      await page.getByRole('button', { name: testerPage ? 'see my progress' : 'check my signup' }).click()
      await expect(testerPage ? page.getByText('1 / 8 friends joined') : page.getByLabel('Your name', { exact: true })).toBeVisible()
      expect(checks).toBe(1)
      expect(lookups).toBe(2)
      if (!testerPage) expect(page.url()).toContain(`ref=${'b'.repeat(64)}`)
    })
  }
}

for (const count of [0, 7, 8, 9]) {
  test(`tester sees ${count} referrals and the correct reward state`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.route('**/api/beta-verify', (route) => route.fulfill({ json: { ok: true, proof: 'test-proof' } }))
    await page.route('**/api/beta-existing', (route) => route.fulfill({ json: { ok: true, found: true, tester: true, referral_code: 'a'.repeat(64), referred_signups: count } }))
    await page.goto('/tester/referrals')
    await page.getByLabel('phone number', { exact: true }).fill('4165550123')
    await page.getByRole('button', { name: 'send my code' }).click()
    await page.getByLabel('Verification code').fill('123456')
    await page.getByRole('button', { name: 'see my progress' }).click()
    await expect(page.getByText(`${count} / 8 friends joined`)).toBeVisible()
    await expect(page.getByLabel('Your invite link')).toHaveValue(/\/invite\?ref=a{64}$/)
    if (count >= 8) await expect(page.getByText(/Your hoodie \+ tote is unlocked!/)).toBeVisible()
    else await expect(page.getByText(`${8 - count} more ${8 - count === 1 ? 'friend' : 'friends'} to unlock your hoodie + tote.`)).toBeVisible()
    await expect(page.getByRole('img', { name: /Story graphic: i got her number/ })).toBeVisible()
    if (count === 0) {
      const downloadEvent = page.waitForEvent('download')
      await page.getByRole('button', { name: 'download image', exact: true }).click()
      const download = await downloadEvent
      expect(download.suggestedFilename()).toBe('oro-invite-story.png')
      await download.saveAs(testInfo.outputPath('oro-tester-story.png'))
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}

test('tester shares their referral link in Messages and shares the story through the native menu', async ({ page }) => {
  await page.addInitScript(() => {
    window.testShares = []
    Object.defineProperty(navigator, 'userAgent', { value: 'iPhone' })
    Object.defineProperty(navigator, 'canShare', { value: () => true })
    Object.defineProperty(navigator, 'share', { value: async (data) => {
      const file = data.files?.[0]
      const bitmap = file && await createImageBitmap(file)
      window.testShares.push(file ? { type: file.type, width: bitmap.width, height: bitmap.height } : data)
    } })
  })
  await page.route('**/api/beta-verify', (route) => route.fulfill({ json: { ok: true, proof: 'test-proof' } }))
  await page.route('**/api/beta-existing', (route) => route.fulfill({ json: { ok: true, found: true, tester: true, referral_code: 'b'.repeat(64), referred_signups: 0 } }))
  await page.goto('/tester/referrals')
  await page.getByLabel('phone number', { exact: true }).fill('4165550123')
  await page.getByRole('button', { name: 'send my code' }).click()
  await page.getByLabel('Verification code').fill('123456')
  await page.getByRole('button', { name: 'see my progress' }).click()
  const href = await page.getByRole('link', { name: 'share in messages' }).getAttribute('href')
  expect(decodeURIComponent(href)).toContain(`/invite?ref=${'b'.repeat(64)}`)
  expect(href).toMatch(/^sms:&body=/)
  await page.getByRole('button', { name: 'share invite', exact: true }).click()
  await page.getByRole('button', { name: 'save to photos' }).click()
  await expect.poll(() => page.evaluate(() => window.testShares.length)).toBe(2)
  const shared = await page.evaluate(() => window.testShares)
  expect(shared[0].url).toMatch(/\/invite\?ref=b{64}$/)
  expect(shared[1]).toEqual({ type: 'image/png', width: 1080, height: 1920 })
})

test('unapproved signup cannot open tester reward progress', async ({ page }) => {
  await page.route('**/api/beta-verify', (route) => route.fulfill({ json: { ok: true, proof: 'test-proof' } }))
  await page.route('**/api/beta-existing', (route) => route.fulfill({ json: { ok: true, found: true, tester: false } }))
  await page.goto('/tester/referrals')
  await page.getByLabel('phone number', { exact: true }).fill('4165550123')
  await page.getByRole('button', { name: 'send my code' }).click()
  await page.getByLabel('Verification code').fill('123456')
  await page.getByRole('button', { name: 'see my progress' }).click()
  await expect(page.getByText(/couldn’t find an approved tester/)).toBeVisible()
  await expect(page.getByLabel('Your invite link')).toHaveCount(0)
})

for (const unavailable of [false, true]) {
  test(`signup lookup ${unavailable ? 'failure stops submission' : 'recognizes an approved tester'}`, async ({ page }) => {
    let writes = 0
    await page.route('**/api/beta-request', (route) => {
      if (route.request().method() === 'POST') writes++
      return route.fulfill({ json: { enabled: true } })
    })
    await page.route('**/api/beta-verify', (route) => route.fulfill({ json: { ok: true, proof: 'test-proof' } }))
    await page.route('**/api/beta-existing', (route) => route.fulfill({ status: unavailable ? 503 : 200, json: unavailable ? { code: 'temporarily_unavailable' } : { ok: true, found: true, tester: true, request_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', referral_code: 'a'.repeat(64), signup_number: 38, referred_signups: 1, referral_completed_date: '' } }))
    await page.goto('/signup?step=phone')
    await page.getByLabel('phone number', { exact: true }).fill('4165550123')
    await page.getByRole('button', { name: 'send my code' }).click()
    await page.getByLabel('Verification code').fill('123456')
    await page.getByRole('button', { name: 'verify my number' }).click()
    if (unavailable) await expect(page.getByText('Your phone is verified, but we couldn’t load your signup. Try again.')).toBeVisible()
    else {
      await expect(page.getByText('1 / 8 friends joined')).toBeVisible()
      await expect(page.getByText(/#38|0 of 3 friends/)).toHaveCount(0)
    }
    expect(writes).toBe(0)
  })
}
