import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Alert } from '../ui/Alert';
import { Bill, Account, PaymentMethod } from '../../types';
import { api } from '../../services/api';
import { formatINR } from '../../utils/currency';
import { getTodayDateString } from '../../utils/date';

interface PayBillModalProps {
  isOpen: boolean;
  bill: Bill | null;
  accounts: Account[];
  onClose: () => void;
  onSuccess: () => void;
}

export const PayBillModal: React.FC<PayBillModalProps> = ({
  isOpen,
  bill,
  accounts,
  onClose,
  onSuccess,
}) => {
  const remainingDue = bill ? bill.amount - (bill.paid_amount || 0) : 0;

  const [paymentAmount, setPaymentAmount] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [accountId, setAccountId] = useState(accounts[0]?.account_id || 'acc_01');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bill) {
      setPaymentAmount(remainingDue > 0 ? remainingDue.toString() : '');
      setDate(getTodayDateString());
      if (accounts.length > 0 && !accounts.some((a) => a.account_id === accountId)) {
        setAccountId(accounts[0].account_id);
      }
      setError(null);
    }
  }, [bill, accounts]);

  if (!bill) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(paymentAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }

    if (parsedAmount > remainingDue + 0.01) {
      setError(`Payment cannot exceed the remaining due amount of ${formatINR(remainingDue)}.`);
      return;
    }

    setIsLoading(true);
    try {
      await api.payBill({
        bill_id: bill.bill_id,
        amount: parsedAmount,
        account_id: accountId,
        payment_method: paymentMethod,
        date,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to record bill payment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Bill Payment" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}

        {/* Bill summary card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{bill.bill_name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Vendor: {bill.vendor}</p>
            </div>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {bill.category}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Invoice Total:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{formatINR(bill.amount)}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Paid to Date:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatINR(bill.paid_amount || 0)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Remaining Due:</span>
              <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                {formatINR(remainingDue)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="payment_amount"
            label="Payment Amount (₹)"
            type="number"
            step="0.01"
            min="1"
            max={remainingDue}
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            required
          />

          <Input
            id="payment_date"
            label="Payment Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="account_id"
            label="Disbursing Account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            options={accounts.map((a) => ({
              value: a.account_id,
              label: `${a.account_name} (${formatINR(a.current_balance)})`,
            }))}
          />

          <Select
            id="payment_method"
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            options={[
              { value: 'UPI', label: 'UPI / QR Code' },
              { value: 'BANK', label: 'Bank Transfer / NEFT' },
              { value: 'CASH', label: 'Petty Cash' },
              { value: 'CHEQUE', label: 'Cheque' },
            ]}
          />
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
          * Recording this payment will automatically append an Expense transaction to the society ledger and update the disbursing account balance.
        </p>

        <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Confirm Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
