# SMYM FIN — Agile Development Sprint Plan

**Project:** SMYM FIN  
**Purpose:** Church Society Financial Management System  
**Development environment:** Google Antigravity  
**Methodology:** Agile / Scrum  
**Estimated duration:** 6 sprints over approximately 3 weeks  
**Frontend hosting target:** Vercel  
**Primary data source:** Google Sheets

---

## 1. Project vision

SMYM FIN is a web-based financial management application for a church society. It will provide a centralized platform for tracking income, expenses, donations, bills, events, and financial reports.

Anyone with the public URL can view approved financial records without logging in. Only authenticated and authorized users can create or modify financial data.

### Core objectives

1. Provide a professional financial dashboard.
2. Integrate Google Sheets for persistent financial data.
3. Support income, expenses, transfers, and bill management.
4. Implement backend-enforced role-based access control.
5. Provide financial charts and reporting.
6. Maintain an audit trail for financial changes.
7. Deploy a responsive and secure web application.

## 2. Recommended technology stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React + Vite + TypeScript | Application interface |
| Styling | Tailwind CSS | Responsive design |
| UI components | shadcn/ui | Consistent interface components |
| Charts | Recharts | Financial visualizations |
| Icons | Lucide React | Interface icons |
| Backend | Google Apps Script | API and business logic |
| Data storage | Google Sheets | Financial records |
| Authentication | Google Identity Services | Google sign-in |
| Authorization | Role-based access control | Restrict modifications |
| Hosting | Vercel | Frontend deployment |
| Version control | Git + GitHub | Source control |

### Architecture

**Public or authorized user → React frontend → secure backend API → Google Sheets**

The backend must validate every write operation. Never expose Google service-account credentials, private keys, or unrestricted spreadsheet access in frontend code.

Google sign-in establishes identity; it does not automatically establish authorization. The backend must verify the user's identity and assigned role before accepting changes.

## 3. Sprint overview

| Sprint | Estimated duration | Focus | Deliverable |
|---|---:|---|---|
| Sprint 1 | Days 1–2 | Project setup and UI foundation | Application shell and design system |
| Sprint 2 | Days 3–5 | Dashboard and analytics | Interactive dashboard |
| Sprint 3 | Days 6–8 | Google Sheets integration | Working data API |
| Sprint 4 | Days 9–11 | Transactions and bills | Financial management modules |
| Sprint 5 | Days 12–13 | Authentication and permissions | Secure role-based access |
| Sprint 6 | Days 14–15 | Testing and deployment | Verified release |

These are planning estimates, not guarantees. Authentication and backend integration may require extra time.

---

## SPRINT 1 — Project setup and UI foundation

**Estimated duration:** 2 working days

### Objective
Establish the project structure and visual foundation of SMYM FIN.

### Tasks
- Initialize React + Vite + TypeScript.
- Configure Tailwind CSS, ESLint, and TypeScript.
- Install required dependencies.
- Initialize Git and create `.env.example` with placeholders only.
- Create reusable components for navigation, headers, summary cards, tables, forms, dialogs, loading states, errors, and notifications.
- Create routes:
  - `/` — Dashboard
  - `/transactions` — Transactions
  - `/income` — Income
  - `/expenses` — Expenses
  - `/bills` — Bills
  - `/events` — Events
  - `/reports` — Reports
  - `/login` — Editor/admin sign-in
- Define TypeScript types for Transaction, Account, Bill, Event, User, AuditLog, and FinancialSummary.
- Create `AGENTS.md` documenting architecture, coding conventions, security, tests, and Definition of Done.

### Acceptance criteria
- App runs locally without errors.
- All primary routes load and navigation works.
- Components are reusable.
- TypeScript compilation succeeds.
- Desktop and mobile layouts work.
- No real financial data or credentials are committed to Git.

**Deliverable:** Functional frontend foundation with a consistent design system.

## SPRINT 2 — Dashboard and financial analytics

**Estimated duration:** 3 working days

### Objective
Build the main financial dashboard with summary cards, transaction previews, and charts.

### Tasks
- Display Total Income, Total Expenses, Available Balance, and Outstanding Bills.
- Centralize calculations for income, expenses, net cash flow, opening balance, and outstanding bills.
- Create Recharts visualizations:
  - Monthly income vs. expenses
  - Expense categories
  - Monthly cash flow
  - Event-wise spending
- Display recent transactions with date, description, category, type, payment method, and amount.
- Add filters for current month, previous month, custom date range, category, and transaction type.
- Implement loading, empty, error, and retry states.

### Acceptance criteria
- Financial totals match the supplied dataset.
- Date filters update all relevant cards and charts consistently.
- Charts handle empty and zero-value datasets.
- Currency is formatted in INR.
- Layout is responsive.

