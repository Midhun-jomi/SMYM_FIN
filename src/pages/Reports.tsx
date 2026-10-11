import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Printer,
  History,
  FileText,
  Calendar,
  Building2,
  Coins,
  CheckCircle2,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import { User, AuditLog, Transaction, Account, EventItem, FinancialSummary } from '../types';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/date';

export type ReportPeriodType = 'ALL' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

interface ReportsPageProps {
  currentUser: User;
}

export const Reports: React.FC<ReportsPageProps> = () => {
  const [activeTab, setActiveTab] = useState<'STATEMENT' | 'GOVERNANCE' | 'AUDIT'>('STATEMENT');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Period filtering states (Monthly, Quarterly, Yearly, All-Time)
  const [periodType, setPeriodType] = useState<ReportPeriodType>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('2026-Q3');
  const [selectedYear, setSelectedYear] = useState<string>('FY-2026');

  useEffect(() => {
    const loadReportData = async () => {
      setLoading(true);
      try {
        const [dashData, logsData] = await Promise.all([
          api.getDashboardData(),
          api.getAuditLogs(),
        ]);
        setSummary(dashData.summary);
        setTransactions(dashData.transactions);
        setAccounts(dashData.accounts);
        setEvents(dashData.events);
        setAuditLogs(
          [...logsData].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
        );
      } catch (err) {
        console.error('Failed to load financial report data', err);
      } finally {
        setLoading(false);
      }
    };
    loadReportData();
  }, []);

  // Compute available months dynamically from transactions
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthSet.add(mStr);
    }
    transactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        monthSet.add(t.date.slice(0, 7));
      }
    });
    return Array.from(monthSet)
      .sort()
      .reverse()
      .map((mStr) => {
        const [y, m] = mStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, 1);
        const name = dateObj.toLocaleDateString('en-IN', {
          month: 'long',
          year: 'numeric',
        });
        const count = transactions.filter((t) => t.date?.startsWith(mStr) && t.status !== 'VOID').length;
        return { value: mStr, label: name, count };
      });
  }, [transactions]);

  const availableQuarters = useMemo(() => [
    { value: '2026-Q4', label: 'Q4 2026 (Oct – Dec 2026)' },
    { value: '2026-Q3', label: 'Q3 2026 (Jul – Sep 2026)' },
    { value: '2026-Q2', label: 'Q2 2026 (Apr – Jun 2026)' },
    { value: '2026-Q1', label: 'Q1 2026 (Jan – Mar 2026)' },
    { value: '2025-Q4', label: 'Q4 2025 (Oct – Dec 2025)' },
    { value: '2025-Q3', label: 'Q3 2025 (Jul – Sep 2025)' },
    { value: '2025-Q2', label: 'Q2 2025 (Apr – Jun 2025)' },
    { value: '2025-Q1', label: 'Q1 2025 (Jan – Mar 2025)' },
    { value: '2024-Q4', label: 'Q4 2024 (Oct – Dec 2024)' },
  ], []);

  const availableYears = useMemo(() => [
    { value: 'FY-2026', label: 'Financial Year 2026–2027 (01 Apr 2026 — 31 Mar 2027)' },
    { value: 'FY-2025', label: 'Financial Year 2025–2026 (01 Apr 2025 — 31 Mar 2026)' },
    { value: 'FY-2024', label: 'Financial Year 2024–2025 (01 Apr 2024 — 31 Mar 2025)' },
    { value: 'CY-2026', label: 'Calendar Year 2026 (01 Jan 2026 — 31 Dec 2026)' },
    { value: 'CY-2025', label: 'Calendar Year 2025 (01 Jan 2025 — 31 Dec 2025)' },
    { value: 'CY-2024', label: 'Calendar Year 2024 (01 Jan 2024 — 31 Dec 2024)' },
  ], []);

  // Compute reporting boundaries, labels, titles, and reference codes
  const currentRange = useMemo(() => {
    if (periodType === 'MONTHLY') {
      const parts = selectedMonth.split('-');
      const year = parseInt(parts[0], 10) || 2026;
      const month = parseInt(parts[1], 10) || 10;
      const startDate = `${selectedMonth}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
      const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      });
      return {
        startDate,
        endDate,
        label: `${monthName} (01 ${monthName.slice(0, 3)} ${year} — ${lastDay} ${monthName.slice(0, 3)} ${year})`,
        documentTitle: 'MONTHLY STATEMENT OF FINANCIAL ACCOUNTS',
        refCode: `SMYM/ARN/FIN/${year}-M${String(month).padStart(2, '0')}`,
        subtitle: `Monthly statement of accounts and fund movements for ${monthName}.`,
      };
    }

    if (periodType === 'QUARTERLY') {
      const parts = selectedQuarter.split('-');
      const year = parseInt(parts[0], 10) || 2026;
      const qStr = parts[1] || 'Q3';
      let startMonth = '01';
      let endMonth = '03';
      let endDay = '31';
      let qName = 'Q1 (Jan – Mar)';

      if (qStr === 'Q2') {
        startMonth = '04';
        endMonth = '06';
        endDay = '30';
        qName = 'Q2 (Apr – Jun)';
      } else if (qStr === 'Q3') {
        startMonth = '07';
        endMonth = '09';
        endDay = '30';
        qName = 'Q3 (Jul – Sep)';
      } else if (qStr === 'Q4') {
        startMonth = '10';
        endMonth = '12';
        endDay = '31';
        qName = 'Q4 (Oct – Dec)';
      }

      const startDate = `${year}-${startMonth}-01`;
      const endDate = `${year}-${endMonth}-${endDay}`;
      return {
        startDate,
        endDate,
        label: `${qName} ${year} (01/${startMonth}/${year} — ${endDay}/${endMonth}/${year})`,
        documentTitle: 'QUARTERLY STATEMENT OF FINANCIAL ACCOUNTS',
        refCode: `SMYM/ARN/FIN/${year}-${qStr}`,
        subtitle: `Quarterly certified operating performance & fund custody for ${qName} ${year}.`,
      };
    }

    if (periodType === 'YEARLY') {
      if (selectedYear.startsWith('FY-')) {
        const year = parseInt(selectedYear.replace('FY-', ''), 10) || 2026;
        const nextYear = year + 1;
        const startDate = `${year}-04-01`;
        const endDate = `${nextYear}-03-31`;
        return {
          startDate,
          endDate,
          label: `Financial Year ${year}–${nextYear} (01 Apr ${year} — 31 Mar ${nextYear})`,
          documentTitle: 'ANNUAL STATEMENT OF FINANCIAL ACCOUNTS',
          refCode: `SMYM/ARN/FIN/FY${year}-${String(nextYear).slice(-2)}`,
          subtitle: `Annual financial statement for Financial Year ${year}–${nextYear}.`,
        };
      } else {
        const year = parseInt(selectedYear.replace('CY-', ''), 10) || 2026;
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        return {
          startDate,
          endDate,
          label: `Calendar Year ${year} (01 Jan ${year} — 31 Dec ${year})`,
          documentTitle: 'ANNUAL STATEMENT OF FINANCIAL ACCOUNTS',
          refCode: `SMYM/ARN/FIN/CY${year}`,
          subtitle: `Annual financial statement for Calendar Year ${year}.`,
        };
      }
    }

    // Default: ALL TIME
    return {
      startDate: '1970-01-01',
      endDate: '2099-12-31',
      label: '01 Dec 2024 — Present (Comprehensive Financial Ledger)',
      documentTitle: 'OFFICIAL STATEMENT OF FINANCIAL ACCOUNTS',
      refCode: 'SMYM/ARN/FIN/2026-AR',
      subtitle: 'Certified financial statement from society ledger inception to present date.',
    };
  }, [periodType, selectedMonth, selectedQuarter, selectedYear]);

  // Filter transactions within chosen timeframe (sorted latest first)
  const periodTransactions = useMemo(() => {
    if (periodType === 'ALL') return transactions;
    return transactions.filter(
      (t) => t.date >= currentRange.startDate && t.date <= currentRange.endDate
    );
  }, [transactions, periodType, currentRange]);

  const periodIncome = useMemo(() => {
    return periodTransactions
      .filter((t) => t.type === 'INCOME' && t.status !== 'VOID')
      .reduce((s, t) => s + t.amount, 0);
  }, [periodTransactions]);

  const periodExpense = useMemo(() => {
    return periodTransactions
      .filter((t) => t.type === 'EXPENSE' && t.status !== 'VOID')
      .reduce((s, t) => s + t.amount, 0);
  }, [periodTransactions]);

  const periodNetSurplus = useMemo(() => periodIncome - periodExpense, [periodIncome, periodExpense]);

  const availableBalance = useMemo(() => {
    return summary?.availableBalance || accounts.reduce((s, a) => s + a.current_balance, 0);
  }, [summary, accounts]);

  // Events filtered to period
  const periodEvents = useMemo(() => {
    if (periodType === 'ALL') return events;
    return events.filter(
      (ev) => ev.event_date >= currentRange.startDate && ev.event_date <= currentRange.endDate
    );
  }, [events, periodType, currentRange]);

  const currentDateFormatted = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading official statement and audit records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Interactive Controls Header (Hidden in Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial Statements & Formal Audit
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Certified financial statements for parish council review, AGM, and diocese inspection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            <span>Print Official Statement</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs (Hidden in Print) */}
      <div className="no-print flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('STATEMENT')}
          className={`pb-3 px-1 min-h-[44px] flex items-center gap-1.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === 'STATEMENT'
              ? 'border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <FileText className="h-4 w-4" />
          Official Financial Statement
        </button>
        <button
          onClick={() => setActiveTab('GOVERNANCE')}
          className={`pb-3 px-1 min-h-[44px] flex items-center gap-1.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === 'GOVERNANCE'
              ? 'border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Governance Policies
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`pb-3 px-1 min-h-[44px] text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'AUDIT'
              ? 'border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <History className="h-4 w-4" />
          Audit Trail Log
        </button>
      </div>

      {/* TAB 1: OFFICIAL FINANCIAL STATEMENT (Clean Document for Screen Preview & Print) */}
      {(activeTab === 'STATEMENT' || typeof window !== 'undefined') && (
        <div className={activeTab === 'STATEMENT' ? 'block space-y-4' : 'hidden print:block'}>
          {/* Period Selector Controls (Screen Only, Hidden in Print) */}
          <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-2xs">
                  <Filter className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Statement Timeframe Filter
                    <Badge variant="emerald" size="sm">
                      {periodType === 'ALL' ? 'All Time' : periodType === 'MONTHLY' ? 'Monthly' : periodType === 'QUARTERLY' ? 'Quarterly' : 'Yearly'}
                    </Badge>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Switch between full historical ledger, monthly, quarterly, or annual audited statements.
                  </p>
                </div>
              </div>

              {/* Segmented Period Switcher */}
              <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setPeriodType('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap min-h-[36px] flex items-center gap-1.5 ${
                    periodType === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All Time
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodType('MONTHLY')}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap min-h-[36px] flex items-center gap-1.5 ${
                    periodType === 'MONTHLY'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Monthly Report
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodType('QUARTERLY')}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap min-h-[36px] flex items-center gap-1.5 ${
                    periodType === 'QUARTERLY'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Quarterly Report
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodType('YEARLY')}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap min-h-[36px] flex items-center gap-1.5 ${
                    periodType === 'YEARLY'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Yearly / Annual
                </button>
              </div>
            </div>

            {/* Contextual Sub-selector based on Period Type */}
            {periodType !== 'ALL' && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    Select {periodType === 'MONTHLY' ? 'Statement Month' : periodType === 'QUARTERLY' ? 'Operating Quarter' : 'Financial / Calendar Year'}:
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {periodType === 'MONTHLY' && (
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    >
                      {availableMonths.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label} ({m.count} transactions)
                        </option>
                      ))}
                    </select>
                  )}

                  {periodType === 'QUARTERLY' && (
                    <select
                      value={selectedQuarter}
                      onChange={(e) => setSelectedQuarter(e.target.value)}
                      className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    >
                      {availableQuarters.map((q) => (
                        <option key={q.value} value={q.value}>
                          {q.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {periodType === 'YEARLY' && (
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    >
                      {availableYears.map((y) => (
                        <option key={y.value} value={y.value}>
                          {y.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* Selected Period Meta Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-slate-700 dark:text-slate-300 font-bold">Active Scope:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{currentRange.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span>Transactions: <strong className="font-mono text-slate-800 dark:text-slate-200">{periodTransactions.length}</strong></span>
                <span>Events: <strong className="font-mono text-slate-800 dark:text-slate-200">{periodEvents.length}</strong></span>
                <span className="hidden sm:inline">Ref: <strong className="font-mono text-slate-700 dark:text-slate-300">{currentRange.refCode}</strong></span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xs print:p-0 print:border-none print:shadow-none text-slate-900 dark:text-slate-100 print:text-black">
            {/* Formal Parish Letterhead / Header */}
            <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-5 mb-6 text-center space-y-1">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs print:bg-emerald-800">
                  <Coins className="h-6 w-6" />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900 dark:text-white print:text-black">
                SYRO-MALABAR YOUTH MOVEMENT (SMYM)
              </h2>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 print:text-slate-800 uppercase tracking-wide">
                St. Thomas Church • Arunapuram Unit
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600">
                Diocese of Pala, Kerala • Society Registration & Financial Ledger
              </p>
              <div className="pt-3 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400 print:text-black border-t border-slate-200 dark:border-slate-800 print:border-slate-300 mt-3 font-medium">
                <span>Ref: <strong className="font-mono">{currentRange.refCode}</strong></span>
                <span>Reporting Period: <strong>{currentRange.label}</strong></span>
                <span>Date Issued: <strong>{currentDateFormatted}</strong></span>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-4 space-y-1">
              <h3 className="text-base sm:text-lg font-extrabold uppercase tracking-widest text-emerald-800 dark:text-emerald-400 print:text-black underline underline-offset-4 decoration-emerald-600">
                {currentRange.documentTitle}
              </h3>
              <p className="text-[11px] text-slate-500 print:text-slate-600 italic">
                {currentRange.subtitle}
              </p>
            </div>

            {/* SECTION 1: EXECUTIVE FINANCIAL SUMMARY / BALANCE SHEET */}
            <div className="mb-6 print-avoid-break">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black mb-2 flex items-center gap-1.5">
                <span>1. Executive Fund Position & Operating Summary</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 print:bg-slate-50 border border-slate-200 dark:border-slate-800 print:border-slate-300 rounded-lg">
                  <span className="text-[11px] text-slate-500 print:text-slate-700 block font-medium">Total Collections (Income)</span>
                  <span className="text-base font-bold font-mono text-emerald-700 print:text-black">
                    {formatINR(periodIncome)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 print:bg-slate-50 border border-slate-200 dark:border-slate-800 print:border-slate-300 rounded-lg">
                  <span className="text-[11px] text-slate-500 print:text-slate-700 block font-medium">Total Disbursements (Spent)</span>
                  <span className="text-base font-bold font-mono text-rose-700 print:text-black">
                    {formatINR(periodExpense)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 print:bg-slate-50 border border-slate-200 dark:border-slate-800 print:border-slate-300 rounded-lg">
                  <span className="text-[11px] text-slate-500 print:text-slate-700 block font-medium">Net Operating Surplus / (Loss)</span>
                  <span className={`text-base font-bold font-mono ${periodNetSurplus >= 0 ? 'text-emerald-700' : 'text-rose-700'} print:text-black`}>
                    {periodNetSurplus >= 0 ? '+' : ''}{formatINR(periodNetSurplus)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 print:bg-slate-50 border border-slate-200 dark:border-slate-800 print:border-slate-300 rounded-lg">
                  <span className="text-[11px] text-slate-500 print:text-slate-700 block font-medium">Total Liquid Assets (Closing)</span>
                  <span className="text-base font-bold font-mono text-indigo-700 print:text-black">
                    {formatINR(availableBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 2: SOCIETY OPERATING ACCOUNTS */}
            <div className="mb-6 print-avoid-break">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black mb-2 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 no-print text-emerald-600" />
                <span>2. Society Operating Accounts (Fund Custody)</span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-100 text-slate-700 print:text-black font-bold">
                      <th className="py-2 px-3 border border-slate-200 print:border-slate-300">Account Name</th>
                      <th className="py-2 px-3 border border-slate-200 print:border-slate-300">Account Type</th>
                      <th className="py-2 px-3 border border-slate-200 print:border-slate-300 text-right">Current Verified Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-300">
                    {accounts.map((acc) => (
                      <tr key={acc.account_id}>
                        <td className="py-2 px-3 border border-slate-200 print:border-slate-300 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                          {acc.account_name}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 print:border-slate-300 font-mono text-slate-600 dark:text-slate-400 print:text-black">
                          {acc.account_type === 'BANK' ? 'Bank Account' : 'Cash in Hand'}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 print:border-slate-300 text-right font-bold font-mono text-slate-900 dark:text-white print:text-black">
                          {formatINR(acc.current_balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 dark:bg-slate-800/40 print:bg-slate-50 font-bold">
                      <td colSpan={2} className="py-2 px-3 border border-slate-200 print:border-slate-300 text-right uppercase tracking-wider">
                        Total Liquid Funds Held
                      </td>
                      <td className="py-2 px-3 border border-slate-200 print:border-slate-300 text-right font-mono text-emerald-700 print:text-black text-sm">
                        {formatINR(availableBalance)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 3: YOUTH EVENTS & PROJECT BREAKDOWNS */}
            <div className="mb-6 print-avoid-break">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 no-print text-emerald-600" />
                  <span>3. Youth Events, Festivals & Project Financial Performance</span>
                </span>
                <span className="text-[11px] font-normal text-slate-500 print:text-slate-600 lowercase font-mono">
                  ({periodEvents.length} {periodEvents.length === 1 ? 'event' : 'events'})
                </span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-100 text-slate-700 print:text-black font-bold">
                      <th className="py-2 px-3 border border-slate-200 print:border-slate-300">Event / Initiative</th>
                      <th className="py-2 px-3 border border-slate-200 print:border-slate-300">Scheduled Date</th>
                      <th className="py-2 px-3 border border-slate-200 print:border-slate-300 text-right">Collections</th>
                      <th className="py-2 px-3 border border-slate-200 print:border-slate-300 text-right">Disbursements</th>
                      <th className="py-2 px-3 border border-slate-200 print:border-slate-300 text-right">Profit / Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-300">
                    {periodEvents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 px-3 text-center text-slate-400 dark:text-slate-500 italic border border-slate-200 print:border-slate-300">
                          No scheduled youth events or initiatives recorded for this period timeframe.
                        </td>
                      </tr>
                    ) : (
                      periodEvents.map((ev) => {
                        const collections = Number(ev.total_income) || 0;
                        const spent = Number(ev.total_expense) || 0;
                        const diff = collections - spent;
                        const isProfit = diff >= 0;

                        return (
                          <tr key={ev.event_id}>
                            <td className="py-2 px-3 border border-slate-200 print:border-slate-300 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                              {ev.event_name}
                            </td>
                            <td className="py-2 px-3 border border-slate-200 print:border-slate-300 text-slate-600 dark:text-slate-400 print:text-black">
                              {formatDate(ev.event_date)}
                            </td>
                            <td className="py-2 px-3 border border-slate-200 print:border-slate-300 text-right font-mono text-emerald-700 print:text-black">
                              {formatINR(collections)}
                            </td>
                            <td className="py-2 px-3 border border-slate-200 print:border-slate-300 text-right font-mono text-rose-700 print:text-black">
                              {formatINR(spent)}
                            </td>
                            <td className="py-2 px-3 border border-slate-200 print:border-slate-300 text-right font-mono font-bold">
                              <span className={isProfit ? 'text-emerald-700 print:text-black' : 'text-rose-700 print:text-black'}>
                                {isProfit ? 'Profit: +' : 'Loss: -'}
                                {formatINR(Math.abs(diff))}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 4: RECENT VERIFIED TRANSACTIONS (Statement of Account Summary) */}
            <div className="mb-6 print-avoid-break">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black mb-2 flex items-center justify-between">
                <span>
                  4. Statement of Verified Ledger Transactions {periodType === 'ALL' && periodTransactions.length > 30 && '(Excerpt — Top 30)'}
                </span>
                <span className="text-[11px] font-normal text-slate-500 print:text-slate-600 lowercase font-mono">
                  ({periodType === 'ALL' ? Math.min(periodTransactions.length, 30) : periodTransactions.length} of {periodTransactions.length} {periodTransactions.length === 1 ? 'entry' : 'entries'})
                </span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-100 text-slate-700 print:text-black font-bold">
                      <th className="py-2 px-3 border border-slate-200 print:border-slate-300">Date</th>
                      <th className="py-2 px-3 border border-slate-200 print:border-slate-300">Description / Purpose</th>
                      <th className="py-2 px-3 border border-slate-200 print:border-slate-300">Category</th>
                      <th className="py-2 px-3 border border-slate-200 print:border-slate-300">Type</th>
                      <th className="py-2 px-3 border border-slate-200 print:border-slate-300 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-300">
                    {periodTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 px-3 text-center text-slate-400 dark:text-slate-500 italic border border-slate-200 print:border-slate-300">
                          No verified transactions recorded in this period timeframe ({currentRange.label}).
                        </td>
                      </tr>
                    ) : (
                      (periodType === 'ALL' ? periodTransactions.slice(0, 30) : periodTransactions).map((t) => (
                        <tr key={t.transaction_id}>
                          <td className="py-1.5 px-3 border border-slate-200 print:border-slate-300 text-slate-600 dark:text-slate-400 print:text-black whitespace-nowrap">
                            {formatDate(t.date)}
                          </td>
                          <td className="py-1.5 px-3 border border-slate-200 print:border-slate-300 font-medium text-slate-800 dark:text-slate-200 print:text-black">
                            {t.description}
                          </td>
                          <td className="py-1.5 px-3 border border-slate-200 print:border-slate-300 text-slate-600 dark:text-slate-400 print:text-black">
                            {t.category}
                          </td>
                          <td className="py-1.5 px-3 border border-slate-200 print:border-slate-300 font-semibold font-mono text-[11px]">
                            <span className={t.type === 'INCOME' ? 'text-emerald-700 print:text-black' : 'text-rose-700 print:text-black'}>
                              {t.type}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 border border-slate-200 print:border-slate-300 text-right font-mono font-bold">
                            <span className={t.type === 'INCOME' ? 'text-emerald-700 print:text-black' : 'text-rose-700 print:text-black'}>
                              {t.type === 'INCOME' ? '+' : '-'}{formatINR(t.amount)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 5: FORMAL ATTESTATION & SIGNATURE BLOCKS */}
            <div className="mt-8 pt-6 border-t border-slate-300 print:border-slate-400 print-avoid-break">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-xs">
                <div className="space-y-6">
                  <div className="h-10 flex items-end justify-center">
                    <span className="text-slate-400 italic text-[11px] print:text-slate-500">Seal / Signature</span>
                  </div>
                  <div className="border-t border-slate-400 dark:border-slate-600 print:border-slate-800 pt-1.5">
                    <p className="font-bold text-slate-900 dark:text-white print:text-black">Rev. Fr. Director</p>
                    <p className="text-[11px] text-slate-500 print:text-slate-700">Parish Vicar / Patron</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="h-10 flex items-end justify-center">
                    <span className="text-slate-400 italic text-[11px] print:text-slate-500">Seal / Signature</span>
                  </div>
                  <div className="border-t border-slate-400 dark:border-slate-600 print:border-slate-800 pt-1.5">
                    <p className="font-bold text-slate-900 dark:text-white print:text-black">President</p>
                    <p className="text-[11px] text-slate-500 print:text-slate-700">SMYM Arunapuram</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="h-10 flex items-end justify-center">
                    <span className="text-slate-400 italic text-[11px] print:text-slate-500">Seal / Signature</span>
                  </div>
                  <div className="border-t border-slate-400 dark:border-slate-600 print:border-slate-800 pt-1.5">
                    <p className="font-bold text-slate-900 dark:text-white print:text-black">Treasurer</p>
                    <p className="text-[11px] text-slate-500 print:text-slate-700">Finance Custodian</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="h-10 flex items-end justify-center">
                    <span className="text-slate-400 italic text-[11px] print:text-slate-500">Seal / Signature</span>
                  </div>
                  <div className="border-t border-slate-400 dark:border-slate-600 print:border-slate-800 pt-1.5">
                    <p className="font-bold text-slate-900 dark:text-white print:text-black">Parish Auditor</p>
                    <p className="text-[11px] text-slate-500 print:text-slate-700">Audit & Council Examiner</p>
                  </div>
                </div>
              </div>

              {/* Legal / Audit Note */}
              <div className="mt-6 pt-4 border-t border-slate-200 print:border-slate-300 text-[10px] text-slate-500 print:text-slate-600 text-center leading-relaxed">
                This document is certified as the official financial statement of accounts for the Syro-Malabar Youth Movement (SMYM), Arunapuram Unit. All transactions are backed by physical receipts, UPI audit logs, and reconciled bank accounts. Persisted immutably in the central church society repository.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GOVERNANCE & ACCOUNTING RULES (Screen only) */}
      {activeTab === 'GOVERNANCE' && (
        <div className="space-y-6 no-print">
          <Card className="border-l-4 border-l-emerald-600 dark:border-l-emerald-500 p-4 sm:p-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
              Annual Financial Transparency Statement
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              This statement certifies that all incoming contributions and expenditures recorded in SMYM FIN are reconciled against Society operating bank statements and physical vouchers maintained by the elected executive committee.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>Financial Year: 2026–2027</span>
              <span>Prepared for: SMYM General Body & Diocese Directorate</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Verified Compliant
              </span>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">
              Accounting Governance Rules Enforced
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">1. Canonical Ledger</span>
                Google Sheets serves as the authoritative, tamper-evident source of truth with immutable record IDs.
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">2. Non-Destructive Voiding</span>
                Mistaken entries are flagged as VOID rather than deleted, guaranteeing audit completeness.
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">3. Transfer Isolation</span>
                Transfers between accounts update balances without falsely inflating income or expenses.
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">4. Access Control</span>
                Public members have uninhibited read transparency; all writes require verified Google OAuth credentials.
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL LOG (Screen only) */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-3 no-print">
          {/* Mobile Card View (Screens < 640px) */}
          <div className="block sm:hidden space-y-3">
            {auditLogs.length === 0 ? (
              <Card className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                No audit log entries recorded yet.
              </Card>
            ) : (
              auditLogs.map((log) => (
                <Card key={log.log_id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        log.action === 'CREATE'
                          ? 'emerald'
                          : log.action === 'VOID'
                            ? 'rose'
                            : 'blue'
                      }
                      size="sm"
                    >
                      {log.action}
                    </Badge>
                    <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {log.details}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="truncate max-w-[150px]">{log.actor_email}</span>
                    <span className="font-mono">{log.entity_type} #{log.entity_id}</span>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Desktop & Tablet Table (Screens >= 640px) */}
          <Card className="hidden sm:block p-0 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Immutable Modification Trail
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Automated system log
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-5">Timestamp</th>
                    <th className="py-3 px-5">Actor</th>
                    <th className="py-3 px-5">Action</th>
                    <th className="py-3 px-5">Entity</th>
                    <th className="py-3 px-5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {auditLogs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {log.actor_email}
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <Badge
                          variant={
                            log.action === 'CREATE'
                              ? 'emerald'
                              : log.action === 'VOID'
                                ? 'rose'
                                : 'blue'
                          }
                          size="sm"
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {log.entity_type} #{log.entity_id}
                      </td>
                      <td className="py-3.5 px-5 text-slate-700 dark:text-slate-300">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
