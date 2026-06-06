# Cloud Function: real-time intake → 5rgroup_core_Db (Contacts tab)

Fires the instant a Contact Info Sheet is submitted and appends a row to the
**Contacts** tab of your **5rgroup_core_Db** spreadsheet, mapped to your header.
Every intake lead is written with **Category = "Intake"**. Authenticates as the
Cloud Functions service account — no key files.

Target sheet ID: `1beTrZCUM0jBDwpbE1SLgC-m2gOG2tPELxfau3vVn-_w`
Target tab: `Contacts`

## Column mapping (intake → Contacts)
Your original header is columns A–L. The form collects more than that, so the
extra fields go in new columns M–Z.

| Col | Header            | Comes from                          |
|-----|-------------------|-------------------------------------|
| A   | Contact_ID        | Firestore doc ID                    |
| B   | Company_ID        | (blank)                             |
| C   | Email             | primary email                       |
| D   | FName             | primary first name                  |
| E   | LName             | primary last name                   |
| F   | Phone             | preferred phone (cell→home→work)    |
| G   | Category          | "Intake" (always)                   |
| H   | Status            | "New"                               |
| I   | Lifecycle_Stage   | (blank)                             |
| J   | Timeline          | (blank)                             |
| K   | Interest_Tags     | (blank)                             |
| L   | Next_Touch_Date   | (blank)                             |
| M   | Email_Type        | work / personal                     |
| N   | Home_Phone        | primary home phone                  |
| O   | Work_Phone        | primary work phone                  |
| P   | Cell_Phone        | primary cell phone                  |
| Q   | Address           | primary address                     |
| R   | DOB               | primary date of birth               |
| S   | Contact_Methods   | checked methods, e.g. "phone, email"|
| T   | Best_Time_To_Call | text entered when Phone is checked  |
| U   | Has_Secondary     | Yes / No                            |
| V   | Secondary_Name    | secondary first + last              |
| W   | Secondary_Email   | secondary email                     |
| X   | Secondary_Phone   | secondary preferred phone           |
| Y   | Notes             | notes textarea                      |
| Z   | Submitted_At      | submission timestamp                |

**ACTION REQUIRED:** add headers to the Contacts tab in cells **M1 through Z1**
(your A1–L1 already exist), so the appended columns line up:

`Email_Type  Home_Phone  Work_Phone  Cell_Phone  Address  DOB  Contact_Methods  Best_Time_To_Call  Has_Secondary  Secondary_Name  Secondary_Email  Secondary_Phone  Notes  Submitted_At`

## One-time setup (the sheet sync)

1. **Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Init Functions** (from repo root, if firebase.json doesn't exist)
   ```bash
   firebase init functions
   ```
   - Existing project: **intake-form-87163**
   - Language: **JavaScript**
   - Overwrite existing files: **No** (keep the index.js/package.json here)

3. **Share the spreadsheet** with the service account:
   - Email: **intake-form-87163@appspot.gserviceaccount.com**
     (confirm in Firebase Console → Project settings → Service accounts →
     "App Engine default service account")
   - Open 5rgroup_core_Db → Share → paste that email → **Editor** → Send.

4. **Set the sheet ID** — create `functions/.env` (gitignored, do NOT commit):
   ```
   SHEET_ID=1beTrZCUM0jBDwpbE1SLgC-m2gOG2tPELxfau3vVn-_w
   ```

5. **Deploy**
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

6. **Test** — submit the form on the live site. A new row appears in Contacts
   within ~1s with Category = Intake. If not: `firebase functions:log`.

## Thank-you email (DISABLED for now)

The email function is written but commented out in `index.js`. To turn it on
once **info@5rgroup.com** exists:

1. Set up info@5rgroup.com (Google Workspace recommended so the from-address
   sticks; plain Gmail will rewrite it to the actual account).
2. Enable 2FA on that account, then create a **Gmail App Password**
   (Google Account → Security → App passwords).
3. Store secrets:
   ```bash
   firebase functions:secrets:set GMAIL_USER          # info@5rgroup.com
   firebase functions:secrets:set GMAIL_APP_PASSWORD  # the app password
   ```
4. Add `"nodemailer": "^6.9.0"` to functions/package.json dependencies, run
   `npm install` in functions/.
5. Uncomment the `sendThankYouEmail` block (and its imports) at the bottom of
   index.js, then `firebase deploy --only functions`.

## Notes
- Email is OPTIONAL on the form, so the email function safely no-ops when a
  lead has no email address.
- If you set up the earlier Apps Script timer, DELETE its trigger to avoid
  duplicate rows.
- Firestore security rules stay locked; the function runs server-side.
