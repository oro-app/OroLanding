const SHEET_NAME = 'Applications';
const LEGACY_HEADERS = [
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
const NEW_HEADERS = [
  'Instagram handle',
  'How did you find this opportunity?',
  'Portfolio or other links',
  'Anything else you’d like to share?',
];
const PREVIOUS_HEADERS = {
  'How did you find this opportunity?': 'How did you hear about this opportunity?',
  'Portfolio or other links': 'Portfolio and other links',
  'Anything else you’d like to share?': 'Anything else',
};
const HEADERS = [...LEGACY_HEADERS, ...NEW_HEADERS];
const SUBMISSION_ID_COLUMN = 2;
const MAX_REQUEST_LENGTH = 300000;
const MAX_LINKS_LENGTH = 40000;
const MAX_LINK_LENGTH = 2048;
const UUID_V4 = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INSTAGRAM = /^@?[A-Za-z0-9._]{1,30}$/;
const HTTP_LINK = /^https?:\/\/[^/?#@\\\s\x00-\x1f\x7f]+(?:[/?#][^\s\x00-\x1f\x7f]*)?$/i;
const COMMON_FIELD_LIMITS = {
  name: 120,
  email: 254,
};
const LEGACY_FIELD_LIMITS = {
  videoUrl: 2048,
  profileUrl: 2048,
  role: 1000,
  interest: 1500,
  availability: 7,
};
const NEW_TEXT_LIMITS = {
  instagramHandle: 31,
  referralSource: 500,
  notes: 1500,
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
  const common = readFields(payload, COMMON_FIELD_LIMITS, []);
  if (!common) return null;

  const fields = ['instagramHandle', 'referralSource', 'links', 'notes'].some(
    (field) => Object.prototype.hasOwnProperty.call(payload, field)
  ) ? readNewApplication(payload, common) : readLegacyApplication(payload);
  if (!fields) return null;

  return {
    submissionId: payload.submissionId.toLowerCase(),
    values: [common.name, common.email, ...fields],
  };
}

function readFields(payload, limits, optionalFields) {
  const fields = {};
  for (const [field, limit] of Object.entries(limits)) {
    const optional = optionalFields.includes(field);
    const raw = optional ? (payload[field] ?? '') : payload[field];
    if (typeof raw !== 'string') return null;
    const value = raw.trim();
    if (value.length > limit || (!value && !optional)) return null;
    fields[field] = value;
  }
  return fields;
}

function readLegacyApplication(payload) {
  const fields = readFields(payload, LEGACY_FIELD_LIMITS, ['profileUrl', 'role']);
  if (!fields || !['yes', 'discuss', 'no'].includes(fields.availability)) return null;
  return [...Object.values(fields), ...Array(NEW_HEADERS.length).fill('')];
}

function readNewApplication(payload, common) {
  const fields = readFields(payload, NEW_TEXT_LIMITS, ['notes']);
  if (!fields || !INSTAGRAM.test(fields.instagramHandle) || !EMAIL.test(common.email)) {
    return null;
  }
  const links = readLinks(payload.links ?? []);
  if (links === null) return null;
  return [
    ...Array(Object.keys(LEGACY_FIELD_LIMITS).length).fill(''),
    '@' + fields.instagramHandle.replace(/^@/, ''),
    fields.referralSource,
    links,
    fields.notes,
  ];
}

function readLinks(links) {
  if (!Array.isArray(links)) return null;
  let length = 0;
  const values = [];
  for (const raw of links) {
    if (typeof raw !== 'string') return null;
    const value = raw.trim();
    if (value.length > MAX_LINK_LENGTH || !HTTP_LINK.test(value)) return null;
    length += value.length + (values.length ? 1 : 0);
    if (length > MAX_LINKS_LENGTH) return null;
    values.push(value);
  }
  return values.join('\n');
}

function ensureColumns(sheet) {
  const columns = sheet.getMaxColumns();
  if (columns < HEADERS.length) sheet.insertColumnsAfter(columns, HEADERS.length - columns);
}

function ensureHeaders(sheet) {
  const width = Math.min(sheet.getMaxColumns(), HEADERS.length);
  const [current] = sheet.getRange(1, 1, 1, width).getValues();
  if (!LEGACY_HEADERS.every((header, index) => header === current[index])) return false;

  const missing = [];
  for (let index = LEGACY_HEADERS.length; index < HEADERS.length; index += 1) {
    const header = HEADERS[index];
    if (current[index] === header || (current[index] && current[index] === PREVIOUS_HEADERS[header])) continue;
    const column = index + 1;
    if (column <= width && !sheet.getRange(1, column, sheet.getLastRow(), 1).isBlank()) {
      return false;
    }
    missing.push(index);
  }
  if (missing.length) {
    ensureColumns(sheet);
    for (const index of missing) sheet.getRange(1, index + 1).setValue(HEADERS[index]);
    SpreadsheetApp.flush();
  }
  return true;
}

function saveApplication(spreadsheetId, application) {
  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(SHEET_NAME);
  if (!sheet) return reply(false, 'missing_sheet');

  const lastRow = sheet.getLastRow();
  const needsHeaders = lastRow === 0;
  if (needsHeaders) ensureColumns(sheet);
  else if (!ensureHeaders(sheet)) return reply(false, 'invalid_headers');

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
    ...application.values.map(literalCell),
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
