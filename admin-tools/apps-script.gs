// AJM Family — registration logger + admin-panel data source.
//
// Setup instructions are in ADMIN-SETUP.md at the project root.
// This file is not executed by the website directly — you paste its
// contents into the Apps Script editor bound to a Google Sheet.

// Change this to your own secret before deploying — it's the only thing
// standing between the public internet and your attendee list.
const ADMIN_KEY = 'ajm-2026-change-me';

// Media office chart (media.html). MEDIA_KEY lets the team fill in their charts;
// SUPERVISOR_KEY can also see everyone's charts and approve them. Pick your own.
const MEDIA_KEY = 'media-2026-change-me';
const SUPERVISOR_KEY = 'supervisor-2026-change-me';

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

  if (!e.parameter.key || e.parameter.key !== ADMIN_KEY) {
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
// One row per (month, employee) in a separate "MediaCharts" tab, so nothing
// here can touch the registrations. The day-by-day cells for each work type
// live in the Data column as JSON, e.g. {"Reel":"2..1.c", ...}: one entry per
// day of the month separated by ".", each a whole number or a status letter —
// c = completed, p = in progress, r = under review, o = off / holiday.
// Total = the numbers plus 1 for every "c".
// ---------------------------------------------------------------------------
const MEDIA_SHEET_NAME = 'MediaCharts';
const MEDIA_HEADERS = ['Key', 'Month', 'Employee', 'Status', 'Total', 'SubmittedAt', 'ApprovedBy', 'ApprovedAt', 'UpdatedAt', 'Note', 'Data'];

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

function mediaRole_(key) {
  if (!key) return null;
  if (key === SUPERVISOR_KEY) return 'supervisor';
  if (key === MEDIA_KEY) return 'team';
  return null;
}

function validMonth_(m) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(m);
}

function cleanName_(s) {
  return String(s || '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

// "2..1.c" -> keeps only whole numbers and c/p/r/o, at most 31 days
function cleanCells_(str) {
  return String(str || '').toLowerCase().split('.').slice(0, 31).map(function (t) {
    if (/^\d{1,3}$/.test(t)) return String(parseInt(t, 10));
    if (/^[cpro]$/.test(t)) return t;
    return '';
  }).join('.');
}

function chartTotal_(data) {
  let total = 0;
  Object.keys(data).forEach(function (cat) {
    data[cat].split('.').forEach(function (t) {
      if (/^\d+$/.test(t)) total += parseInt(t, 10);
      else if (t === 'c') total += 1;
    });
  });
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

function readMediaCharts_(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, MEDIA_HEADERS.length).getValues().map(function (vals, i) {
    const o = { _row: i + 2 };
    MEDIA_HEADERS.forEach(function (h, c) { o[h] = vals[c]; });
    return o;
  });
}

function findMediaChart_(rows, month, employee) {
  const key = month + '|' + employee.toLowerCase();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i].Key) === key) return rows[i];
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
    employee: String(r.Employee),
    status: String(r.Status),
    total: Number(r.Total) || 0,
    submittedAt: String(r.SubmittedAt || ''),
    approvedBy: String(r.ApprovedBy || ''),
    approvedAt: String(r.ApprovedAt || ''),
    updatedAt: String(r.UpdatedAt || ''),
    note: String(r.Note || ''),
    data: parseChartData_(r.Data)
  };
}

function handleMedia_(p) {
  const role = mediaRole_(p.key);
  if (!role) return jsonOut_({ error: 'unauthorized' });

  switch (p.action) {
    case 'mediaLogin':
      return jsonOut_({ ok: true, role: role });
    case 'mediaList':
      return mediaList_(p, role);
    case 'mediaGet':
      return mediaGet_(p);
    case 'mediaSave':
      return mediaSave_(p);
    case 'mediaApprove':
      if (role !== 'supervisor') return jsonOut_({ error: 'forbidden' });
      return mediaApprove_(p);
    default:
      return jsonOut_({ error: 'unknown action' });
  }
}

