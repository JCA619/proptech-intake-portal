/**
 * Firestore -> Google Sheets auto-sync for the PropTech Intake Portal.
 *
 * Reads documents from the Firestore `leads` collection using a Firebase
 * service account (admin access), and appends any NEW leads as rows to this
 * spreadsheet. Already-synced leads are skipped, so it is safe to run on a timer.
 *
 * Your public Firestore security rules stay locked (no public reads); this
 * script authenticates as a service account, which bypasses rules securely.
 *
 * ----------------------------------------------------------------------------
 * SETUP (one time):
 *
 * 1. In Firebase Console -> Project settings (gear) -> Service accounts ->
 *    "Generate new private key". A JSON file downloads. Open it.
 *
 * 2. In this Apps Script editor: Project Settings (gear, left) -> Script
 *    Properties -> add THREE properties from that JSON file:
 *        FIREBASE_PROJECT_ID   ->  "project_id" value  (intake-form-87163)
 *        CLIENT_EMAIL          ->  "client_email" value
 *        PRIVATE_KEY           ->  "private_key" value (the whole thing,
 *                                  including -----BEGIN PRIVATE KEY----- ...)
 *
 * 3. Run `setupSheet` once (Run menu) to create the header row.
 *
 * 4. Run `syncLeads` once and approve the permissions prompt.
 *
 * 5. Triggers (clock icon, left) -> Add Trigger -> function: syncLeads,
 *    event source: Time-driven, every 5 or 10 minutes. Done — it now
 *    auto-syncs.
 * ----------------------------------------------------------------------------
 */

// Column order written to the sheet. 'id' must stay first (used for dedupe).
var FIELDS = [
  'id', 'createdAt', 'status', 'firstName', 'lastName', 'email', 'phone',
  'contactMethod', 'propertyOfInterest', 'moveInDate', 'budget',
  'currentAddress', 'occupants', 'hasPets', 'petDetails', 'notes'
];

function setupSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(FIELDS);
    sheet.getRange(1, 1, 1, FIELDS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function syncLeads() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getLastRow() === 0) setupSheet();

  // Collect IDs already in the sheet (column A) to avoid duplicates.
  var existing = {};
  if (sheet.getLastRow() > 1) {
    var ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    ids.forEach(function (r) { existing[r[0]] = true; });
  }

  var leads = fetchFirestoreLeads();
  var added = 0;

  leads.forEach(function (lead) {
    if (existing[lead.id]) return;
    var row = FIELDS.map(function (f) { return lead[f] != null ? lead[f] : ''; });
    sheet.appendRow(row);
    added++;
  });

  Logger.log('Synced. New leads added: ' + added);
  return added;
}

/** Fetches all docs from the `leads` collection via the Firestore REST API. */
function fetchFirestoreLeads() {
  var props = PropertiesService.getScriptProperties();
  var projectId = props.getProperty('FIREBASE_PROJECT_ID');
  var token = getAccessToken();

  var url = 'https://firestore.googleapis.com/v1/projects/' + projectId +
            '/databases/(default)/documents/leads?pageSize=300';

  var leads = [];
  var pageToken = null;

  do {
    var pageUrl = url + (pageToken ? '&pageToken=' + pageToken : '');
    var resp = UrlFetchApp.fetch(pageUrl, {
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });
    var data = JSON.parse(resp.getContentText());
    if (data.error) throw new Error('Firestore error: ' + data.error.message);

    (data.documents || []).forEach(function (doc) {
      var lead = parseFields(doc.fields);
      // The document ID is the last path segment of doc.name.
      lead.id = doc.name.split('/').pop();
      leads.push(lead);
    });

    pageToken = data.nextPageToken;
  } while (pageToken);

  return leads;
}

/** Converts Firestore's typed field format into plain JS values. */
function parseFields(fields) {
  var out = {};
  if (!fields) return out;
  Object.keys(fields).forEach(function (key) {
    var v = fields[key];
    if (v.stringValue !== undefined) out[key] = v.stringValue;
    else if (v.integerValue !== undefined) out[key] = Number(v.integerValue);
    else if (v.doubleValue !== undefined) out[key] = v.doubleValue;
    else if (v.booleanValue !== undefined) out[key] = v.booleanValue;
    else if (v.timestampValue !== undefined) out[key] = v.timestampValue;
    else if (v.nullValue !== undefined) out[key] = '';
    else out[key] = JSON.stringify(v);
  });
  return out;
}

/** Mints an OAuth access token from the service account (JWT grant). */
function getAccessToken() {
  var props = PropertiesService.getScriptProperties();
  var clientEmail = props.getProperty('CLIENT_EMAIL');
  var privateKey = props.getProperty('PRIVATE_KEY').replace(/\\n/g, '\n');

  var now = Math.floor(Date.now() / 1000);
  var header = { alg: 'RS256', typ: 'JWT' };
  var claim = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  var toSign = base64url(JSON.stringify(header)) + '.' + base64url(JSON.stringify(claim));
  var signature = Utilities.computeRsaSha256Signature(toSign, privateKey);
  var jwt = toSign + '.' + Utilities.base64EncodeWebSafe(signature).replace(/=+$/, '');

  var resp = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    payload: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    },
    muteHttpExceptions: true
  });
  var data = JSON.parse(resp.getContentText());
  if (!data.access_token) throw new Error('Token error: ' + resp.getContentText());
  return data.access_token;
}

function base64url(str) {
  return Utilities.base64EncodeWebSafe(str).replace(/=+$/, '');
}
