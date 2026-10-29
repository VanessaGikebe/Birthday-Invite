/**
 * RSVP → Google Sheet bridge for the birthday invitation.
 *
 * Setup (see README → "RSVPs in a Google Sheet"):
 *   1. Open your Google Sheet → Extensions → Apps Script.
 *   2. Paste this whole file, replacing anything there.
 *   3. Change SECRET below to a long random phrase (same value as RSVP_SHEET_SECRET on the website).
 *   4. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 *   5. Copy the Web app URL into RSVP_SHEET_URL on the website.
 */

const SECRET = "CHANGE-ME-to-a-long-random-phrase";
const SHEET_NAME = "RSVPs";
const HEADERS = ["ID", "Received", "Full name", "Attending", "Guests", "Dietary", "Message", "Name key"];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sh;
}

function rows_(sh) {
  const n = sh.getLastRow();
  return n < 2 ? [] : sh.getRange(2, 1, n - 1, HEADERS.length).getValues();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Stop guest text from being treated as a spreadsheet formula. */
function safe_(v) {
  const s = v == null ? "" : String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: "bad_json" });
  }
  if (body.secret !== SECRET) return json_({ ok: false, error: "unauthorised" });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = sheet_();

    if (body.action === "insert") {
      const r = body.rsvp;
      if (rows_(sh).some((row) => row[7] === r.nameKey)) return json_({ ok: false, error: "duplicate" });
      sh.appendRow([r.id, new Date(r.createdAt), safe_(r.fullName), r.attending ? "Yes" : "No", r.attendees, safe_(r.dietary), safe_(r.message), r.nameKey]);
      return json_({ ok: true });
    }

    if (body.action === "list") {
      const rows = rows_(sh)
        .filter((row) => row[0])
        .map((row) => ({
          id: String(row[0]),
          createdAt: row[1] instanceof Date ? row[1].toISOString() : String(row[1]),
          fullName: String(row[2]).replace(/^'/, ""),
          attending: row[3] === "Yes",
          attendees: Number(row[4]) || 0,
          phone: null,
          dietary: row[5] ? String(row[5]).replace(/^'/, "") : null,
          message: row[6] ? String(row[6]).replace(/^'/, "") : null,
        }));
      return json_({ ok: true, rows: rows });
    }

    if (body.action === "delete") {
      const data = rows_(sh);
      for (let i = data.length - 1; i >= 0; i--) if (String(data[i][0]) === body.id) sh.deleteRow(i + 2);
      return json_({ ok: true });
    }

    return json_({ ok: false, error: "unknown_action" });
  } finally {
    lock.releaseLock();
  }
}
