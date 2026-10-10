import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { IncomeExpenseChart } from '../components/dashboard/IncomeExpenseChart';
import { ExpenseCategoryChart } from '../components/dashboard/ExpenseCategoryChart';
import { RecentTransactionsTable } from '../components/dashboard/RecentTransactionsTable';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Transaction, Account, Bill, EventItem, FinancialSummary } from '../types';
import { api } from '../services/api';
import { formatINR } from '../utils/currency';
import {
  calculateFinancialSummary,
  calculateMonthlyTrends,
  calculateExpenseCategories,
} from '../utils/finance';

interface DashboardProps {
  onOpenNewTransaction: () => void;
}

export const Dashboard: React.FC<DashboardProps> = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [dateFilter, setDateFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH'>('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardData();
      setTransactions(data.transactions);
      setAccounts(data.accounts);
      setBills(data.bills);
      setEvents(data.events);
      setSummary(data.summary);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter transactions based on selected date filter
  const filteredTransactions = transactions.filter((t) => {
    if (dateFilter === 'ALL') return true;
    const date = new Date(t.date);
    const now = new Date();
    if (dateFilter === 'THIS_MONTH') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    if (dateFilter === 'LAST_MONTH') {
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    }
    return true;
  });

  const activeSummary = summary
    ? calculateFinancialSummary(filteredTransactions, accounts, bills, events.length)
    : null;

  const monthlyTrends = calculateMonthlyTrends(filteredTransactions);
  const expenseCategories = calculateExpenseCategories(filteredTransactions);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading financial dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Date Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Society Financial Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time status of funds, collections, expenses, and pending liabilities.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-0.5">
          {/* Quick Filter Buttons */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 flex items-center shadow-xs shrink-0">
            <button
              onClick={() => setDateFilter('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                dateFilter === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter('THIS_MONTH')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                dateFilter === 'THIS_MONTH'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateFilter('LAST_MONTH')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                dateFilter === 'LAST_MONTH'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Last Month
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={loadData} title="Refresh data" className="shrink-0 min-h-[36px]">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 4 Core Financial KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          amount={formatINR(activeSummary?.totalIncome || 0)}
          subtitle="Tithes, donations & events"
          accentColor="emerald"
          icon={<TrendingUp className="h-6 w-6" />}
          trend={{ value: '+14.2%', isPositive: true, label: 'growth' }}
        />

        <StatCard
          title="Total Expenses"
          amount={formatINR(activeSummary?.totalExpenses || 0)}
          subtitle="Activities, charity & repairs"
          accentColor="rose"
          icon={<TrendingDown className="h-6 w-6" />}
          trend={{ value: '-5.1%', isPositive: true, label: 'under budget' }}
        />

        <StatCard
          title="Available Balance"
          amount={formatINR(activeSummary?.availableBalance || 0)}
          subtitle="Net funds across all accounts"
          accentColor="blue"
          icon={<Wallet className="h-6 w-6" />}
        />

        <StatCard
          title="Outstanding Bills"
          amount={formatINR(activeSummary?.outstandingBillsTotal || 0)}
          subtitle={`${activeSummary?.outstandingBillsCount || 0} unpaid or due invoices`}
          accentColor="amber"
          icon={<AlertCircle className="h-6 w-6" />}
        />
      </div>

      {/* Bank & Operating Accounts Breakdown */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Operating Accounts
            </h4>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            3 Active Ledgers
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {accounts.map((acc) => (
            <div
              key={acc.account_id}
              className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                  {acc.account_name}
                </span>
                <Badge variant={acc.account_type === 'BANK' ? 'blue' : 'amber'} size="sm">
                  {acc.account_type}
                </Badge>
              </div>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                {formatINR(acc.current_balance)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <IncomeExpenseChart data={monthlyTrends} />
        </div>
        <div>
          <ExpenseCategoryChart data={expenseCategories} />
        </div>
      </div>

      {/* Recent Transactions Feed */}
      <RecentTransactionsTable transactions={filteredTransactions} />
    </div>
  );
};
