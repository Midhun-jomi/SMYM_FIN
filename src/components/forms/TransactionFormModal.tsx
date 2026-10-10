import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Alert } from '../ui/Alert';
import { TransactionType, PaymentMethod, Account, EventItem } from '../../types';
import { getTodayDateString } from '../../utils/date';
import { api } from '../../services/api';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: Account[];
  events: EventItem[];
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  events,
}) => {
  const [type, setType] = useState<TransactionType>('INCOME');
  const [date, setDate] = useState(getTodayDateString());
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Donations & Sponsorships');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.account_id || 'acc_01');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [eventId, setEventId] = useState('');
  const [referenceId, setReferenceId] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const incomeCategories = [
    'Donations & Sponsorships',
    'Membership Subscriptions',
    'Sunday Tithes & Collections',
    'Fundraising Initiatives',
    'Other Income',
  ];

  const expenseCategories = [
    'Event Expenses',
    'Charity & Mission',
    'Sound & Lighting',
    'Sports & Cultural',
    'Maintenance',
    'Administration',
    'Other Expenses',
  ];

  const categories =
    type === 'INCOME'
      ? incomeCategories
      : type === 'EXPENSE'
      ? expenseCategories
      : ['Account Transfer'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a brief description.');
      return;
    }

    setIsLoading(true);
    try {
      const selectedAccount = accounts.find((a) => a.account_id === accountId);
      const selectedEvent = events.find((ev) => ev.event_id === eventId);

      await api.addTransaction({
        date,
        type,
        description: description.trim(),
        category,
        amount: parsedAmount,
        account_id: accountId,
        account_name: selectedAccount?.account_name,
        payment_method: paymentMethod,
        event_id: eventId || undefined,
        event_name: selectedEvent?.event_name || undefined,
        reference_id: referenceId.trim() || undefined,
        status: 'COMPLETED',
        created_by: api.getCurrentUser().email,
      });

      onSuccess();
      onClose();
      // Reset form
      setDescription('');
      setAmount('');
      setReferenceId('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while saving the record.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record New Transaction"
      description="Authorized financial entry. Persisted to canonical records."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert type="error" title="Submission Error">
            {error}
          </Alert>
        )}

        {/* Transaction Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Entry Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['INCOME', 'EXPENSE', 'TRANSFER'] as TransactionType[]).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => {
                  setType(t);
                  setCategory(
                    t === 'INCOME'
                      ? incomeCategories[0]
                      : t === 'EXPENSE'
                      ? expenseCategories[0]
                      : 'Account Transfer'
                  );
                }}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all text-center ${
                  type === t
                    ? t === 'INCOME'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : t === 'EXPENSE'
                      ? 'bg-rose-50 border-rose-500 text-rose-800'
                      : 'bg-indigo-50 border-indigo-500 text-indigo-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Input
            label="Amount (₹ INR)"
            type="number"
            step="0.01"
            placeholder="e.g. 5000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <Input
          label="Description / Purpose"
          placeholder="e.g. Youth fest registration receipts"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={categories.map((c) => ({ label: c, value: c }))}
          />

          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            options={[
              { label: 'UPI / GPay / PhonePe', value: 'UPI' },
              { label: 'Bank Transfer (NEFT/IMPS)', value: 'BANK' },
              { label: 'Cash in Hand', value: 'CASH' },
              { label: 'Cheque / Other', value: 'OTHER' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Operating Account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            options={accounts.map((a) => ({ label: a.account_name, value: a.account_id }))}
          />

          <Select
            label="Linked Event (Optional)"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            options={[
              { label: 'None / General Society', value: '' },
              ...events.map((ev) => ({ label: ev.event_name, value: ev.event_id })),
            ]}
          />
        </div>

        <Input
          label="Reference / Voucher No. (Optional)"
          placeholder="e.g. UPI-992100 or Voucher #42"
          value={referenceId}
          onChange={(e) => setReferenceId(e.target.value)}
        />

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Save Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};
