/**
 * Real-time Firestore -> Google Sheets sync for the PropTech Intake Portal.
 *
 * Trigger: fires whenever a new document is created in the `leads` collection
 * (submitted via the Contact Info Sheet form). Appends one row to the
 * "Contacts" tab of the 5rgroup_core_Db spreadsheet, mapped to that sheet's
 * header. Every intake lead gets Category = "Intake".
 *
 * Auth: runs as the Cloud Functions service account. SHARE the spreadsheet
 * (Editor) with that account's email so it can write. No key files needed.
 *
 * The thank-you EMAIL function is included below but COMMENTED OUT until the
 * info@5rgroup.com mailbox / Gmail credentials are configured. See SETUP.md.
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { defineString } from 'firebase-functions/params';
import { google } from 'googleapis';

// Target spreadsheet (5rgroup_core_Db) and tab.
const SHEET_ID = defineString('SHEET_ID');   // 1beTrZCUM0jBDwpbE1SLgC-m2gOG2tPELxfau3vVn-_w
const TAB_NAME = 'Contacts';

/**
 * Picks the "primary" phone for the Phone column, preferring cell > home > work.
 */
function primaryPhone(lead) {
  return lead.cellPhone || lead.homePhone || lead.workPhone || '';
}

/**
 * Maps a Firestore lead -> a row matching the Contacts header.
 *
 * Columns A-L are your original header:
 *   A Contact_ID | B Company_ID | C Email | D FName | E LName | F Phone |
 *   G Category | H Status | I Lifecycle_Stage | J Timeline | K Interest_Tags |
 *   L Next_Touch_Date
 *
 * Columns M onward are the extra Contact-Info-Sheet fields (add headers M1..):
 *   M Email_Type | N Home_Phone | O Work_Phone | P Cell_Phone | Q Address |
 *   R DOB | S Contact_Methods | T Best_Time_To_Call | U Has_Secondary |
 *   V Secondary_Name | W Secondary_Email | X Secondary_Phone | Y Notes |
 *   Z Submitted_At
 */
function buildRow(lead) {
  const sec = lead.secondary || {};
  const secName = lead.hasSecondary
    ? [sec.firstName, sec.lastName].filter(Boolean).join(' ')
    : '';
  const secPhone = lead.hasSecondary
    ? (sec.cellPhone || sec.homePhone || sec.workPhone || '')
    : '';

  return [
    lead.id || '',                        // A  Contact_ID
    '',                                   // B  Company_ID
    lead.email || '',                     // C  Email
    lead.firstName || '',                 // D  FName
    lead.lastName || '',                  // E  LName
    primaryPhone(lead),                   // F  Phone (preferred)
    'Intake',                             // G  Category (always)
    lead.status || 'New',                 // H  Status
    '',                                   // I  Lifecycle_Stage
    '',                                   // J  Timeline
    '',                                   // K  Interest_Tags
    '',                                   // L  Next_Touch_Date
    // --- extra Contact Info Sheet columns (add headers M1-Z1) ---
    lead.emailType || '',                 // M  Email_Type (work/personal)
    lead.homePhone || '',                 // N  Home_Phone
    lead.workPhone || '',                 // O  Work_Phone
    lead.cellPhone || '',                 // P  Cell_Phone
    lead.address || '',                   // Q  Address
    lead.dob || '',                       // R  DOB
    lead.contactMethod || '',             // S  Contact_Methods (e.g. "phone, email")
    lead.bestTimeToCall || '',            // T  Best_Time_To_Call
    lead.hasSecondary ? 'Yes' : 'No',     // U  Has_Secondary
    secName,                              // V  Secondary_Name
    (lead.hasSecondary && sec.email) || '', // W  Secondary_Email
    secPhone,                             // X  Secondary_Phone
    lead.notes || '',                     // Y  Notes
    lead.createdAt || ''                  // Z  Submitted_At
  ];
}

export const syncLeadToSheet = onDocumentCreated('leads/{leadId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const lead = snap.data() || {};
  lead.id = event.params.leadId;

  const row = buildRow(lead);

  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID.value(),
      range: `${TAB_NAME}!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] }
    });
    console.log('Appended lead to Contacts:', lead.id);
  } catch (err) {
    console.error('Failed to append lead to sheet:', err);
    throw err; // allow Cloud Functions retry
  }
});

/* ===========================================================================
 * THANK-YOU EMAIL — DISABLED FOR NOW
 * ---------------------------------------------------------------------------
 * This sends a thank-you email from info@5rgroup.com to the lead's address
 * the moment they submit. It is intentionally COMMENTED OUT until the mailbox
 * and Gmail app-password are set up. To enable:
 *
 *   1. Set up info@5rgroup.com (Google Workspace recommended so the
 *      from-address sticks).
 *   2. Create a Gmail App Password for that account
 *      (Google Account -> Security -> App passwords). Requires 2FA on.
 *   3. Store it as a secret:
 *        firebase functions:secrets:set GMAIL_USER     (info@5rgroup.com)
 *        firebase functions:secrets:set GMAIL_APP_PASSWORD
 *   4. Add "nodemailer" to functions/package.json dependencies and run
 *      npm install in functions/.
 *   5. Uncomment the block below (and the import), then redeploy:
 *        firebase deploy --only functions
 * ===========================================================================
 */

// import nodemailer from 'nodemailer';
// import { defineSecret } from 'firebase-functions/params';
//
// const GMAIL_USER = defineSecret('GMAIL_USER');
// const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');
//
// export const sendThankYouEmail = onDocumentCreated(
//   { document: 'leads/{leadId}', secrets: [GMAIL_USER, GMAIL_APP_PASSWORD] },
//   async (event) => {
//     const lead = event.data?.data();
//     if (!lead || !lead.email) return; // email is optional on the form
//
//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: GMAIL_USER.value(),
//         pass: GMAIL_APP_PASSWORD.value()
//       }
//     });
//
//     const firstName = lead.firstName || 'there';
//
//     await transporter.sendMail({
//       from: `"5RG Realty" <${GMAIL_USER.value()}>`, // info@5rgroup.com
//       to: lead.email,
//       subject: 'Thank you for reaching out to 5RG Realty',
//       html: `
//         <div style="font-family: Arial, sans-serif; color:#1a1a1a; line-height:1.6;">
//           <h2 style="color:#9b1b30;">Thank you, ${firstName}!</h2>
//           <p>We've received your contact information and a member of our team
//              will reach out to you shortly.</p>
//           <p>If you need to reach us in the meantime, simply reply to this email.</p>
//           <p style="margin-top:24px;">Warm regards,<br/><strong>The 5RG Realty Team</strong></p>
//         </div>
//       `
//     });
//
//     console.log('Thank-you email sent to:', lead.email);
//   }
// );
