// ── Berlin Fleet Dashboard — Apps Script ─────────────────────────────────────
// Receives data from the bookmarklet and saves to Google Sheet.
// The bookmarklet runs in the browser (same-origin) and handles all
// token refresh + fleet fetching. This script just stores the data.

var SECRET   = 'BoltFleet-Berlin-2026';
var SHEET_ID = '1oqUMWPBtJEeHjh5BBTYQzA2at90Hfebb3KODWjp8B0k';

var COLUMNS = ['Timestamp','Hidden','In Service Shop','In Maintenance','Lost','Deactivated','Waiting for Order','Reserved','On Trip','Total'];

function doGet(e) {
  try {
    var p = e && e.parameter ? e.parameter : {};
    var d = p.d ? JSON.parse(decodeURIComponent(p.d)) : null;
    var secret = (d && d.token) || p.secret || p.token || '';
    if (secret !== SECRET) return out('Unauthorized');
    if (!d) return out('No data');
    saveRow(d);
    return out('OK');
  } catch(err) {
    return out('Error: ' + err.message);
  }
}

function saveRow(d) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.getRange(1, 1, 1, COLUMNS.length)
      .setBackground('#1DC85A').setFontColor('#000000').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([
    d.timestamp              || '',
    d['Hidden']              || 0,
    d['In Service Shop']     || 0,
    d['In Maintenance']      || 0,
    d['Lost']                || 0,
    d['Deactivated']         || 0,
    d['Waiting for Order']   || 0,
    d['Reserved']            || 0,
    d['On Trip']             || 0,
    d['Total']               || 0
  ]);
}

function out(msg) {
  return ContentService.createTextOutput(msg);
}
