export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type PaymentMethod = 'CASH' | 'BANK' | 'UPI' | 'OTHER';

export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'VOID';

export interface Transaction {
  transaction_id: string;
  date: string; // ISO format: YYYY-MM-DD
  type: TransactionType;
  description: string;
  category: string;
  amount: number;
  account_id: string;
  account_name?: string;
  payment_method: PaymentMethod;
  event_id?: string;
  event_name?: string;
  reference_id?: string;
  status: TransactionStatus;
  created_by: string;
  created_at: string;
  updated_by?: string;
  updated_at?: string;
}

export type AccountType = 'BANK' | 'CASH' | 'PETTY_CASH';

export interface Account {
  account_id: string;
  account_name: string;
  account_type: AccountType;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
}

export type BillStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Bill {
  bill_id: string;
  bill_name: string;
  vendor: string;
  amount: number;
  paid_amount?: number;
  due_date: string;
  category: string;
  status: BillStatus;
  linked_transaction_id?: string;
  notes?: string;
}

export interface EventItem {
  event_id: string;
  event_name: string;
  event_date: string;
  budget: number;
  total_income: number;
  total_expense: number;
  net_balance: number;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  description?: string;
}

export type UserRole = 'PUBLIC_VIEWER' | 'EDITOR' | 'ADMIN';

export interface User {
  user_id: string;
  email: string;
  display_name: string;
  role: UserRole;
  status: 'ACTIVE' | 'DISABLED';
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLog {
  log_id: string;
  timestamp: string;
  actor_email: string;
  action: 'CREATE' | 'UPDATE' | 'VOID' | 'ROLE_CHANGE';
  entity_type: 'TRANSACTION' | 'BILL' | 'EVENT' | 'USER';
  entity_id: string;
  details: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  availableBalance: number;
  netCashFlow: number;
  outstandingBillsTotal: number;
  outstandingBillsCount: number;
  activeEventsCount: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}
