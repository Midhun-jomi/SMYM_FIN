# Deployment Guide — SMYM FIN

This document details how to deploy the SMYM FIN frontend to production on [Vercel](https://vercel.com) (or any static hosting provider) with continuous integration from GitHub.

---

## 1. Prerequisites
- GitHub repository connected: [`https://github.com/Midhun-jomi/SMYM_FIN`](https://github.com/Midhun-jomi/SMYM_FIN)
- Google Apps Script Web App deployed and URL copied
- Optional: Google Cloud Console OAuth 2.0 Web Client ID

---

## 2. Deploying to Vercel (Recommended)

### Step 1: Import Project
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New > Project**.
3. Select your GitHub repository: `Midhun-jomi/SMYM_FIN`.

### Step 2: Build & Output Settings
- **Framework Preset**: `Vite`
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Environment Variables
Add the following environment variables in the Vercel dashboard under **Settings > Environment Variables**:

| Variable Key | Description | Example Value |
|---|---|---|
| `VITE_APPS_SCRIPT_URL` | Deployed Google Apps Script Web App endpoint | `https://script.google.com/macros/s/AKfycb.../exec` |
| `VITE_GOOGLE_CLIENT_ID` | *(Optional)* Google OAuth Client ID for live GIS sign-in | `123456789-abc.apps.googleusercontent.com` |

### Step 4: Deploy
Click **Deploy**. Vercel will build and deploy the React application.

---

## 3. Configuring SPA Routing for Direct URLs
Vercel automatically detects Vite single-page applications. If deploying on Apache/Nginx or generic static hosting, ensure all routes are rewritten to `/index.html`:

**`vercel.json` (Included in repo):**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 4. Post-Deployment Verification Checklist
- [ ] Public visitor access: Open homepage in an Incognito window without logging in. Verify dashboard, charts, transactions, bills, and events load.
- [ ] Financial calculations: Check that Available Balance, Net Cash Flow, and Outstanding Bills match spreadsheet values.
- [ ] Write protection: Confirm that "+ Add Record" and edit/void buttons are hidden for public visitors.
- [ ] Authentication: Navigate to `/login`, switch to Editor/Admin role, and verify creation of transactions and payment against bills.
- [ ] HTTPS & SSL: Ensure all requests are served over secure HTTPS.
