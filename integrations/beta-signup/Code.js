const SHEET_NAME = 'Responses'
const METADATA_HEADERS = ['request_id', 'submission_key', 'payload_hash', 'received_at', 'cohort', 'form_version', 'consent_version', 'consent_recorded_at']

function responseHeaders() {
  return METADATA_HEADERS.concat(BetaContract.answerFields)
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
    if (input.cohort !== cohort || Object.keys(input).some((key) => !['secret', 'cohort', 'submission_key', 'form_version', 'consent_version', 'answers', 'payload_hash'].includes(key))) return jsonResult({ ok: false, code: 'invalid_request' })
    const validated = BetaContract.validateSubmission({ submission_key: input.submission_key, form_version: input.form_version, consent_version: input.consent_version, answers: input.answers })
    if (validated.code) return jsonResult({ ok: false, code: validated.code })
    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, BetaContract.canonicalPayload(validated.answers, cohort), Utilities.Charset.UTF_8)
      .map((byte) => ('0' + ((byte + 256) % 256).toString(16)).slice(-2)).join('')
    if (digest !== input.payload_hash) return jsonResult({ ok: false, code: 'invalid_request' })
    lock = LockService.getScriptLock()
    if (!lock.tryLock(5000)) return jsonResult({ ok: false, code: 'temporarily_unavailable' })
    const previous = findReceipt(sheetId, input.submission_key, digest)
    if (previous) return jsonResult(previous)
    const receivedAt = new Date().toISOString()
    const row = [Utilities.getUuid(), input.submission_key, digest, receivedAt, cohort, BetaContract.FORM_VERSION, BetaContract.CONSENT_VERSION, receivedAt]
      .concat(BetaContract.answerFields.map((name) => Array.isArray(validated.answers[name]) ? JSON.stringify(validated.answers[name]) : validated.answers[name]))
    try {
      // RAW keeps phone numbers and answers starting with = or + as literal text.
      Sheets.Spreadsheets.Values.append({ values: [row] }, sheetId, "'Responses'!A1", { valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS' })
    } catch {
      const recovered = findReceipt(sheetId, input.submission_key, digest)
      if (recovered) return jsonResult(recovered)
      throw new Error('Save unconfirmed')
    }
    const receipt = findReceipt(sheetId, input.submission_key, digest)
    if (!receipt) throw new Error('Save unconfirmed')
    return jsonResult(receipt)
  } catch {
    return jsonResult({ ok: false, code: 'temporarily_unavailable' })
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock()
  }
}

function findReceipt(sheetId, key, hash) {
  const rows = Sheets.Spreadsheets.Values.get(sheetId, "'Responses'!A:AZ", { valueRenderOption: 'UNFORMATTED_VALUE' }).values || []
  if (JSON.stringify(rows[0]) !== JSON.stringify(responseHeaders())) throw new Error('Sheet not configured')
  const matches = rows.slice(1).filter((row) => row[1] === key)
  if (!matches.length) return null
  if (matches.length !== 1 || !BetaContract.UUID4.test(matches[0][0])) throw new Error('Invalid receipt')
  if (matches[0][2] !== hash) return { ok: false, code: 'submission_conflict' }
  return { ok: true, request_id: matches[0][0], submission_key: key, payload_hash: hash }
}

function setupResponseSheet() {
  const sheetId = PropertiesService.getScriptProperties().getProperty('BETA_SHEET_ID')
  const book = SpreadsheetApp.openById(sheetId)
  const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME)
  if (sheet.getLastRow() !== 0) throw new Error('Responses already exists; leave its rows and headers unchanged.')
  sheet.getRange(1, 1, 1, responseHeaders().length).setValues([responseHeaders()])
  sheet.setFrozenRows(1)
}