**Deliverable:** Interactive dashboard using clearly labelled mock data.

**Restriction:** Do not claim the dashboard is connected to Google Sheets until that integration has been implemented and tested.

## SPRINT 3 — Google Sheets integration

**Estimated duration:** 3 working days

### Objective
Connect the application to Google Sheets for persistent data.

### Tasks
Create spreadsheet tabs:

- `Transactions`
- `Accounts`
- `Bills`
- `Events`
- `Users`
- `AuditLog`
- `Settings`

Use a single canonical `Transactions` sheet rather than duplicating transactions across sheets.

Recommended transaction fields:

`transaction_id, date, type, description, category, amount, account_id, payment_method, event_id, reference_id, status, created_by, created_at, updated_by, updated_at`

Implement backend functions for:
- Reading transactions, accounts, bills, and events.
- Adding and updating transactions.
- Managing bills.
- Retrieving dashboard summaries.

Validate required fields, dates, positive amounts, transaction types, categories, account references, and IDs on the backend.

For safe writes:
- Verify authorization.
- Validate the request.
- Use locking or another concurrency-safe write strategy.
- Locate records by unique ID, not spreadsheet row number.
- Record successful changes in the audit log.

Connect the frontend to real API responses and implement loading, success, empty, and error states.

### Acceptance criteria
- App reads real spreadsheet records.
- Adding a transaction creates a persistent row.
- Editing updates the correct record.
- Invalid and unauthorized requests are rejected.
- Refreshing preserves saved data.
- Credentials are never exposed to the browser.
- Failed writes show clear errors.

**Deliverable:** Working Google Sheets integration.

## SPRINT 4 — Transaction, bill, and event management

**Estimated duration:** 3 working days

### Objective
Implement the core financial workflows.

### Transaction form
Include:
- Type: Income / Expense / Transfer
- Date
- Description
- Category
- Amount
- Account
- Payment method: Cash / Bank / UPI / Other
- Optional event
- Optional reference and notes

Use client-side validation for usability and server-side validation for security.

### Transaction table
Implement search, sorting, pagination, date filters, category filters, type filters, detail view, and authorized editing.

### Income categories
Examples: donations, membership fees, event collections, contributions, other income.

### Expense categories
Examples: event expenses, society activities, travel, purchases, maintenance, administration, other expenses.

Make categories configurable.

### Bill management
Fields: bill name, vendor/payee, amount, due date, category, payment status, linked transaction, and notes.

Statuses:
- Pending
- Partially paid
- Paid
- Overdue
- Cancelled

An overdue status applies only when a bill is unpaid or partially paid and its due date has passed.

### Event management
Allow authorized users to create events and track event name, date, budget, event income, event expenses, and net event balance. Link event transactions to the relevant event.

### Financial integrity
A credit-card purchase is an expense when made. Paying the credit-card bill later is a transfer, not another expense. Transfers must not inflate income or expenses.

### Acceptance criteria
- Authorized users can add and edit records.
- Changes persist to Google Sheets.
- Public users cannot write to the backend.
- Search and filters work.
- Bill statuses are correct.
- Event totals are correct.
- Transfers are not double-counted.
- Failed submissions are not shown as successfully saved.

**Deliverable:** Transaction, bill, and event workflows.

## SPRINT 5 — Authentication and role-based access control

**Estimated duration:** 2 working days

### Objective
Enable public viewing while restricting changes to authorized users.

### Roles and permissions

| Permission | Public Viewer | Editor | Admin |
|---|:---:|:---:|:---:|
| View approved dashboard | Yes | Yes | Yes |
| View approved transactions | Yes | Yes | Yes |
| Search and filter | Yes | Yes | Yes |
| View charts and reports | Yes | Yes | Yes |
| Add transactions | No | Yes | Yes |
| Edit transactions | No | Yes | Yes |
| Manage bills | No | Yes | Yes |
| Create events | No | Yes | Yes |
| Void transactions | No | No | Yes |
| Manage user roles | No | No | Yes |
| View audit history | No | Yes | Yes |

Public users do not need to sign in. Editors and admins must authenticate.

### Tasks
- Implement Google Identity Services sign-in.
- Verify authentication responses on the backend.
- Resolve roles from trusted server-side data.
- Store authorized users in the `Users` sheet with fields such as `user_id, email, display_name, role, status, created_at, updated_at`.
- Allow only admins to change roles.
- Verify authentication, active status, role, and request data on every write endpoint.
- Return only approved fields from public read endpoints.
- Record actor, action, record ID, timestamp, and relevant before/after values in the audit log.
- Keep audit records inaccessible to ordinary transaction write operations.

