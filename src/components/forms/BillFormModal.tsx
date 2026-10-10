import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Alert } from '../ui/Alert';
import { api } from '../../services/api';
import { getTodayDateString } from '../../utils/date';

interface BillFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BILL_CATEGORIES = [
  'Sound & Lighting',
  'Stage & Decoration',
  'Catering & Refreshments',
  'Printing & Stationery',
  'Sports & Cultural',
  'Event Expenses',
  'Maintenance & Repairs',
  'Administration & Utilities',
  'Other Expenses',
];

export const BillFormModal: React.FC<BillFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [billName, setBillName] = useState('');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(getTodayDateString());
  const [category, setCategory] = useState(BILL_CATEGORIES[0]);
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setBillName('');
    setVendor('');
    setAmount('');
    setDueDate(getTodayDateString());
    setCategory(BILL_CATEGORIES[0]);
    setNotes('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!billName.trim()) {
      setError('Please provide a bill or invoice title.');
      return;
    }

    if (!vendor.trim()) {
      setError('Please enter the vendor or contractor name.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (!dueDate) {
      setError('Please select a valid payment due date.');
      return;
    }

    setIsLoading(true);
    try {
      await api.addBill({
        bill_name: billName.trim(),
        vendor: vendor.trim(),
        amount: parsedAmount,
        paid_amount: 0,
        due_date: dueDate,
        category,
        status: 'PENDING',
        notes: notes.trim() || undefined,
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to create bill. Please verify connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Add Society Bill / Liability"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}

        <Input
          id="bill_name"
          label="Bill / Invoice Title"
          type="text"
          placeholder="e.g. Sound System for Feast 2026"
          value={billName}
          onChange={(e) => setBillName(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="vendor"
            label="Vendor / Contractor"
            type="text"
            placeholder="e.g. Mary Matha Sounds"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            required
          />

          <Input
            id="amount"
            label="Total Amount (₹)"
            type="number"
            step="0.01"
            min="1"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="due_date"
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />

          <Select
            id="category"
            label="Expense Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={BILL_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </div>

        <div>
          <label
            htmlFor="notes"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
          >
            Invoice Reference / Terms (Optional)
          </label>
          <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Invoice #9821, 50% advance payable on setup"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
          />
        </div>

        <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Create Bill
          </Button>
        </div>
      </form>
    </Modal>
  );
};
