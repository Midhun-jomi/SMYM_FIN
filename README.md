# SMYM FIN — Church Society Financial Management System

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/Midhun-jomi/SMYM_FIN)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

A web-based financial management system built for church youth societies (SMYM). Designed for radical parish financial transparency, robust accounting integrity, and effortless operation via Google Sheets.

---

## Key Highlights

- **Radical Parish Transparency**: Public visitors have instant read-only access to approved financial summaries, transactions, vendor contracts, and youth project reports without requiring a login.
- **Authoritative Google Sheets Backend**: Powered by Google Sheets as the single source of truth via Google Apps Script Web App API. Persists records with concurrency locking and immutable audit logs.
- **Three-Tier Role-Based Security**:
  - **Public Viewer**: View-only, search, filter, and export CSV.
  - **Society Editor**: Record receipts, expenditures, vendor liabilities, and youth events.
  - **Society Admin**: Complete oversight, non-destructive transaction voiding with automatic balance reversal, and committee member authorization.
- **Strict Financial Integrity**:
  - Indian Rupee (`₹`) native formatting using `Intl.NumberFormat('en-IN')`.
  - Non-destructive voiding (`VOID` status instead of row deletion).
  - Inter-fund transfers update account balances without inflating society income or expenses.
  - Automatic reconciliation between vendor bill disbursements and society expense ledgers.
- **High-Contrast Dark & Light Modes**: Tailored emerald/forest-green & crisp white financial aesthetic with persistent system dark mode.
- **100% Offline / Mock Fallback**: Includes realistic demo data and simulated role switching for development and offline testing.

---

## System Architecture

```
[Public Visitor] ─────────────┐
                              │
[Authorized Editor/Admin] ────┼───► [Vite + React SPA (Vercel)]
 (Google Identity Sign-In)    │           │
                              │           │ HTTPS REST / RPC
                              │           ▼
                              └───► [Google Apps Script Web App API]
                                          │
                                          │ Server-side Role Check & Concurrency Lock
                                          ▼
                                    [Google Sheets Database]
                                    - Transactions (Canonical Ledger)
                                    - Accounts (Bank, Cash, Funds)
                                    - Bills (Vendor Liabilities)
                                    - Events (Youth Projects & Budgets)
                                    - Users (Authorized Members & Roles)
                                    - AuditLog (Immutable Action Trail)
                                    - Settings (System Config)
```

---

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system (`index.css`), dark mode class support
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Monthly Trends & Category Breakdowns)
- **Backend & Database**: Google Apps Script (Web App) + Google Sheets
- **Authentication**: Google Identity Services (GIS OAuth 2.0)
- **Testing**: Vitest unit test suite

---

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/Midhun-jomi/SMYM_FIN.git
cd "SMYM FIN"
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```env
# Google Apps Script Web App Deployment URL
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# Optional: Google OAuth Client ID for live GIS sign-in
VITE_GOOGLE_CLIENT_ID=
```
*(Leave `VITE_APPS_SCRIPT_URL` empty to automatically run in offline Demo Mode with pre-populated sample records).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Run Automated Tests
```bash
npm run test
```

### 5. Build for Production
```bash
npm run build
```

---

## Detailed Documentation

- [System Architecture & Data Flow](docs/ARCHITECTURE.md)
- [Google Sheets & Apps Script Setup Guide](docs/GOOGLE_SHEETS_SETUP.md)
- [Vercel Deployment Guide](docs/DEPLOYMENT.md)
- [Role-Based Access Control (RBAC) & Security Policy](docs/USER_ROLES.md)
- [Quality Assurance & Testing Guide](docs/TESTING.md)
- [Master Agile Sprint Plan](docs/SPRINT_PLAN.md)

---

## Financial Integrity Principles

1. **Single Source of Truth**: Persistent data lives in Google Sheets. Derived metrics are calculated deterministically.
2. **Stable Unique IDs**: Every transaction (`txn_*`), bill (`bill_*`), event (`evt_*`), and user (`usr_*`) uses an immutable ID, never sheet row indices.
3. **Non-Destructive Voiding**: Transactions cannot be permanently erased. Voided items are marked `VOID`, excluded from active balances, and preserved in the audit log.
4. **Transfer Neutrality**: Account transfers adjust balances between funds but NEVER count as income or expense.
5. **No Self-Promotion**: Users cannot modify their own permissions or escalate privileges.

---

## License
MIT License. Built with devotion for church youth community empowerment.
