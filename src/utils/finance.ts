import { Transaction, Account, Bill, FinancialSummary, MonthlyTrend, CategoryBreakdown } from '../types';

/**
 * Calculates overall financial summary adhering to church society financial integrity rules:
 * - Voided transactions are strictly excluded from calculations.
 * - Transfers do NOT inflate total income or total expenses.
 * - Available balance is derived from accounts' current balances or opening balances + signed movements.
 */
export function calculateFinancialSummary(
  transactions: Transaction[],
  accounts: Account[],
  bills: Bill[],
  eventsCount: number = 0
): FinancialSummary {
  // Only completed, active transactions
  const activeTxns = transactions.filter((t) => t.status === 'COMPLETED');

  // Income: Only type 'INCOME'
  const totalIncome = activeTxns
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  // Expenses: Only type 'EXPENSE' (Transfers excluded!)
  const totalExpenses = activeTxns
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  // Available balance: Sum of all active accounts
  const availableBalance = accounts
    .filter((a) => a.is_active)
    .reduce((sum, a) => sum + a.current_balance, 0);

  const netCashFlow = totalIncome - totalExpenses;

  // Outstanding bills: Pending or Partially Paid or Overdue
  const activeBills = bills.filter(
    (b) => b.status === 'PENDING' || b.status === 'PARTIALLY_PAID' || b.status === 'OVERDUE'
  );

  const outstandingBillsTotal = activeBills.reduce((sum, b) => {
    const remaining = b.amount - (b.paid_amount || 0);
    return sum + (remaining > 0 ? remaining : 0);
  }, 0);

  return {
    totalIncome,
    totalExpenses,
    availableBalance,
    netCashFlow,
    outstandingBillsTotal,
    outstandingBillsCount: activeBills.length,
    activeEventsCount: eventsCount,
  };
}

/**
 * Groups transactions by month for trend visualizations (Recharts)
 */
export function calculateMonthlyTrends(transactions: Transaction[]): MonthlyTrend[] {
  const activeTxns = transactions.filter((t) => t.status === 'COMPLETED');
  const monthMap = new Map<string, { income: number; expense: number }>();

  activeTxns.forEach((t) => {
    if (t.type === 'TRANSFER') return; // Do not inflate income/expense
    const date = new Date(t.date);
    const monthKey = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { income: 0, expense: 0 });
    }

    const curr = monthMap.get(monthKey)!;
    if (t.type === 'INCOME') {
      curr.income += t.amount;
    } else if (t.type === 'EXPENSE') {
      curr.expense += t.amount;
    }
  });

  return Array.from(monthMap.entries()).map(([month, data]) => ({
    month,
    income: data.income,
    expense: data.expense,
    net: data.income - data.expense,
  }));
}

/**
 * Computes category breakdown for expenses
 */
export function calculateExpenseCategories(transactions: Transaction[]): CategoryBreakdown[] {
  const activeExpenses = transactions.filter(
    (t) => t.status === 'COMPLETED' && t.type === 'EXPENSE'
  );
  const total = activeExpenses.reduce((sum, t) => sum + t.amount, 0);
  if (total === 0) return [];

  const categoryMap = new Map<string, number>();
  activeExpenses.forEach((t) => {
    categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
  });

  return Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: Number(((amount / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.amount - a.amount);
}
