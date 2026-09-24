import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { CONSENT_VERSION, FORM_VERSION } from '../src/lib/betaContract.js'

export const exampleAnswers = {
  name: 'Jamie', email: ' BETA-TEST@example.com ', phone: '(416) 555-0123', instagram: '@example',
  usedOro: 'No', outfitDays: '1–2 days', occasion: '=1+1', uncertainty: 'Shoes with jeans',
  challenges: 'Combining colours', usualHelp: ['Ask a friend'], usualHelpOther: 'hidden',
  hopes: 'A second opinion', week: 'School and dinner', location: 'Toronto, Ontario',
  source: 'Website', sourceOther: 'hidden', genderDescription: 'hidden', terms: true,
  futureBeta: false, marketing: true,
}
export const environment = {
  VERCEL: '1', NODE_ENV: 'production', VERCEL_URL: 'beta-test.vercel.app', BETA_SIGNUP_ENABLED: 'true',
  BETA_COHORT: 'september-2026', BETA_SUBMISSION_SECRET: 'test-only-secret-that-is-long-enough',
  BETA_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/test/exec', BETA_RATE_LIMIT_ID: 'beta-request',
  BETA_ALLOWED_ORIGINS: 'https://buildingoro.ca',
}
export const makeSubmission = (answers = exampleAnswers, key = randomUUID()) => ({
  submission_key: key, form_version: FORM_VERSION, consent_version: CONSENT_VERSION, answers,
})

export function googleWriter() {
  const state = { rows: [], appendCalls: 0, lockBusy: false, locked: false, throwAfterAppend: false, readFailure: false, dropWrite: false, appends: [], properties: {
    BETA_SUBMISSION_SECRET: environment.BETA_SUBMISSION_SECRET, BETA_COHORT: environment.BETA_COHORT, BETA_SHEET_ID: 'test-sheet',
  } }
  const context = vm.createContext({
    ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: (text) => ({ text, setMimeType() { return this } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => state.properties[key] }) },
    Utilities: { getUuid: randomUUID, DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' }, computeDigest: (algorithm, value) => [...createHash(algorithm).update(value).digest()] },
    LockService: { getScriptLock: () => ({ tryLock() { state.locked = !state.lockBusy; return state.locked }, hasLock: () => state.locked, releaseLock() { state.locked = false } }) },
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
    } } },
  })
  vm.runInContext(readFileSync(new URL('../integrations/beta-signup/dist/BetaContract.gs', import.meta.url), 'utf8'), context)
  vm.runInContext(readFileSync(new URL('../integrations/beta-signup/Code.js', import.meta.url), 'utf8'), context)
  state.rows.push(Array.from(context.responseHeaders()))
  const post = (body) => JSON.parse(context.doPost({ contentLength: Buffer.byteLength(JSON.stringify(body)), postData: { type: 'application/json', contents: JSON.stringify(body) } }).text)
  return { state, post, context, fetcher: async (_url, options) => Response.json(post(JSON.parse(options.body))) }
}
