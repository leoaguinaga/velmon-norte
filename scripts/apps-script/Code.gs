/**
 * Google Apps Script Web App — receives each quote-request lead from
 * src/pages/api/quote.ts (Nodemailer handles the notification email
 * separately; this script only logs the lead into a Google Sheet).
 *
 * Setup:
 * 1. Create a Google Sheet (e.g. "Cotizaciones Velmon") with a first row
 *    of headers matching HEADERS below.
 * 2. Open Extensions > Apps Script on that Sheet, paste this file as Code.gs.
 * 3. Deploy > New deployment > type "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the deployment URL into APPS_SCRIPT_URL in the site's .env.
 */

const HEADERS = [
    "receivedAt",
    "name",
    "email",
    "phone",
    "candleType",
    "message",
];

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

        if (sheet.getLastRow() === 0) {
            sheet.appendRow(HEADERS);
        }

        sheet.appendRow(HEADERS.map((key) => data[key] ?? ""));

        return ContentService.createTextOutput(
            JSON.stringify({ ok: true }),
        ).setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        return ContentService.createTextOutput(
            JSON.stringify({ ok: false, error: String(error) }),
        ).setMimeType(ContentService.MimeType.JSON);
    }
}
