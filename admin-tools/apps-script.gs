// AJM Family — registration logger + admin-panel data source.
//
// Setup instructions are in ADMIN-SETUP.md at the project root.
// This file is not executed by the website directly — you paste its
// contents into the Apps Script editor bound to a Google Sheet.

// Change this to your own secret before deploying — it's the only thing
// standing between the public internet and your attendee list.
const ADMIN_KEY = 'ajm-2026-change-me';

// The one key the whole media team uses on media.html. Pick your own.
const MEDIA_KEY = 'media-2026-change-me';

const SHEET_NAME = 'Registrations';
const HEADERS = ['Timestamp', 'Source', 'Name', 'Phone', 'Email', 'Details', 'ID', 'Status'];
const ID_COL = 7;
const STATUS_COL = 8;
const STATUSES = ['Pending', 'Contacted', 'Confirmed'];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastColumn() < HEADERS.length) {
    // migrate an existing sheet from before the ID/Status columns were added
    sheet.getRange(1, sheet.getLastColumn() + 1, 1, HEADERS.length - sheet.getLastColumn())
      .setValues([HEADERS.slice(sheet.getLastColumn())]);
  }
  return sheet;
}

function doPost(e) {
  const sheet = getSheet_();
  const data = JSON.parse(e.postData.contents);
  const row = sheet.getLastRow() + 1;

  sheet.getRange(row, 1).setValue(new Date());

  // Source..Details as plain text — otherwise Sheets reads a phone number
  // like "+91 99999 99999" as a formula and stores #ERROR! instead.
  const textRange = sheet.getRange(row, 2, 1, 5);
  textRange.setNumberFormat('@');
  textRange.setValues([[
    data.source || '',
    data.name || '',
    data.phone || '',
    data.email || '',
    data.details || ''
  ]]);

  const id = Utilities.getUuid();
  sheet.getRange(row, ID_COL).setNumberFormat('@').setValue(id);
  sheet.getRange(row, STATUS_COL).setNumberFormat('@').setValue('Pending');

  return ContentService.createTextOutput(JSON.stringify({ ok: true, id: id }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  // Media office monthly work chart — has its own keys, separate from ADMIN_KEY.
  if (String(e.parameter.action || '').indexOf('media') === 0) {
    return handleMedia_(e.parameter);
  }

  // (the sample key is refused, so a forgotten "change me" can never expose the list)
  if (!e.parameter.key || e.parameter.key !== ADMIN_KEY || ADMIN_KEY === 'ajm-2026-change-me') {
    return ContentService.createTextOutput(JSON.stringify({ error: 'unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (e.parameter.action === 'delete') {
    return handleDelete_(e.parameter.id);
  }
  if (e.parameter.action === 'setStatus') {
    return handleSetStatus_(e.parameter.id, e.parameter.status);
  }

  const sheet = getSheet_();
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift();
  const data = rows.map(function (row) {
    const obj = {};
    headers.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
  return ContentService.createTextOutput(JSON.stringify({ ok: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function findRowById_(sheet, id) {
  const ids = sheet.getRange(2, ID_COL, Math.max(sheet.getLastRow() - 1, 0), 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) return i + 2; // +2: 1-indexed, plus header row
  }
  return -1;
}

function handleDelete_(id) {
  if (!id) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'missing id' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const sheet = getSheet_();
  const row = findRowById_(sheet, id);
  if (row === -1) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  sheet.deleteRow(row);
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleSetStatus_(id, status) {
  if (!id || STATUSES.indexOf(status) === -1) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'invalid id or status' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const sheet = getSheet_();
  const row = findRowById_(sheet, id);
  if (row === -1) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  sheet.getRange(row, STATUS_COL).setNumberFormat('@').setValue(status);
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------------------
// Media office — Monthly Work Chart (media.html)
//
// One shared chart per month for the whole media team — no names, no roles.
// It lives in a "MediaWork" tab, one row per month. The cells for each work
// type are stored in the Data column as JSON, e.g. {"Reel":"2..1.c", ...}: one
// entry per day of the month separated by ".", each a whole number or a status
// letter — c = completed, p = in progress, r = under review, o = off / holiday.
// Total = the numbers plus 1 for every "c".
//
// Several people edit the same chart at once, so a save only sends the cells
// that person changed; they are merged into whatever is stored at that moment
// (one save at a time), so nobody's work overwrites anybody else's.
// ---------------------------------------------------------------------------
const MEDIA_SHEET_NAME = 'MediaWork';
const MEDIA_HEADERS = ['Month', 'Total', 'SubmittedAt', 'UpdatedAt', 'Note', 'Data'];
const MEDIA_VERSION = 2;

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getMediaSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(MEDIA_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(MEDIA_SHEET_NAME);
    sheet.appendRow(MEDIA_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Refuses the sample key, so a forgotten "change me" can never open the chart.
function mediaAuthorized_(key) {
  return !!key && key === MEDIA_KEY && MEDIA_KEY !== 'media-2026-change-me';
}

function validMonth_(m) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(m);
}

function cleanCat_(s) {
  return String(s || '').replace(/\s+/g, ' ').trim().slice(0, 40);
}

// one cell: a whole number (up to 3 digits), c / p / r / o, or empty
function cleanToken_(t) {
  t = String(t || '').toLowerCase();
  if (/^\d{1,3}$/.test(t)) return String(parseInt(t, 10));
  if (/^[cpro]$/.test(t)) return t;
  return '';
}

function splitCells_(s) {
  const a = String(s || '').split('.').slice(0, 31);
  while (a.length < 31) a.push('');
  return a;
}

function joinCells_(a) {
  return a.join('.').replace(/\.+$/, '');
}

function cellsTotal_(cells) {
  let t = 0;
  String(cells || '').split('.').forEach(function (tok) {
    if (/^\d+$/.test(tok)) t += parseInt(tok, 10);
    else if (tok === 'c') t += 1;
  });
  return t;
}

function chartTotal_(data) {
  let total = 0;
  Object.keys(data).forEach(function (cat) { total += cellsTotal_(data[cat]); });
  return total;
}

function parseChartData_(s) {
  try {
    const o = JSON.parse(String(s || '{}'));
    return (o && typeof o === 'object') ? o : {};
  } catch (err) {
    return {};
  }
}

function readMediaMonths_(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, MEDIA_HEADERS.length).getValues().map(function (vals, i) {
    const o = { _row: i + 2 };
    MEDIA_HEADERS.forEach(function (h, c) { o[h] = vals[c]; });
    return o;
  });
}

function findMediaMonth_(rows, month) {
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i].Month) === month) return rows[i];
  }
  return null;
}

function writeMediaRow_(sheet, rowNum, vals) {
  const r = rowNum || sheet.getLastRow() + 1;
  sheet.getRange(r, 1, 1, MEDIA_HEADERS.length).setNumberFormat('@').setValues([vals]);
}

function chartOut_(r) {
  return {
    month: String(r.Month),
    total: Number(r.Total) || 0,
    submittedAt: String(r.SubmittedAt || ''),
    updatedAt: String(r.UpdatedAt || ''),
    note: String(r.Note || ''),
    data: parseChartData_(r.Data)
  };
}

function handleMedia_(p) {
  if (!mediaAuthorized_(p.key)) return jsonOut_({ error: 'unauthorized' });

  switch (p.action) {
    case 'mediaLogin':
      // version lets the page tell whether this script is up to date; now is
      // the real date, so a wrong computer clock can't open the wrong month
      return jsonOut_({ ok: true, version: MEDIA_VERSION, now: new Date().toISOString() });
    case 'mediaList':
      return jsonOut_({ ok: true, charts: readMediaMonths_(getMediaSheet_()).map(chartOut_) });
    case 'mediaGet':
      return mediaGet_(p);
    case 'mediaSave':
      return mediaSave_(p);
    default:
      return jsonOut_({ error: 'unknown action' });
  }
}

function mediaGet_(p) {
  const month = String(p.month || '');
  if (!validMonth_(month)) return jsonOut_({ error: 'invalid month' });
  const found = findMediaMonth_(readMediaMonths_(getMediaSheet_()), month);
  return jsonOut_({ ok: true, chart: found ? chartOut_(found) : null });
}

// p.changes = {"Reel": {"3": "2", "5": ""}, ...}  (work type -> day -> new value, "" clears)
// p.note    = replaces the notes (only sent when it was edited)
// p.submit  = "1" stamps the submission date, "0" clears it
function mediaSave_(p) {
  const month = String(p.month || '');
  if (!validMonth_(month)) return jsonOut_({ error: 'invalid month' });

  let changes = {};
  if (p.changes) {
    try { changes = JSON.parse(p.changes) || {}; } catch (err) { return jsonOut_({ error: 'invalid data' }); }
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getMediaSheet_();
    const existing = findMediaMonth_(readMediaMonths_(sheet), month);
    const data = existing ? parseChartData_(existing.Data) : {};

    Object.keys(changes).slice(0, 20).forEach(function (cat) {
      const name = cleanCat_(cat);
      if (!name || typeof changes[cat] !== 'object' || !changes[cat]) return;
      const cells = splitCells_(data[name]);
      Object.keys(changes[cat]).forEach(function (d) {
        const n = parseInt(d, 10);
        if (n >= 1 && n <= 31) cells[n - 1] = cleanToken_(changes[cat][d]);
      });
      const joined = joinCells_(cells);
      if (joined) data[name] = joined; else delete data[name];
    });

    const now = new Date().toISOString();
    let submittedAt = existing ? String(existing.SubmittedAt || '') : '';
    if (p.submit === '1') submittedAt = now;
    else if (p.submit === '0') submittedAt = '';
    const note = p.note !== undefined ? String(p.note).slice(0, 300) : (existing ? String(existing.Note || '') : '');

    const vals = [month, chartTotal_(data), submittedAt, now, note, JSON.stringify(data)];
    writeMediaRow_(sheet, existing ? existing._row : 0, vals);

    const out = {};
    MEDIA_HEADERS.forEach(function (h, i) { out[h] = vals[i]; });
    return jsonOut_({ ok: true, chart: chartOut_(out) });
  } finally {
    lock.releaseLock();
  }
}