// Everyone gets the list of names (to pick from); only the supervisor also
// gets every chart for the month.
function mediaList_(p, role) {
  const rows = readMediaCharts_(getMediaSheet_());
  const seen = {};
  const employees = [];
  rows.forEach(function (r) {
    const k = String(r.Employee).toLowerCase();
    if (!seen[k]) { seen[k] = true; employees.push(String(r.Employee)); }
  });
  employees.sort(function (a, b) { return a.toLowerCase() < b.toLowerCase() ? -1 : 1; });

  let charts = [];
  if (role === 'supervisor') {
    charts = rows.filter(function (r) { return !p.month || String(r.Month) === p.month; }).map(chartOut_);
  }
  return jsonOut_({ ok: true, employees: employees, charts: charts });
}

function mediaGet_(p) {
  const month = String(p.month || '');
  const employee = cleanName_(p.employee);
  if (!validMonth_(month) || !employee) return jsonOut_({ error: 'invalid month or employee' });
  const found = findMediaChart_(readMediaCharts_(getMediaSheet_()), month, employee);
  return jsonOut_({ ok: true, chart: found ? chartOut_(found) : null });
}

function mediaSave_(p) {
  const month = String(p.month || '');
  const employee = cleanName_(p.employee);
  if (!validMonth_(month) || !employee) return jsonOut_({ error: 'invalid month or employee' });

  let raw;
  try { raw = JSON.parse(p.data || '{}'); } catch (err) { return jsonOut_({ error: 'invalid data' }); }
  const data = {};
  Object.keys(raw || {}).slice(0, 20).forEach(function (cat) {
    const name = String(cat).replace(/\s+/g, ' ').trim().slice(0, 40);
    if (name) data[name] = cleanCells_(raw[cat]);
  });
  const note = String(p.note || '').slice(0, 300);

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getMediaSheet_();
    const existing = findMediaChart_(readMediaCharts_(sheet), month, employee);
    if (existing && existing.Status === 'Approved') return jsonOut_({ error: 'locked' });

    const now = new Date().toISOString();
    let status = existing ? String(existing.Status) : 'Draft';
    let submittedAt = existing ? String(existing.SubmittedAt || '') : '';
    if (p.submit === '1') { status = 'Submitted'; submittedAt = now; }

    const vals = [
      month + '|' + employee.toLowerCase(), month, existing ? String(existing.Employee) : employee,
      status, chartTotal_(data), submittedAt, '', '', now, note, JSON.stringify(data)
    ];
    writeMediaRow_(sheet, existing ? existing._row : 0, vals);

    const out = {};
    MEDIA_HEADERS.forEach(function (h, i) { out[h] = vals[i]; });
    return jsonOut_({ ok: true, chart: chartOut_(out) });
  } finally {
    lock.releaseLock();
  }
}

// Supervisor only. Only a submitted chart can be approved; approving locks it
// (saves are refused) until the supervisor unlocks it again.
function mediaApprove_(p) {
  const month = String(p.month || '');
  const employee = cleanName_(p.employee);
  if (!validMonth_(month) || !employee) return jsonOut_({ error: 'invalid month or employee' });
  const approve = p.approve === '1';
  const by = cleanName_(p.by);
  if (approve && !by) return jsonOut_({ error: 'missing approver name' });

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getMediaSheet_();
    const existing = findMediaChart_(readMediaCharts_(sheet), month, employee);
    if (!existing) return jsonOut_({ error: 'not found' });

    const now = new Date().toISOString();
    if (approve) {
      if (existing.Status === 'Draft') return jsonOut_({ error: 'not submitted' });
      if (existing.Status !== 'Approved') {
        existing.Status = 'Approved';
        existing.ApprovedBy = by;
        existing.ApprovedAt = now;
      }
    } else {
      existing.Status = existing.SubmittedAt ? 'Submitted' : 'Draft';
      existing.ApprovedBy = '';
      existing.ApprovedAt = '';
    }
    existing.UpdatedAt = now;
    writeMediaRow_(sheet, existing._row, MEDIA_HEADERS.map(function (h) { return existing[h]; }));
    return jsonOut_({ ok: true, chart: chartOut_(existing) });
  } finally {
    lock.releaseLock();
  }
}
