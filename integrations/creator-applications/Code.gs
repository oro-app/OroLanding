const SHEET_NAME = 'Applications';
const HEADERS = [
  'Submitted at',
  'Submission ID',
  'Name',
  'Email',
  'Example video URL',
  'Profile or portfolio URL',
  'Contribution to video',
  'Interest',
  'Availability',
];
const SUBMISSION_ID_COLUMN = 2;
const MAX_REQUEST_LENGTH = 50000;
const UUID_V4 = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const FIELD_LIMITS = {
  name: 120,
  email: 254,
  videoUrl: 2048,
  profileUrl: 2048,
  role: 1000,
  interest: 1500,
  availability: 7,
};

function doPost(event) {
  try {
    const payload = readPayload(event);
    if (!payload) return reply(false, 'invalid_request');

    const properties = PropertiesService.getScriptProperties();
    const secret = properties.getProperty('CREATOR_APPLICATION_SECRET');
    const spreadsheetId = properties.getProperty('CREATOR_APPLICATION_SPREADSHEET_ID');
    if (!secret || !spreadsheetId) return reply(false, 'unconfigured');
    if (!secretMatches(payload.secret, secret)) return reply(false, 'unauthorized');

    const application = readApplication(payload);
    if (!application) return reply(false, 'invalid_application');

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) return reply(false, 'busy');
    try {
      return saveApplication(spreadsheetId, application);
    } finally {
      lock.releaseLock();
    }
  } catch {
    return reply(false, 'write_failed');
  }
}

function readPayload(event) {
  const body = event && event.postData && event.postData.contents;
  if (typeof body !== 'string' || body.length > MAX_REQUEST_LENGTH) return null;
  try {
    const payload = JSON.parse(body);
    return payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : null;
  } catch {
    return null;
  }
}

function secretMatches(candidate, expected) {
  if (typeof candidate !== 'string' || candidate.length > 256) return false;
  const algorithm = Utilities.DigestAlgorithm.SHA_256;
  const receivedDigest = Utilities.computeDigest(algorithm, candidate);
  const expectedDigest = Utilities.computeDigest(algorithm, expected);
  let difference = 0;
  for (let index = 0; index < expectedDigest.length; index += 1) {
    difference |= receivedDigest[index] ^ expectedDigest[index];
  }
  return difference === 0;
}

function readApplication(payload) {
  if (typeof payload.submissionId !== 'string' || !UUID_V4.test(payload.submissionId)) {
    return null;
  }
  const application = { submissionId: payload.submissionId.toLowerCase() };
  for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
    if (typeof payload[field] !== 'string') return null;
    const value = payload[field].trim();
    if (value.length > limit || (value === '' && field !== 'profileUrl' && field !== 'role')) {
      return null;
    }
    application[field] = value;
  }
  if (!['yes', 'discuss', 'no'].includes(application.availability)) return null;
  return application;
}

function saveApplication(spreadsheetId, application) {
  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(SHEET_NAME);
  if (!sheet) return reply(false, 'missing_sheet');

  const lastRow = sheet.getLastRow();
  const needsHeaders = lastRow === 0;
  if (!needsHeaders) {
    const [headers] = sheet.getRange(1, 1, 1, HEADERS.length).getValues();
    if (!HEADERS.every((header, index) => header === headers[index])) {
      return reply(false, 'invalid_headers');
    }
  }
  if (lastRow > 1) {
    const existing = sheet.getRange(2, SUBMISSION_ID_COLUMN, lastRow - 1, 1)
      .createTextFinder(application.submissionId)
      .matchEntireCell(true)
      .matchCase(true)
      .findNext();
    if (existing) return reply(true);
  }

  const row = [
    new Date().toISOString(),
    application.submissionId,
    ...Object.keys(FIELD_LIMITS).map((field) => literalCell(application[field])),
  ];
  const values = needsHeaders ? [HEADERS, row] : [row];
  const extraRows = lastRow + values.length - sheet.getMaxRows();
  if (extraRows > 0) sheet.insertRowsAfter(sheet.getMaxRows(), extraRows);
  sheet.getRange(lastRow + 1, 1, values.length, HEADERS.length).setValues(values);
  SpreadsheetApp.flush();
  return reply(true);
}

function literalCell(value) {
  return /^['=+@\-＝＋＠－]/.test(value) ? "'" + value : value;
}

function reply(ok, error) {
  return ContentService
    .createTextOutput(JSON.stringify(ok ? { ok: true } : { ok: false, error }))
    .setMimeType(ContentService.MimeType.JSON);
}
