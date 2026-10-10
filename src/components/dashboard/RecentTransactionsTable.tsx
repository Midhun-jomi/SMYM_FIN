import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, ExternalLink } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Transaction } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';

interface RecentTransactionsTableProps {
  transactions: Transaction[];
  maxItems?: number;
}

export const RecentTransactionsTable: React.FC<RecentTransactionsTableProps> = ({
  transactions,
  maxItems = 6,
}) => {
  const displayItems = transactions.slice(0, maxItems);

  const typeConfig = {
    INCOME: {
      icon: <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-800/60',
    },
    EXPENSE: {
      icon: <ArrowUpRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
      bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-100 dark:border-rose-800/60',
    },
    TRANSFER: {
      icon: <ArrowLeftRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
      bg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-100 dark:border-indigo-800/60',
    },
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">Recent Transactions</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Latest financial movements recorded</p>
        </div>
        <Link
          to="/transactions"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center gap-1 transition-colors"
        >
          View all <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-6">Date</th>
              <th className="py-3 px-6">Description</th>
              <th className="py-3 px-6">Category</th>
              <th className="py-3 px-6">Payment</th>
              <th className="py-3 px-6 text-right">Amount</th>
              <th className="py-3 px-6 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {displayItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  No recent transactions available.
                </td>
              </tr>
            ) : (
              displayItems.map((txn) => {
                const conf = typeConfig[txn.type];
                return (
                  <tr
                    key={txn.transaction_id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(txn.date)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${conf.bg} shrink-0`}>
                          {conf.icon}
                        </div>
                        <div className="truncate max-w-xs">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                            {txn.description}
                          </p>
                          {txn.event_name && (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              🎯 {txn.event_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {txn.category}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-mono text-[11px]">
                        {txn.payment_method}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <span
                        className={`font-bold font-mono text-sm ${
                          txn.type === 'INCOME'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : txn.type === 'EXPENSE'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-indigo-600 dark:text-indigo-400'
                        } ${txn.status === 'VOID' ? 'line-through opacity-50' : ''}`}
                      >
                        {txn.type === 'INCOME' ? '+' : txn.type === 'EXPENSE' ? '-' : ''}
                        {formatINR(txn.amount)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      {txn.status === 'VOID' ? (
                        <Badge variant="rose" size="sm">VOID</Badge>
                      ) : txn.status === 'PENDING' ? (
                        <Badge variant="amber" size="sm">Pending</Badge>
                      ) : (
                        <Badge variant="emerald" size="sm">Completed</Badge>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
