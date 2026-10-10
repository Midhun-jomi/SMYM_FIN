# SMYM FIN — Required Credentials & Setup Guide

This guide details all credentials, API keys, and environment variables required for SMYM FIN.

---

## Summary of Credentials Needed

| Credential / Variable | Target Location | Purpose | Required For |
|---|---|---|---|
| **Google OAuth Client ID** (`VITE_GOOGLE_CLIENT_ID`) | Frontend `.env` | Google Sign-In for Editors/Admins | Auth (Sprint 5) |
| **Google Apps Script Web App URL** (`VITE_APPS_SCRIPT_URL`) | Frontend `.env` | API endpoint for data CRUD | Sheets Integration (Sprint 3) |
| **Google Spreadsheet ID** | Google Apps Script Backend | Primary database spreadsheet | Backend (Sprint 3) |
| **Vercel Account** | Vercel Platform | Hosting frontend React application | Deployment (Sprint 6) |

---

## 1. Google OAuth 2.0 Client ID (Frontend)
- **Where to obtain**: [Google Cloud Console](https://console.cloud.google.com/)
- **Steps**:
  1. Go to **APIs & Services** > **Credentials**.
  2. Click **Create Credentials** > **OAuth client ID**.
  3. Select Application type: **Web application**.
  4. Name: `SMYM FIN Web Client`.
  5. Under **Authorized JavaScript origins**, add:
     - `http://localhost:5173` (for local development)
     - `https://your-app.vercel.app` (production domain once deployed)
  6. Under **Authorized redirect URIs**, add:
     - `http://localhost:5173`
  7. Copy the **Client ID** (it looks like `123456789-xxxx.apps.googleusercontent.com`).
- **Environment Variable**: `VITE_GOOGLE_CLIENT_ID=<your-client-id>`

---

## 2. Google Sheet & Spreadsheet ID (Database)
- **Steps**:
  1. Create a new Google Sheet named `SMYM FIN Database` in Google Drive.
  2. Copy the spreadsheet ID from its URL:
     `https://docs.google.com/spreadsheets/d/`**`<SPREADSHEET_ID>`**`/edit`
  3. Create the 7 core tabs:
     - `Transactions`
     - `Accounts`
     - `Bills`
     - `Events`
     - `Users`
     - `AuditLog`
     - `Settings`
  *(Note: A setup script in our repo will automatically create and format these columns for you).*

---

## 3. Google Apps Script Web App (Backend API)
- **Steps**:
  1. In the Google Sheet, open **Extensions** > **Apps Script**.
  2. Paste the provided backend script (`backend/Code.gs` from this project).
  3. Click **Deploy** > **New deployment**.
  4. Select type: **Web app**.
  5. Configuration:
     - **Execute as**: `Me` (your Google account)
     - **Who has access**: `Anyone` (allows public read-only access, while write operations require token authorization)
  6. Click **Deploy** and authorize permissions.
  7. Copy the **Web App URL** (e.g. `https://script.google.com/macros/s/AKfycb.../exec`).
- **Environment Variable**: `VITE_APPS_SCRIPT_URL=<your-web-app-url>`

---

## 4. Local `.env` Configuration
In the project root, create `.env` from `.env.example`:
```env
# Google Identity Services
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here.apps.googleusercontent.com

# Google Apps Script Web App API
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/your_deployment_id/exec

# Environment Mode
VITE_APP_ENV=development
```
*(In development without these credentials configured, SMYM FIN will automatically run in Mock/Demo mode with clear labels).*
