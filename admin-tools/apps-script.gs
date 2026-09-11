// AJM Family — registration logger + admin-panel data source.
//
// Setup instructions are in ADMIN-SETUP.md at the project root.
// This file is not executed by the website directly — you paste its
// contents into the Apps Script editor bound to a Google Sheet.

// Change this to your own secret before deploying — it's the only thing
// standing between the public internet and your attendee list.
const ADMIN_KEY = 'ajm-2026-change-me';

const SHEET_NAME = 'Registrations';
const HEADERS = ['Timestamp', 'Source', 'Name', 'Phone', 'Email', 'Details'];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
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

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  if (!e.parameter.key || e.parameter.key !== ADMIN_KEY) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
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