### Security requirements
- Hiding edit buttons is not security; backend authorization is mandatory.
- Never trust role data supplied by the frontend.
- Users must not be able to promote themselves.
- Do not expose private credentials, tokens, donor details, or internal audit metadata publicly.
- Keep the spreadsheet private and publish approved records through the backend.

### Acceptance criteria
- Public visitors can view approved records without login.
- Editors can add and edit records after authentication.
- Admins can manage roles.
- Direct unauthorized write requests are rejected.
- Frontend changes cannot bypass permissions.
- Disabled users cannot edit.
- Successful financial changes create audit entries.

**Deliverable:** Role-protected application with public read access and authorized write access.

**Technical caveat:** Google Apps Script and Google Identity Services must be integrated carefully. A sign-in token alone does not grant write permission; the backend must verify it and check the user's role. Do not mark authentication complete until direct unauthorized API requests have been tested against the deployed backend.

## SPRINT 6 — Testing, deployment, and release

**Estimated duration:** 2 working days

### Functional tests
Test:
- Adding income and expenses
- Editing transactions
- Search and filters
- Bill payments
- Event creation
- Financial summaries
- Google Sheets reads and writes
- API errors

### Permission tests

| Scenario | Expected result |
|---|---|
| Public visitor opens dashboard | Allowed |
| Public visitor submits transaction | Rejected |
| Unauthenticated user calls write API | Rejected |
| Authorized editor adds income | Allowed |
| Authorized editor edits expense | Allowed |
| Editor attempts to change their role | Rejected |
| Editor attempts to void/delete a transaction | Rejected |
| Admin assigns an editor role | Allowed |
| Disabled user attempts to edit | Rejected |

### Financial calculation tests
Verify opening balance, income minus expenses, date-range summaries, monthly grouping, event totals, outstanding bills, transfer handling, and voided transaction handling.

### UI tests
Test desktop and mobile layouts, form validation, empty/loading states, API failures, network interruptions during writes, long descriptions, and large transaction lists.

### Deployment and documentation
- Deploy frontend to Vercel.
- Configure Google Apps Script and its authorization settings.
- Configure environment variables in deployment settings.
- Ensure no secrets are committed to GitHub.
- Create:
  - `README.md`
  - `AGENTS.md`
  - `.env.example`
  - `docs/ARCHITECTURE.md`
  - `docs/GOOGLE_SHEETS_SETUP.md`
  - `docs/DEPLOYMENT.md`
  - `docs/USER_ROLES.md`
  - `docs/TESTING.md`

### Acceptance criteria
- Production build succeeds.
- Deployed site loads correctly.
- Google Sheets reads and writes work in production.
- Critical permission tests pass.
- Financial calculations match expected results.
- No secrets are exposed in the repository or frontend bundle.
- Setup and deployment steps are documented.

**Deliverable:** Deployed and tested SMYM FIN application.

---

## 4. Suggested project structure

```text
smym-fin/
├── public/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   ├── layout/
│   │   ├── transactions/
│   │   ├── bills/
│   │   ├── events/
│   │   └── ui/
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   ├── Income.tsx
│   │   ├── Expenses.tsx
│   │   ├── Bills.tsx
│   │   ├── Events.tsx
│   │   ├── Reports.tsx
│   │   └── Login.tsx
│   ├── services/
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── docs/
├── tests/
├── .env.example
├── AGENTS.md
├── package.json
└── README.md
```

Keep Google Apps Script backend code in a separate directory or repository, depending on the deployment workflow. Do not place privileged backend logic inside React components.

## 5. Mandatory financial rules

1. **Single source of truth:** Google Sheets is authoritative. Derive dashboard totals from saved records.
2. **Opening balance:** Calculate balance from opening balance and signed account movements. Handle transfers by account.
3. **Stable IDs:** Use immutable unique transaction IDs, never spreadsheet row numbers as record identifiers.
4. **Voiding:** Prefer voiding over permanent deletion. Exclude voided transactions from active totals while retaining history.
5. **Audit history:** Every successful financial modification must produce an audit entry.
6. **Public access:** Publish only approved fields; never expose the spreadsheet itself publicly.
7. **Authorization:** Enforce permissions on the backend.
8. **Error handling:** A failed write must not be presented as successful.
9. **Currency:** Use Indian rupees (INR), for example ₹1,500.00 and ₹1,25,000.00.
10. **No fabricated data:** Clearly label demo data and never present it as actual society records.

## 6. Definition of Done

