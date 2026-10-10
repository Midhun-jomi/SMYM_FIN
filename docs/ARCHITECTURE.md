# SMYM FIN — System Architecture & Data Flow

## 1. High-Level Architecture

```
[Public Visitor] ─────────────┐
                              │
[Authorized Editor/Admin] ────┼───► [Vite + React SPA (Vercel)]
 (Google Identity Sign-In)    │           │
                              │           │ HTTPS REST / RPC
                              │           ▼
                              └───► [Google Apps Script Web App API]
                                          │
                                          │ Server-side Token & Role Validation
                                          ▼
                                    [Google Sheets Database]
                                    - Transactions
                                    - Accounts
                                    - Bills
                                    - Events
                                    - Users
                                    - AuditLog
                                    - Settings
```

## 2. Component Layers

### Frontend (SPA)
- **Framework**: React + Vite + TypeScript.
- **State & Data Access**: Custom React Hooks (`useAuth`, `useTransactions`, `useDashboardSummary`, `useBills`, `useEvents`) wrapping a typed API client.
- **Routing**: React Router DOM (v6/v7) with public routes (`/`, `/transactions`, `/income`, `/expenses`, `/bills`, `/events`, `/reports`) and protected editor/admin views (`/admin`, `/login`).
- **UI & Design**: Modern emerald/forest-green & crisp white financial theme. Reusable components with Tailwind CSS, Lucide icons, and Recharts.

### Backend (Google Apps Script API)
- Deployed as a Google Apps Script Web App (`doGet` / `doPost`).
- Handles CORS and JSON payloads.
- Verifies Google OAuth token on every write/delete/admin request.
- Reads user roles from the protected `Users` sheet.
- Manages concurrency using `LockService.getScriptLock()`.
- Appends changes to `AuditLog`.

### Database (Google Sheets)
Structured relational sheets:
1. **Transactions**: `transaction_id`, `date`, `type`, `description`, `category`, `amount`, `account_id`, `payment_method`, `event_id`, `reference_id`, `status`, `created_by`, `created_at`, `updated_by`, `updated_at`
2. **Accounts**: `account_id`, `account_name`, `account_type`, `opening_balance`, `current_balance`, `is_active`
3. **Bills**: `bill_id`, `bill_name`, `vendor`, `amount`, `due_date`, `category`, `status`, `linked_transaction_id`, `notes`
4. **Events**: `event_id`, `event_name`, `event_date`, `budget`, `total_income`, `total_expense`, `status`
5. **Users**: `user_id`, `email`, `display_name`, `role` (VIEWER / EDITOR / ADMIN), `status` (ACTIVE / DISABLED), `created_at`, `updated_at`
6. **AuditLog**: `log_id`, `timestamp`, `actor_email`, `action`, `entity_type`, `entity_id`, `before_state`, `after_state`
7. **Settings**: Key-value pairs for organization name, currency symbol, income/expense categories, and financial year dates.
