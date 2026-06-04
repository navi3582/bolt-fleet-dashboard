var SECRET   = 'BoltFleet-Berlin-2026';
var SHEET_ID = '1LYEqvnfPRySgq18EobrxDG26OQAsbdwB5ZjhhP4Je7g';
var GID      = 1123655017;
var CITY_ID  = 329;
var BOLT_API = 'https://admin-panel.bolt.eu/backend/rental-car-vehicle-fleet/adminPanel/vehicle/getList';

var STATES = [
  ['hidden',            'Hidden'],
  ['in_service_shop',   'In Service Shop'],
  ['in_maintenance',    'In Maintenance'],
  ['lost',              'Lost'],
  ['deactivated',       'Deactivated'],
  ['waiting_for_order', 'Waiting for Order'],
  ['reserved',          'Reserved'],
  ['on_trip',           'On Trip']
];

// ── Runs automatically every minute ──────────────────────────────────────────
function fetchFleetData() {
  var token = PropertiesService.getScriptProperties().getProperty('bearer_token');
  if (!token) return; // No token yet — wait for bookmarklet

  var results = {};
  var failed  = 0;

  for (var i = 0; i < STATES.length; i++) {
    var key   = STATES[i][0];
    var label = STATES[i][1];
    try {
      var res  = UrlFetchApp.fetch(BOLT_API, {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/json',
          'Origin': 'https://admin-panel.bolt.eu',
          'Referer': 'https://admin-panel.bolt.eu/rentals-carsharing/vehicles/list',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        payload: JSON.stringify({ filter: { vehicle_states: [key], city_ids: [CITY_ID] }, items_per_page: 1, page_number: 0 }),
        muteHttpExceptions: true
      });
      var data = JSON.parse(res.getContentText());
      Logger.log(label + ': ' + res.getResponseCode() + ' → ' + res.getContentText().substring(0, 100));
      if (data.code === 503 || data.message === 'NOT_AUTHORIZED') {
        Logger.log('Token rejected — clearing.');
        PropertiesService.getScriptProperties().deleteProperty('bearer_token');
        return;
      }
      results[label] = data.data && data.data.pages ? data.data.pages.total_rows : 0;
    } catch(e) {
      results[label] = 0;
      failed++;
    }
  }

  if (failed === STATES.length) return; // All failed, skip

  var now   = Utilities.formatDate(new Date(), 'Europe/Berlin', 'dd.MM.yyyy HH:mm');
  var total = 0;
  for (var k in results) total += results[k];
  results.timestamp = now;
  results.Total     = total;
  saveRow(results);
}

// ── Run once to set up the automatic trigger ──────────────────────────────────
function setupTrigger() {
  // Remove any existing triggers
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });
  // Run fetchFleetData every minute
  ScriptApp.newTrigger('fetchFleetData').timeBased().everyMinutes(1).create();
  Logger.log('Trigger set up — fleet data will be fetched every minute.');
}

// ── Called by bookmarklet to save token + fleet data ─────────────────────────
function doGet(e) {
  try {
    var p = e && e.parameter ? e.parameter : {};

    // ?action=getToken&secret=... — used by fetch_fleet.py on Mac
    if (p.action === 'getToken') {
      if (p.secret !== SECRET) return json({ success: false, error: 'Unauthorized' });
      var t = PropertiesService.getScriptProperties().getProperty('bearer_token') || '';
      return json({ success: true, token: t });
    }

    var d = p.d ? JSON.parse(decodeURIComponent(p.d)) : null;
    var secret = p.secret || p.token || (d && d.token) || '';
    if (secret !== SECRET) return html('Unauthorized');
    if (!d) return html('No data');
    if (d.bearer_token) {
      PropertiesService.getScriptProperties().setProperty('bearer_token', d.bearer_token);
    }
    saveRow(d);
    return html('<script>window.close();</script>Saved!');
  } catch(err) {
    return html('Error: ' + err.message);
  }
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    if (payload.token !== SECRET) return json({ success: false, error: 'Unauthorized' });
    if (payload.bearer_token) {
      PropertiesService.getScriptProperties().setProperty('bearer_token', payload.bearer_token);
    }
    return saveRow(payload);
  } catch(err) {
    return json({ success: false, error: err.message });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function saveRow(d) {
  var ss     = SpreadsheetApp.openById(SHEET_ID);
  var sheets = ss.getSheets();
  var sheet  = sheets[0];
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === GID) { sheet = sheets[i]; break; }
  }
  if (sheet.getLastRow() === 0) {
    var h = ['Timestamp','Hidden','In Service Shop','In Maintenance','Lost','Deactivated','Waiting for Order','Reserved','On Trip','Total'];
    sheet.appendRow(h);
    sheet.getRange(1,1,1,h.length).setBackground('#1a1a2e').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([
    d.timestamp,
    d['Hidden']               || 0,
    d['In Service Shop']      || 0,
    d['In Maintenance']       || 0,
    d['Lost']                 || 0,
    d['Deactivated']          || 0,
    d['Waiting for Order']    || 0,
    d['Reserved']             || 0,
    d['On Trip']              || 0,
    d['Total']                || 0
  ]);
  return json({ success: true });
}

function html(msg) { return HtmlService.createHtmlOutput(msg); }
function json(obj)  { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
