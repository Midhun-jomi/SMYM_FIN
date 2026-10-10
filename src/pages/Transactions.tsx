import React, { useState, useEffect } from 'react';
import {
  Search,
  Trash2,
  Download,
  PlusCircle,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Transaction, TransactionType, User } from '../types';
import { api } from '../services/api';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/date';

interface TransactionsPageProps {
  currentUser: User;
  onOpenNewTransaction: () => void;
}

export const Transactions: React.FC<TransactionsPageProps> = ({
  currentUser,
  onOpenNewTransaction,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [selectedTxnToVoid, setSelectedTxnToVoid] = useState<Transaction | null>(null);
  const [voidLoading, setVoidLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      const data = await api.getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions', err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleVoid = async () => {
    if (!selectedTxnToVoid) return;
    setVoidLoading(true);
    try {
      await api.voidTransaction(selectedTxnToVoid.transaction_id);
      setSelectedTxnToVoid(null);
      await fetchTransactions();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setVoidLoading(false);
    }
  };

  // Filter and sort logic (latest first)
  const filtered = transactions
    .filter((t) => {
      const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
      const matchesSearch =
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.reference_id && t.reference_id.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesType && matchesSearch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const exportCSV = () => {
    const headers = ['Transaction ID', 'Date', 'Type', 'Description', 'Category', 'Amount', 'Payment Method', 'Status'];
    const rows = filtered.map((t) => [
      t.transaction_id,
      t.date,
      t.type,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      t.amount,
      t.payment_method,
      t.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smym_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Transactions Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Canonical ledger of all society receipts, expenditures, and inter-fund transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

          {currentUser.role !== 'PUBLIC_VIEWER' && (
            <Button variant="primary" size="sm" onClick={onOpenNewTransaction}>
              <PlusCircle className="h-4 w-4" />
              <span>Record Entry</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by description, category, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(['ALL', 'INCOME', 'EXPENSE', 'TRANSFER'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
                  typeFilter === t
                    ? 'bg-slate-900 dark:bg-emerald-600 border-slate-900 dark:border-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {t === 'ALL' ? 'All Types' : t}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Mobile Touch-Friendly Card View (Screens < 640px) */}
      <div className="block sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <Card className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
            No transactions match your query.
          </Card>
        ) : (
          filtered.map((txn) => (
            <Card key={txn.transaction_id} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {formatDate(txn.date)}
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={
                      txn.type === 'INCOME' ? 'emerald' : txn.type === 'EXPENSE' ? 'rose' : 'blue'
                    }
                    size="sm"
                  >
                    {txn.type}
                  </Badge>
                  {txn.status === 'VOID' && (
                    <Badge variant="rose" size="sm">VOID</Badge>
                  )}
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                  {txn.description}
                </p>
                {txn.reference_id && (
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    Ref: {txn.reference_id}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                  {txn.category}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {txn.account_name || txn.account_id}
                </span>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono text-[10px]">
                  {txn.payment_method}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span
                  className={`text-base font-extrabold font-mono ${
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

                {currentUser.role === 'ADMIN' && txn.status !== 'VOID' && (
                  <button
                    onClick={() => setSelectedTxnToVoid(txn)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                    title="Void transaction"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop & Tablet Table (Screens >= 640px) */}
      <Card className="hidden sm:block p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">Description</th>
                <th className="py-3 px-5">Category</th>
                <th className="py-3 px-5">Account</th>
                <th className="py-3 px-5">Method</th>
                <th className="py-3 px-5 text-right">Amount</th>
                <th className="py-3 px-5 text-center">Status</th>
                {currentUser.role === 'ADMIN' && <th className="py-3 px-5 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={currentUser.role === 'ADMIN' ? 8 : 7} className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                    No transactions match your query.
                  </td>
                </tr>
              ) : (
                filtered.map((txn) => (
                  <tr key={txn.transaction_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(txn.date)}
                    </td>
                    <td className="py-3.5 px-5 max-w-xs">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{txn.description}</p>
                      {txn.reference_id && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">
                          Ref: {txn.reference_id}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {txn.category}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {txn.account_name || txn.account_id}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-mono text-[11px]">
                        {txn.payment_method}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <span
                        className={`font-bold font-mono ${
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
                    <td className="py-3.5 px-5 text-center whitespace-nowrap">
                      {txn.status === 'VOID' ? (
                        <Badge variant="rose" size="sm">VOID</Badge>
                      ) : (
                        <Badge variant="emerald" size="sm">Completed</Badge>
                      )}
                    </td>
                    {currentUser.role === 'ADMIN' && (
                      <td className="py-3.5 px-5 text-center whitespace-nowrap">
                        {txn.status !== 'VOID' && (
                          <button
                            onClick={() => setSelectedTxnToVoid(txn)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                            title="Void transaction (Admin only)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Void Confirmation Modal for Admin */}
      <Modal
        isOpen={!!selectedTxnToVoid}
        onClose={() => setSelectedTxnToVoid(null)}
        title="Void Transaction Record"
        description="Are you sure you want to void this entry?"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p>
              In accordance with financial integrity rules, voiding marks the record inactive and removes its amount from balances, but keeps the record in the audit trail.
            </p>
          </div>

          {selectedTxnToVoid && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1 text-slate-800 dark:text-slate-200">
              <p><strong>Description:</strong> {selectedTxnToVoid.description}</p>
              <p><strong>Amount:</strong> {formatINR(selectedTxnToVoid.amount)}</p>
              <p><strong>Date:</strong> {formatDate(selectedTxnToVoid.date)}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setSelectedTxnToVoid(null)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={voidLoading} onClick={handleVoid}>
              Confirm Void
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
