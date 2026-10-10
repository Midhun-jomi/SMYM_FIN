import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, PlusCircle, Search, TrendingUp, HandCoins } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/dashboard/StatCard';
import { Transaction, User } from '../types';
import { api } from '../services/api';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/date';

interface IncomePageProps {
  currentUser: User;
  onOpenNewTransaction: () => void;
}

export const Income: React.FC<IncomePageProps> = ({ currentUser, onOpenNewTransaction }) => {
  const [incomes, setIncomes] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchIncome = async () => {
      try {
        const txns = await api.getTransactions();
        setIncomes(txns.filter((t) => t.type === 'INCOME' && t.status === 'COMPLETED'));
      } catch (err) {
        console.error('Failed to fetch income', err);
      }
    };
    fetchIncome();
  }, []);

  const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);

  const filtered = incomes.filter(
    (t) =>
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Society Income & Collections
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tracking contributions, member subscriptions, event collections, and donations.
          </p>
        </div>

        {currentUser.role !== 'PUBLIC_VIEWER' && (
          <Button variant="primary" size="sm" onClick={onOpenNewTransaction}>
            <PlusCircle className="h-4 w-4" />
            <span>Record Income</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Collections"
          amount={formatINR(totalIncome)}
          subtitle="Cumulative verified society income"
          accentColor="emerald"
          icon={<HandCoins className="h-6 w-6" />}
        />

        <StatCard
          title="Donations & Sponsorships"
          amount={formatINR(
            incomes
              .filter((i) => i.category.includes('Donation') || i.category.includes('Sponsorship'))
              .reduce((s, i) => s + i.amount, 0)
          )}
          subtitle="Patrons, NRI forum & well-wishers"
          accentColor="emerald"
          icon={<TrendingUp className="h-6 w-6" />}
        />

        <StatCard
          title="Subscriptions & Tithes"
          amount={formatINR(
            incomes
              .filter((i) => i.category.includes('Subscription') || i.category.includes('Tithe'))
              .reduce((s, i) => s + i.amount, 0)
          )}
          subtitle="Regular member monthly dues"
          accentColor="blue"
          icon={<ArrowDownLeft className="h-6 w-6" />}
        />
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search income by donor, event, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">Description</th>
                <th className="py-3 px-5">Source / Category</th>
                <th className="py-3 px-5">Deposit Account</th>
                <th className="py-3 px-5">Method</th>
                <th className="py-3 px-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    No income entries found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.transaction_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(item.date)}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-900">
                      {item.description}
                      {item.event_name && (
                        <span className="block text-[11px] text-emerald-600 font-medium">
                          🎯 {item.event_name}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-600 whitespace-nowrap">
                      <Badge variant="emerald" size="sm">{item.category}</Badge>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-500 whitespace-nowrap">
                      {item.account_name}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-500 whitespace-nowrap font-mono">
                      {item.payment_method}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap font-bold font-mono text-emerald-600">
                      +{formatINR(item.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
