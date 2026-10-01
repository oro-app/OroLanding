import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import { createHash, createHmac, randomUUID } from 'node:crypto'
import { CONSENT_VERSION, FORM_VERSION, normalizeAnswers } from '../src/lib/betaContract.js'
import { signPhoneProof } from '../api/_lib/beta-phone-proof.js'

export const exampleAnswers = {
  name: 'Jamie', email: ' BETA-TEST@example.com ', phone: '(416) 555-0123', instagram: '@example',
  usedOro: 'No', outfitDays: '1–2 days', challenges: 'Combining colours',
  usualHelp: ['Ask a friend'], usualHelpOther: 'hidden',
  hopes: 'A second opinion', week: 'School and dinner', location: 'Toronto, Ontario',
  age: 'Prefer not to say', gender: 'Prefer not to say', source: 'Website', sourceOther: 'hidden', genderDescription: 'hidden', terms: true,
  futureBeta: false, marketing: true,
}
export const environment = {
  VERCEL: '1', NODE_ENV: 'production', VERCEL_URL: 'beta-test.vercel.app', BETA_SIGNUP_ENABLED: 'true',
  BETA_COHORT: 'september-2026', BETA_SUBMISSION_SECRET: 'test-only-secret-that-is-long-enough',
  BETA_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/test/exec', BETA_RATE_LIMIT_ID: 'beta-request',
  BETA_ALLOWED_ORIGINS: 'https://www.askoro.now',
  TWILIO_ACCOUNT_SID: `AC${'a'.repeat(32)}`, TWILIO_AUTH_TOKEN: 'test-token', TWILIO_VERIFY_SERVICE_SID: `VA${'b'.repeat(32)}`,
}
export const makeSubmission = (answers = exampleAnswers, key = randomUUID()) => ({
  submission_key: key, form_version: FORM_VERSION, consent_version: CONSENT_VERSION, answers,
  phone_verification: signPhoneProof(normalizeAnswers(answers).answers.phone, environment.BETA_SUBMISSION_SECRET),
})

export function googleWriter() {
  const state = { rows: [], archive: [], columns: 34, updates: [], appendCalls: 0, lockBusy: false, locked: false, throwAfterAppend: false, readFailure: false, dropWrite: false, appends: [], properties: {
    BETA_SUBMISSION_SECRET: environment.BETA_SUBMISSION_SECRET, BETA_COHORT: environment.BETA_COHORT, BETA_SHEET_ID: 'test-sheet',
  } }
  const context = vm.createContext({
    ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: (text) => ({ text, setMimeType() { return this } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => state.properties[key] }) },
    Utilities: { getUuid: randomUUID, DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' }, computeDigest: (algorithm, value) => [...createHash(algorithm).update(value).digest()], computeHmacSha256Signature: (value, secret) => [...createHmac('sha256', secret).update(value).digest()] },
    LockService: { getScriptLock: () => ({ tryLock() { state.locked = !state.lockBusy; return state.locked }, hasLock: () => state.locked, releaseLock() { state.locked = false } }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: (name) => name === 'Responses backup' ? { getLastRow: () => state.archive.length, getDataRange: () => ({ getValues: () => structuredClone(state.archive) }) } : ({
      getLastRow: () => state.rows.length,
      getLastColumn: () => state.rows[0].length,
      getMaxColumns: () => state.columns,
      insertColumnsAfter: (_after, count) => { state.columns += count },
      getRange(row, column, height, width) { return {
        getValues: () => Array.from({ length: height }, (_, offset) => Array.from({ length: width }, (_, index) => state.rows[row - 1 + offset]?.[column - 1 + index] ?? '')),
        setValues(values) { values.forEach((cells, offset) => { const target = state.rows[row - 1 + offset]; cells.forEach((value, index) => { target[column - 1 + index] = value }) }) },
      } },
    }) }) },
    Sheets: { Spreadsheets: { Values: {
      get() { if (state.readFailure) throw new Error('read failed'); return { values: structuredClone(state.rows) } },
      append(body, id, range, options) {
        if (!state.locked) throw new Error('append without lock')
        state.appendCalls++
        state.appends.push({ body, id, range, options })
        if (!state.dropWrite) state.rows.push(...structuredClone(body.values))
        if (state.throwAfterAppend) throw new Error('lost write acknowledgement')
        return { updates: { updatedRows: 1 } }
      },
      update(body, id, range, options) {
        if (!state.locked) throw new Error('update without lock')
        const cell = range.split('!')[1].split(':')[0]
        const match = /^([A-Z]+)(\d+)$/.exec(cell)
        const column = [...match[1]].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1
        const row = Number(match[2]) - 1
        state.updates.push({ body, range, options })
        body.values.forEach((cells, offset) => cells.forEach((value, index) => { state.rows[row + offset][column + index] = value }))
        return { updatedRows: 1 }
      },
    } } },
  })
  vm.runInContext(readFileSync(new URL('../integrations/beta-signup/dist/BetaContract.gs', import.meta.url), 'utf8'), context)
  vm.runInContext(readFileSync(new URL('../integrations/beta-signup/Code.js', import.meta.url), 'utf8'), context)
  state.rows.push(Array.from(context.responseHeaders()))
  const post = (body) => JSON.parse(context.doPost({ contentLength: Buffer.byteLength(JSON.stringify(body)), postData: { type: 'application/json', contents: JSON.stringify(body) } }).text)
  return { state, post, context, fetcher: async (_url, options) => Response.json(post(JSON.parse(options.body))) }
}
