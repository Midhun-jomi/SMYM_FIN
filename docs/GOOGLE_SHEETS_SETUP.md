# Google Sheets & Apps Script Setup Guide — SMYM FIN

This guide outlines how to configure the Google Sheets database and deploy the Google Apps Script Web App API for SMYM FIN.

---

## 1. Create the Google Spreadsheet
1. Go to [Google Sheets](https://sheets.new) while logged into the Google Account that manages parish society records.
2. Name the spreadsheet: **`SMYM FIN Database`**.

---

## 2. Install the Apps Script Backend
1. In your Google Spreadsheet menu, navigate to **Extensions > Apps Script**.
2. Rename the project to **`SMYM FIN Backend API`**.
3. In the code editor, delete the default `myFunction()` code.
4. Open the [`backend/Code.gs`](file:///Users/mj/Downloads/Project_Main/SMYM%20FIN/backend/Code.gs) file from this repository and copy its entire contents.
5. Paste it into `Code.gs` in the Google Apps Script editor.
6. Click the **Save** icon (diskette).

---

## 3. Initialize the Database Tabs (1-Click Setup)
1. In the Apps Script toolbar, locate the **Select function to run** dropdown.
2. Select `initializeDatabaseTabs`.
3. Click **Run**.
4. Google will ask for Authorization on the first run:
   - Click **Review Permissions**.
   - Choose your Google account.
   - Click **Advanced > Go to SMYM FIN Backend API (unsafe)**.
   - Click **Allow**.
5. Switch back to your Google Sheet. You will now see 7 automatically initialized tabs with pre-styled headers:
   - `Transactions`
   - `Accounts` (pre-seeded with Federal Bank, Cash in Hand, Youth Mission Fund)
   - `Bills`
   - `Events`
   - `Users` (pre-seeded with admin@smym.org, editor@smym.org, visitor@smym.org)
   - `AuditLog`
   - `Settings`

---

## 4. Deploy as Web App

> [!IMPORTANT]
> To allow the public frontend to communicate with Google Sheets, you must configure the exact deployment settings below.

1. In Apps Script, click the blue **Deploy** button at top right > **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in the deployment configuration:
   - **Description**: `SMYM FIN API Production v1`
   - **Execute as**: **`Me (your-email@gmail.com)`**
   - **Who has access**: **`Anyone`** *(Do NOT select "Only myself" as this blocks browser calls)*
4. Click **Deploy**.
5. Copy the generated **Web App URL** (e.g., `https://script.google.com/macros/s/AKfycb.../exec`).

---

## 5. Configure Frontend Environment Variable
In your project `.env` file (or Vercel environment variables):
```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

---

## 6. Updating the Backend
Whenever you make updates to `backend/Code.gs`:
1. In Apps Script, click **Deploy > Manage deployments**.
2. Click the pencil (edit) icon on the active deployment.
3. Under **Version**, select **New version**.
4. Click **Deploy**. The Web App URL will remain unchanged.
