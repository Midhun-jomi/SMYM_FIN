# Role-Based Access Control (RBAC) & Security Policy — SMYM FIN

SMYM FIN employs a strict three-tier role-based security model to guarantee financial transparency while maintaining strict audit and authorization boundaries.

---

## 1. Role Definitions

### 1. Public Viewer (`PUBLIC_VIEWER`)
- **Target Audience**: General parish members, youth society members, donors, and the parish community.
- **Authentication**: **No sign-in required**. Accessible directly upon opening the website.
- **Capabilities**:
  - View financial dashboard summary (Net income, total spent, available funds).
  - Inspect approved transaction ledgers, monthly trends, and expense breakdowns.
  - View vendor bills, liabilities status, and payment schedules.
  - Track youth event budgets, collections, and net surplus/deficit.
  - Export transactions to CSV.
  - Filter and search records by date, category, and keyword.
- **Restrictions**:
  - Strictly blocked from adding, modifying, or voiding financial entries.
  - Cannot access the user role management interface or internal audit logs.

---

### 2. Society Editor (`EDITOR`)
- **Target Audience**: Society Treasurer, Joint Treasurer, General Secretary, and authorized executive committee members.
- **Authentication**: Authenticated via Google Identity Services or authorized parish account.
- **Capabilities**:
  - Everything a Public Viewer can do.
  - Add new receipts/income entries (Tithes, donations, festival sponsorships).
  - Record society expenditures and inter-fund transfers.
  - Create vendor bills and record payments against contracts.
  - Create and configure youth events/projects.
- **Restrictions**:
  - Cannot void or cancel existing financial transactions.
  - Cannot modify user roles or promote other members.

---

### 3. Society Admin (`ADMIN`)
- **Target Audience**: Parish Priest / Director, Senior Trustee, Head Auditor.
- **Authentication**: Authenticated via verified Google Identity Services with active `ADMIN` status in the `Users` sheet.
- **Capabilities**:
  - Complete control over society finances.
  - Void incorrect or duplicate transactions with an automatic reverse balance adjustment.
  - Authorize new committee members (`Add User`).
  - Promote or demote member roles (`EDITOR` ↔ `ADMIN`).
  - Activate or deactivate accounts.
  - Access immutable system audit logs.
- **Security Constraint**:
  - **Self-promotion & self-modification protection**: An Admin cannot modify or deactivate their own permissions to prevent locking out administrators or escalating privileges.

---

## 2. Server-Side Enforcement (Google Apps Script)

> [!CAUTION]
> Frontend UI hiding is for user experience only. Backend authorization is strictly enforced on every mutation endpoint.

| Endpoint Action | Required Role | Enforcement Strategy |
|---|:---:|---|
| `getDashboard`, `getTransactions`, `getBills`, `getEvents` | Public | Open read access with audit trail sanitation |
| `addTransaction`, `addBill`, `payBill`, `addEvent` | Editor / Admin | Verified against `Users` sheet; rejects `PUBLIC_VIEWER` with HTTP 403 |
| `voidTransaction` | Admin | Validates actor has `ADMIN` role; reverses ledger balances |
| `addUser`, `updateUserRole` | Admin | Checks `actorRole === 'ADMIN'`; blocks self-modification |
