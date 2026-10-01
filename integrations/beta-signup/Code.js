const SHEET_NAME = 'Responses'
const METADATA_HEADERS = ['request_id', 'submission_key', 'payload_hash', 'received_at', 'cohort', 'form_version', 'consent_version', 'consent_recorded_at']
const REFERRAL_HEADERS = ['referred_signups', 'referral_completed_date', 'accepted', 'referral_code', 'referred_by']

function responseHeaders() {
  return METADATA_HEADERS.concat(BetaContract.answerFields, REFERRAL_HEADERS, ['campaign_source'])
}

function jsonResult(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON)
}

function doGet() {
  return jsonResult({ ok: false, code: 'method_not_allowed' })
}

function doPost(event) {
  let lock
  try {
    if (!event || event.contentLength > BetaContract.MAX_BODY_BYTES || !event.postData || event.postData.type !== 'application/json') return jsonResult({ ok: false, code: 'invalid_request' })
    const input = JSON.parse(event.postData.contents)
    const properties = PropertiesService.getScriptProperties()
    const secret = properties.getProperty('BETA_SUBMISSION_SECRET')
    const cohort = properties.getProperty('BETA_COHORT')
    const sheetId = properties.getProperty('BETA_SHEET_ID')
    if (!secret || secret.length < 32 || !cohort || !sheetId || input.secret !== secret) return jsonResult({ ok: false, code: 'unauthorized' })
    if (input.action === 'count' && Object.keys(input).every((key) => ['secret', 'action'].includes(key))) {
      return jsonResult({ ok: true, count: readResponses(sheetId).length - 1 })
    }
    if (input.action === 'lookup' && input.cohort === cohort && Object.keys(input).every((key) => ['secret', 'cohort', 'action', 'phone'].includes(key)) && /^\+[1-9]\d{6,14}$/.test(input.phone)) {
      lock = LockService.getScriptLock()
      if (!lock.tryLock(5000)) return jsonResult({ ok: false, code: 'temporarily_unavailable' })
      const savedRows = readResponses(sheetId)
      reconcileReferrals(sheetId, savedRows)
      const rows = [savedRows[0], ...orderedSignups(savedRows)]
      const phoneIndex = responseHeaders().indexOf('phone')
      const matchIndex = rows.findIndex((row, index) => index > 0 && row[phoneIndex] === input.phone)
      if (matchIndex < 0) return jsonResult({ ok: true, found: false })
      const codeIndex = responseHeaders().indexOf('referral_code')
      const countIndex = responseHeaders().indexOf('referred_signups')
      const dateIndex = responseHeaders().indexOf('referral_completed_date')
      return jsonResult({ ok: true, found: true, request_id: rows[matchIndex][0], referral_code: rows[matchIndex][codeIndex], signup_number: matchIndex, referred_signups: Number(rows[matchIndex][countIndex] || 0), referral_completed_date: rows[matchIndex][dateIndex] || '' })
    }
    if (input.cohort !== cohort || Object.keys(input).some((key) => !['secret', 'cohort', 'submission_key', 'form_version', 'consent_version', 'answers', 'payload_hash', 'referral_code', 'campaign_source'].includes(key))) return jsonResult({ ok: false, code: 'invalid_request' })
    const validated = BetaContract.validateSubmission({ submission_key: input.submission_key, form_version: input.form_version, consent_version: input.consent_version, answers: input.answers, referral_code: input.referral_code, campaign_source: input.campaign_source })
    if (validated.code) return jsonResult({ ok: false, code: validated.code })
    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, BetaContract.canonicalPayload(validated.answers, cohort, input.referral_code || '', input.campaign_source || ''), Utilities.Charset.UTF_8)
      .map((byte) => ('0' + ((byte + 256) % 256).toString(16)).slice(-2)).join('')
    if (digest !== input.payload_hash) return jsonResult({ ok: false, code: 'invalid_request' })
    lock = LockService.getScriptLock()
    if (!lock.tryLock(5000)) return jsonResult({ ok: false, code: 'temporarily_unavailable' })
    let rows = readResponses(sheetId)
    const previous = findReceipt(rows, input.submission_key, digest)
    if (previous) {
      if (previous.ok) reconcileReferrals(sheetId, rows)
      return jsonResult(previous.ok ? findReceipt(rows, input.submission_key, digest) : previous)
    }
    const phoneIndex = responseHeaders().indexOf('phone')
    const codeIndex = responseHeaders().indexOf('referral_code')
    const earlierSignup = rows.slice(1).find((row) => row[phoneIndex] === validated.answers.phone)
    const firstSignup = !earlierSignup
    const referrer = firstSignup && rows.slice(1).find((row) => row[codeIndex] === input.referral_code && row[phoneIndex] !== validated.answers.phone)
    const referralCode = earlierSignup ? earlierSignup[codeIndex] : codeForPhone(validated.answers.phone, secret)
    const receivedAt = new Date().toISOString()
    const row = [Utilities.getUuid(), input.submission_key, digest, receivedAt, cohort, BetaContract.FORM_VERSION, BetaContract.CONSENT_VERSION, receivedAt]
      .concat(BetaContract.answerFields.map((name) => Array.isArray(validated.answers[name]) ? JSON.stringify(validated.answers[name]) : validated.answers[name]), [0, '', false, referralCode, referrer ? input.referral_code : '', input.campaign_source || 'direct'])
    try {
      // RAW keeps phone numbers and answers starting with = or + as literal text.
      Sheets.Spreadsheets.Values.append({ values: [row] }, sheetId, "'Responses'!A1", { valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS' })
    } catch {
      rows = readResponses(sheetId)
      const recovered = findReceipt(rows, input.submission_key, digest)
      if (recovered) {
        if (recovered.ok) reconcileReferrals(sheetId, rows)
        return jsonResult(recovered.ok ? findReceipt(rows, input.submission_key, digest) : recovered)
      }
      throw new Error('Save unconfirmed')
    }
    rows = readResponses(sheetId)
    const receipt = findReceipt(rows, input.submission_key, digest)
    if (!receipt) throw new Error('Save unconfirmed')
    if (receipt.ok) reconcileReferrals(sheetId, rows)
    return jsonResult(receipt.ok ? findReceipt(rows, input.submission_key, digest) : receipt)
  } catch {
    return jsonResult({ ok: false, code: 'temporarily_unavailable' })
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock()
  }
}

function codeForPhone(phone, secret) {
  return Utilities.computeHmacSha256Signature(phone, secret, Utilities.Charset.UTF_8)
    .map((byte) => ('0' + ((byte + 256) % 256).toString(16)).slice(-2)).join('')
}

function readResponses(sheetId) {
  const rows = Sheets.Spreadsheets.Values.get(sheetId, "'Responses'!A:AZ", { valueRenderOption: 'UNFORMATTED_VALUE' }).values || []
  if (JSON.stringify(rows[0]) !== JSON.stringify(responseHeaders())) throw new Error('Sheet not configured')
  return rows
}

function findReceipt(rows, key, hash) {
  const matches = rows.slice(1).filter((row) => row[1] === key)
  if (!matches.length) return null
  if (matches.length !== 1 || !BetaContract.UUID4.test(matches[0][0])) throw new Error('Invalid receipt')
  if (matches[0][2] !== hash) return { ok: false, code: 'submission_conflict' }
  const phoneIndex = responseHeaders().indexOf('phone')
  const position = orderedSignups(rows).findIndex((row) => row[phoneIndex] === matches[0][phoneIndex]) + 1
  return { ok: true, request_id: matches[0][0], submission_key: key, payload_hash: hash, referral_code: matches[0][responseHeaders().indexOf('referral_code')], signup_number: position }
}

function orderedSignups(rows) {
  const phoneIndex = responseHeaders().indexOf('phone')
  const dateIndex = responseHeaders().indexOf('referral_completed_date')
  const byPhone = new Map()
  const chronological = rows.slice(1).sort((a, b) => String(a[3]).localeCompare(String(b[3])))
  for (const row of chronological) {
    if (!byPhone.has(row[phoneIndex])) byPhone.set(row[phoneIndex], row)
  }
  return [...byPhone.values()].sort((a, b) => {
    const aDate = a[dateIndex] || ''
    const bDate = b[dateIndex] || ''
    return Number(Boolean(bDate)) - Number(Boolean(aDate)) || String(aDate || a[3]).localeCompare(String(bDate || b[3]))
  })
}

function reconcileReferrals(sheetId, rows) {
  const headers = responseHeaders()
  const phoneIndex = headers.indexOf('phone')
  const codeIndex = headers.indexOf('referral_code')
  const byIndex = headers.indexOf('referred_by')
  const countIndex = headers.indexOf('referred_signups')
  const dateIndex = headers.indexOf('referral_completed_date')
  const signups = orderedSignups(rows)
  const codes = new Set(signups.map((row) => row[byIndex]).filter(Boolean))
  for (const code of codes) {
    const owner = signups.find((row) => row[codeIndex] === code)
    const ownerIndex = rows.indexOf(owner)
    if (ownerIndex < 0) continue
    const referrals = signups.filter((row) => row[byIndex] === code && row[phoneIndex] !== owner[phoneIndex])
      .sort((a, b) => String(a[3]).localeCompare(String(b[3])))
    const count = referrals.length
    if (Number(owner[countIndex] || 0) === count && (count < 3 || owner[dateIndex])) continue
    const date = owner[dateIndex] || (count >= 3 ? referrals[2][3] : '')
    const column = countIndex + 1
    Sheets.Spreadsheets.Values.update({ values: [[count, date]] }, sheetId, "'Responses'!" + columnLetter(column) + (ownerIndex + 1) + ':' + columnLetter(column + 1) + (ownerIndex + 1), { valueInputOption: 'RAW' })
    owner[countIndex] = count
    owner[dateIndex] = date
  }
}

function columnLetter(number) {
  let letters = ''
  while (number) { number--; letters = String.fromCharCode(65 + number % 26) + letters; number = Math.floor(number / 26) }
  return letters
}

function setupResponseSheet() {
  const sheetId = PropertiesService.getScriptProperties().getProperty('BETA_SHEET_ID')
  const book = SpreadsheetApp.openById(sheetId)
  const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME)
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, responseHeaders().length).setValues([responseHeaders()])
    sheet.setFrozenRows(1)
    return
  }
  const oldHeaders = METADATA_HEADERS.concat(BetaContract.answerFields)
  const current = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  if (JSON.stringify(current) === JSON.stringify(responseHeaders())) return
  if (JSON.stringify(current) === JSON.stringify(oldHeaders)) {
    const count = sheet.getLastRow() - 1
    const phones = count ? sheet.getRange(2, oldHeaders.indexOf('phone') + 1, count, 1).getValues() : []
    const secret = PropertiesService.getScriptProperties().getProperty('BETA_SUBMISSION_SECRET')
    if (!secret || secret.length < 32) throw new Error('BETA_SUBMISSION_SECRET is missing')
    sheet.getRange(1, oldHeaders.length + 1, 1, REFERRAL_HEADERS.length).setValues([REFERRAL_HEADERS])
    if (count) sheet.getRange(2, oldHeaders.length + 1, count, REFERRAL_HEADERS.length)
      .setValues(phones.map(([phone]) => [0, '', false, codeForPhone(phone, secret), '']))
  } else if (JSON.stringify(current) !== JSON.stringify(oldHeaders.concat(REFERRAL_HEADERS))) {
    throw new Error('Unexpected response headers')
  }
  const sourceColumn = oldHeaders.length + REFERRAL_HEADERS.length + 1
  sheet.getRange(1, sourceColumn, 1, 1).setValues([['campaign_source']])
  if (sheet.getLastRow() > 1) sheet.getRange(2, sourceColumn, sheet.getLastRow() - 1, 1)
    .setValues(Array.from({ length: sheet.getLastRow() - 1 }, () => ['unknown']))
}
