# Quality Assurance & Testing Guide — SMYM FIN

This document outlines the testing strategy, test suites, and validation procedures implemented across the SMYM FIN system.

---

## 1. Automated Unit Tests

Automated unit tests are implemented using [Vitest](https://vitest.dev).

### Running Unit Tests
```bash
npm run test
```

### Test Coverage Highlights
Located in [`src/utils/__tests__/finance.test.ts`](file:///Users/mj/Downloads/Project_Main/SMYM%20FIN/src/utils/__tests__/finance.test.ts):
- **Financial Calculation Integrity**: Validates accurate calculation of Total Income, Total Expenses, and Net Cash Flow.
- **Transfer Isolation Rule**: Verifies transfers between accounts (e.g. Bank to Petty Cash) update account balances without inflating society income or expenses.
- **Void Status Exclusion**: Verifies `VOID` transactions are excluded from active sums while retaining ledger history.
- **Outstanding Liabilities**: Validates deduction of payments made against vendor contracts and flags overdue dates.
- **Currency Formatting**: Confirms `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })` formats amounts in Indian Rupees (e.g., `₹1,50,000.00`).
- **Date Utilities**: Validates overdue date detection and uniform display dates.

---

## 2. Functional Manual Verification Matrix

| Area | Test Case | Expected Outcome | Status |
|---|---|---|:---:|
| **Dashboard** | Load homepage as public visitor | KPI cards, operating ledgers, recent records, and charts render | Pass |
| **Dark Mode** | Toggle theme switch in navbar | Entire layout, cards, badges, and modals switch with smooth transition | Pass |
| **Transactions** | Public user visits `/transactions` | "+ Add Record" button is hidden, read-only table with search & export works | Pass |
| **Transactions** | Editor adds Income transaction | Form validates fields, creates persistent entry in ledger & Google Sheets | Pass |
| **Transactions** | Editor adds Inter-Account Transfer | Source and destination accounts update, overall income/expense unchanged | Pass |
| **Transactions** | Admin voids transaction | Transaction status updates to `VOID`, account balance reverses automatically | Pass |
| **Bills** | Record partial payment against bill | Progress bar updates, remaining balance updates, linked expense recorded | Pass |
| **Events** | Create youth tournament project | Event card displays budget, surplus/deficit dynamically links to ledger | Pass |
| **Auth** | Switch to simulated Admin | User Management table unlocks with ability to promote/demote editors | Pass |
| **Auth** | Admin attempts to edit own role | Blocked with security warning "Cannot alter own permissions" | Pass |

---

## 3. End-to-End Build & Compilation Verification
To verify production readiness:
```bash
npm run build
```
This runs TypeScript checking (`tsc -b`) and Vite production bundling to ensure zero type errors and clean asset generation.
