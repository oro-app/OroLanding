export async function next(page) {
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
}

export async function fillContact(page) {
  await page.getByLabel('Email address', { exact: true }).fill('beta-test@example.com')
  await page.getByLabel('Phone number', { exact: true }).fill('+1 (416) 555-0123')
}

export async function fillRequired(page) {
  await page.getByLabel('Your name', { exact: true }).fill('Jamie')
  await next(page)
  await fillContact(page)
  await next(page)
  await page.getByRole('radio', { name: 'No', exact: true }).check()
  await next(page)
  await page.getByRole('radio', { name: '1–2 days', exact: true }).check()
  await next(page)
  await page.getByLabel('What were you getting dressed for?', { exact: true }).fill('A day at school')
  await page.getByLabel('What were you unsure about?', { exact: true }).fill('Which shoes work with my jeans')
  await next(page)
  await page.getByLabel('Your experience', { exact: true }).fill('Combining colours')
  await next(page)
  await page.getByRole('checkbox', { name: 'Ask a friend', exact: true }).check()
  await next(page)
  await page.getByLabel('What you have in mind', { exact: true }).fill('A second opinion')
  await next(page)
  await page.getByLabel('Your plans', { exact: true }).fill('School and dinner with friends')
  await next(page)
  await page.getByLabel('City and province', { exact: true }).fill('Toronto, Ontario')
  await next(page)
  await next(page)
  await next(page)
  await page.getByRole('radio', { name: 'Website', exact: true }).check()
  await next(page)
}
