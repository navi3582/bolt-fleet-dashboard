var SECRET    = 'BoltFleet-Berlin-2026';
var SHEET_ID  = '1LYEqvnfPRySgq18EobrxDG26OQAsbdwB5ZjhhP4Je7g';
var GID       = 1123655017;
var CITY_ID   = 329;
var FLEET_API = 'https://admin-panel.bolt.eu/backend/rental-car-vehicle-fleet/adminPanel/vehicle/getList';
var TOKEN_API = 'https://admin-panel.bolt.eu/backend/admin-user/adminPanel/getAccessToken';

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

// ── Get a fresh access token using the stored refresh token ───────────────────
function getFreshToken() {
  var refresh = PropertiesService.getScriptProperties().getProperty('refresh_token');
  if (!refresh) return null;

  var res  = UrlFetchApp.fetch(TOKEN_API, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Accept':   'application/json',
      'Origin':   'https://admin-panel.bolt.eu',
      'Referer':  'https://admin-panel.bolt.eu/rentals-carsharing/vehicles/list'
    },
    payload: JSON.stringify({ refresh_token: refresh }),
    muteHttpExceptions: true
  });

  var body = JSON.parse(res.getContentText());
  Logger.log('getAccessToken → ' + res.getResponseCode() + ' ' + res.getContentText().substring(0, 80));

  return (body.data && body.data.access_token) ? body.data.access_token : null;
}

// ── Runs automatically every minute ──────────────────────────────────────────
function fetchFleetData() {
  var token = getFreshToken();
  if (!token) {
    Logger.log('No refresh_token stored — open admin panel and run the bookmarklet first.');
    return;
  }

  var results = {};
  var failed  = 0;

  for (var i = 0; i < STATES.length; i++) {
    var key   = STATES[i][0];
    var label = STATES[i][1];
    try {
      var res  = UrlFetchApp.fetch(FLEET_API, {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept':        'application/json',
          'Origin':        'https://admin-panel.bolt.eu',
          'Referer':       'https://admin-panel.bolt.eu/rentals-carsharing/vehicles/list'
        },
        payload: JSON.stringify({ filter: { vehicle_states: [key], city_ids: [CITY_ID] }, items_per_page: 1, page_number: 0 }),
        muteHttpExceptions: true
      });
      var data = JSON.parse(res.getContentText());
      if (data.code === 503 || data.message === 'NOT_AUTHORIZED') {
        Logger.log('Access token rejected — will retry next minute with fresh token.');
        return;
      }
      results[label] = (data.data && data.data.pages) ? data.data.pages.total_rows : 0;
    } catch(e) {
      results[label] = 0;
      failed++;
    }
  }

  if (failed === STATES.length) return;

  var now   = Utilities.formatDate(new Date(), 'Europe/Berlin', 'dd.MM.yyyy HH:mm');
  var total = 0;
  for (var k in results) total += results[k];
  results.timestamp = now;
  results.Total     = total;
  saveRow(results);
}

// ── One-time setup ────────────────────────────────────────────────────────────
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('fetchFleetData').timeBased().everyMinutes(1).create();
  Logger.log('Trigger created — fleet data will refresh every minute.');
}

// ── Receives refresh_token from bookmarklet ───────────────────────────────────
function doGet(e) {
  try {
    var p = e && e.parameter ? e.parameter : {};
    var d = p.d ? JSON.parse(decodeURIComponent(p.d)) : null;
    var secret = (d && d.token) || p.secret || p.token || '';
    if (secret !== SECRET) return html('Unauthorized');
    if (!d) return html('No data');

    var props = PropertiesService.getScriptProperties();
    if (d.refresh_token) props.setProperty('refresh_token', d.refresh_token);
    if (d.bearer_token)  props.setProperty('bearer_token',  d.bearer_token);

    saveRow(d);
    return html('Saved! Dashboard will auto-update every minute.');
  } catch(err) {
    return html('Error: ' + err.message);
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
    d.timestamp        || '',
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
