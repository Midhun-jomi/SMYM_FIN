# SMYM FIN — Agent & Engineering Guidelines

## 1. Project Overview
SMYM FIN is a web-based financial management system for a church society (SMYM).
- **Public Users**: Read-only access to approved financial reports, dashboard, transactions, bills, and events. No login required.
- **Editors**: Authenticated users who can add/edit transactions, manage bills, and create events.
- **Admins**: Authenticated users with full control, including transaction voiding and user role management.
- **Backend & Storage**: Google Apps Script backend API connected to Google Sheets as the single source of truth.

## 2. Technology Stack
- **Frontend**: React 18 / 19, TypeScript, Vite
- **Styling**: Tailwind CSS with a clean, high-contrast white & emerald/green financial aesthetic
- **Icons**: Lucide React
- **Charts**: Recharts
- **Backend**: Google Apps Script (Web App)
- **Data Store**: Google Sheets
- **Auth**: Google Identity Services (GIS OAuth 2.0)
- **Deployment**: Vercel (Frontend), Google Apps Script (Backend)

## 3. Financial Integrity & Business Rules
1. **Single Source of Truth**: Google Sheets is the authoritative source for persisted financial records.
2. **Stable IDs**: Every record must have an immutable unique ID (`transaction_id`, `bill_id`, etc.), never rely on spreadsheet row numbers.
3. **No Direct Row Deletion**: Prefer status `VOID` or `CANCELLED` over deleting records. Voided transactions must be excluded from balance calculations while retained in audit logs.
4. **Opening Balance & Net Cash Flow**: Account balances are derived from opening balance + signed movements.
5. **Transfers**: Transfers between society accounts must update respective account balances but NEVER inflate overall income or expenses.
6. **Currency**: All amounts formatted in Indian Rupees (INR) using `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.
7. **Mock Data Labeling**: During development without live backend connection, all sample data must be explicitly labeled as demo/mock data.

## 4. Security Principles
1. **Never Expose Secrets in Frontend**: Service account keys, OAuth client secrets, or private spreadsheet access tokens must NEVER be placed in client-side code or git commits.
2. **Backend-Enforced Authorization**: Frontend role checks are for UI display only. The Google Apps Script backend must verify the Google ID token and server-side role assignment before executing any write/void operations.
3. **Prevent Self-Promotion**: Users cannot modify their own permissions or roles.
4. **Sanitize Public Data**: Public read endpoints must strip internal audit metadata, private user records, or sensitive payment references.
5. **Audit Trail**: Every create/update/void action must append an immutable entry to the `AuditLog` sheet.

## 5. Coding Conventions
- Strictly typed TypeScript. Do not use `any`.
- Modular components separated by domain (`components/dashboard`, `components/transactions`, `components/bills`, `components/events`, `components/ui`, `components/layout`).
- Centralized API service layer (`services/api.ts`) that handles mock fallback mode vs live Google Apps Script endpoint.
- Pure utility functions for financial calculations (`utils/finance.ts`, `utils/currency.ts`, `utils/date.ts`).
- Descriptive IDs on interactive elements for browser accessibility and testing.

## 6. Definition of Done
A sprint or feature is complete only when:
- [ ] TypeScript compiles cleanly with zero errors (`npm run build`).
- [ ] ESLint passes without errors.
- [ ] Client validation + backend error handling is in place.
- [ ] Loading, empty, and error states are implemented and tested.
- [ ] Financial calculations adhere to INR formatting and transfer rules.
- [ ] Responsive on mobile and desktop viewports.
- [ ] Documentation updated.
- [ ] No secrets committed.
