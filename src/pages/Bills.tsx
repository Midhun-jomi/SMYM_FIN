import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle, Calendar, AlertTriangle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/dashboard/StatCard';
import { Bill, BillStatus, User } from '../types';
import { api } from '../services/api';
import { formatINR } from '../utils/currency';
import { formatDate, isPastDate } from '../utils/date';

interface BillsPageProps {
  currentUser: User;
}

export const Bills: React.FC<BillsPageProps> = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | BillStatus>('ALL');

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const data = await api.getBills();
        setBills(data);
      } catch (err) {
        console.error('Failed to fetch bills', err);
      }
    };
    fetchBills();
  }, []);

  const totalOutstanding = bills
    .filter((b) => b.status === 'PENDING' || b.status === 'PARTIALLY_PAID' || b.status === 'OVERDUE')
    .reduce((sum, b) => sum + (b.amount - (b.paid_amount || 0)), 0);

  const overdueCount = bills.filter(
    (b) => (b.status === 'PENDING' || b.status === 'PARTIALLY_PAID') && isPastDate(b.due_date)
  ).length;

  const filtered = bills.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter;
  });

  const getStatusBadge = (bill: Bill) => {
    const isOverdue =
      (bill.status === 'PENDING' || bill.status === 'PARTIALLY_PAID' || bill.status === 'OVERDUE') &&
      isPastDate(bill.due_date);

    if (isOverdue) {
      return <Badge variant="rose" size="sm">Overdue</Badge>;
    }
    switch (bill.status) {
      case 'PAID':
        return <Badge variant="emerald" size="sm">Paid</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="amber" size="sm">Partially Paid</Badge>;
      case 'PENDING':
        return <Badge variant="blue" size="sm">Pending</Badge>;
      case 'CANCELLED':
        return <Badge variant="slate" size="sm">Cancelled</Badge>;
      default:
        return <Badge variant="slate" size="sm">{bill.status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Society Bills & Liabilities
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Vendor invoices, stage contracts, sound equipment rent, and payment schedules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Outstanding"
          amount={formatINR(totalOutstanding)}
          subtitle="Net unpaid vendor obligations"
          accentColor="amber"
          icon={<AlertCircle className="h-6 w-6" />}
        />

        <StatCard
          title="Overdue Invoices"
          amount={overdueCount.toString()}
          subtitle="Due date has elapsed"
          accentColor={overdueCount > 0 ? 'rose' : 'emerald'}
          icon={<AlertTriangle className="h-6 w-6" />}
        />

        <StatCard
          title="Total Tracked Bills"
          amount={bills.length.toString()}
          subtitle="All active and settled contracts"
          accentColor="blue"
          icon={<FileText className="h-6 w-6" />}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['ALL', 'PENDING', 'PARTIALLY_PAID', 'OVERDUE', 'PAID'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
              statusFilter === s
                ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((bill) => {
          const remaining = bill.amount - (bill.paid_amount || 0);
          const percentPaid = Math.round(((bill.paid_amount || 0) / bill.amount) * 100);

          return (
            <Card key={bill.bill_id} hoverable className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{bill.bill_name}</h4>
                    <p className="text-xs text-slate-500 font-medium">Vendor: {bill.vendor}</p>
                  </div>
                  {getStatusBadge(bill)}
                </div>

                <div className="my-4 p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Total Invoice Amount:</span>
                    <span className="font-bold text-slate-900">{formatINR(bill.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Paid to Date:</span>
                    <span className="font-bold text-emerald-600">{formatINR(bill.paid_amount || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                    <span className="text-slate-700 font-semibold">Remaining Due:</span>
                    <span className="font-bold font-mono text-amber-700">{formatINR(remaining)}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${percentPaid}%` }}
                    />
                  </div>
                </div>

                {bill.notes && (
                  <p className="text-xs text-slate-600 italic bg-amber-50/50 p-2 rounded border border-amber-100">
                    "{bill.notes}"
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Due: {formatDate(bill.due_date)}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">{bill.category}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