A feature is complete only when:
- [ ] Implementation is complete.
- [ ] TypeScript and lint checks pass.
- [ ] Validation is implemented.
- [ ] Loading and error states are implemented.
- [ ] Backend authorization is enforced where required.
- [ ] Automated tests cover important behavior.
- [ ] Changes persist to Google Sheets where applicable.
- [ ] Financial totals are correct.
- [ ] Desktop and mobile layouts work.
- [ ] Documentation is updated.
- [ ] No secrets are committed.
- [ ] Acceptance criteria are verified.

Do not mark a sprint complete just because the UI looks finished.

---

## 7. Master prompt for Google Antigravity

Copy and paste the prompt below into Antigravity to begin implementation.

> # Project: SMYM FIN
>
> Act as a senior full-stack engineer, software architect, UI/UX designer, QA engineer, and security reviewer.
>
> Build a production-oriented church society financial management web application named SMYM FIN.
>
> **Requirements**
>
> - Public viewing of approved financial records without login.
> - Google authentication for authorized editors and admins.
> - Backend-enforced role-based authorization.
> - Income, expense, transfer, account, bill, and event management.
> - Interactive financial charts and reports.
> - Search, sorting, pagination, and date filters.
> - Audit logging.
> - Google Sheets integration.
> - Responsive desktop and mobile layouts.
>
> **Technology**
>
> Use React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Recharts, Lucide React, Google Apps Script, Google Sheets, Google Identity Services, Vercel, Git, and GitHub. If a technical limitation requires a change, document the reason first.
>
> **Roles**
>
> - PUBLIC VIEWER: view approved dashboard and transactions, search, and filter; cannot write.
> - EDITOR: viewer permissions plus adding/editing transactions and managing bills/events; cannot manage roles or void transactions.
> - ADMIN: editor permissions plus user/role management, transaction voiding, and audit review.
>
> Public visitors must not need to sign in. Authenticate editors and admins. Never trust roles supplied by the frontend; verify identity and authorization on the backend for every write request.
>
> **Data model**
>
> Create Google Sheets tabs named Transactions, Accounts, Bills, Events, Users, AuditLog, and Settings. Use a canonical Transactions sheet, immutable unique IDs, and the types INCOME, EXPENSE, and TRANSFER. Preserve voided records for audit purposes.
>
> **Development workflow**
>
> 1. Inspect the existing repository and preserve useful work.
> 2. Create `AGENTS.md`, `docs/SPRINT_PLAN.md`, and `docs/ARCHITECTURE.md`.
> 3. Identify integration requirements and security risks.
> 4. Implement Sprint 1 first.
> 5. After each sprint, run tests, TypeScript checks, lint, and production build.
> 6. Verify the sprint's acceptance criteria and update the checklist.
> 7. Document completed work, known issues, and the next sprint.
>
> Do not attempt to generate the whole application in one unverified step. Do not claim a feature works unless implemented and tested. Do not substitute mock data for real Google Sheets integration in production.
>
> **Security**
>
> Never expose privileged credentials in frontend code. Keep the spreadsheet private. Verify Google authentication on the backend. Enforce authorization on every write endpoint. Validate inputs server-side. Use a concurrency-safe write strategy. Maintain an audit trail. Prevent users from changing their own roles. Never log tokens or secrets.
>
> **Financial integrity**
>
> Use INR formatting. Derive balances from persisted transactions and opening balances. Exclude voided transactions from active totals. Do not double-count transfers or credit card bill payments. Test calculations. Use immutable IDs rather than spreadsheet row numbers.
>
> **Design**
>
> Build a professional finance dashboard with a clean white interface and green accents, responsive navigation, summary cards, income-versus-expenses charts, expense category charts, monthly cash flow, recent transactions, search, date filters, and accessible forms. Display the product name as SMYM FIN. Label development data clearly as demo data.
>
> **Release criteria**
>
> The app must build successfully, read and write Google Sheets, allow public read access to approved records, reject unauthorized writes, permit authorized editors to add/edit records, permit admins to manage roles, pass financial calculation tests, record audit entries, work on desktop/mobile, expose no secrets, and include setup/deployment documentation.
>
> Start by inspecting the repository and preparing Sprint 1. Do not begin by generating every feature at once.

## 8. Execution sequence

1. Open or create the SMYM FIN project in Antigravity.
2. Paste the master prompt.
3. Review the generated `AGENTS.md`, architecture document, and sprint checklist.
4. Complete and verify Sprint 1 before moving to Sprint 2.
5. Configure Google Sheets and authentication using authorized accounts.
6. Test permissions against the real backend before production use.
7. Deploy only after the release criteria are satisfied.

**Priority:** Security and financial correctness come before advanced features. A polished dashboard is useful, but the system must protect records and calculate balances accurately.
