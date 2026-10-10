import { describe, it, expect } from 'vitest';
import { calculateFinancialSummary } from '../finance';
import { formatINR } from '../currency';
import { isPastDate, formatDate } from '../date';
import { Transaction, Account, Bill } from '../../types';

describe('Financial Integrity Calculations', () => {
  const dummyAccounts: Account[] = [
    {
      account_id: 'acc_01',
      account_name: 'Federal Bank Operating',
      account_type: 'BANK',
      opening_balance: 100000,
      current_balance: 120000,
      is_active: true,
    },
    {
      account_id: 'acc_02',
      account_name: 'Cash in Hand',
      account_type: 'CASH',
      opening_balance: 10000,
      current_balance: 15000,
      is_active: true,
    },
  ];

  it('calculates total income, expenses, and net cash flow accurately', () => {
    const transactions: Transaction[] = [
      {
        transaction_id: 't1',
        date: '2026-10-01',
        type: 'INCOME',
        description: 'Sunday Collection',
        category: 'Collections',
        amount: 25000,
        account_id: 'acc_01',
        payment_method: 'UPI',
        status: 'COMPLETED',
        created_by: 'treasurer@smym.org',
        created_at: '2026-10-01T10:00:00Z',
      },
      {
        transaction_id: 't2',
        date: '2026-10-02',
        type: 'EXPENSE',
        description: 'Sound System Rent',
        category: 'Sound & Lighting',
        amount: 8000,
        account_id: 'acc_01',
        payment_method: 'BANK',
        status: 'COMPLETED',
        created_by: 'treasurer@smym.org',
        created_at: '2026-10-02T10:00:00Z',
      },
    ];

    const bills: Bill[] = [];
    const summary = calculateFinancialSummary(transactions, dummyAccounts, bills, 1);

    expect(summary.totalIncome).toBe(25000);
    expect(summary.totalExpenses).toBe(8000);
    expect(summary.netCashFlow).toBe(17000);
    expect(summary.availableBalance).toBe(135000); // 120000 + 15000
  });

  it('RULE: Transfers must NEVER inflate total income or total expenses', () => {
    const transactions: Transaction[] = [
      {
        transaction_id: 't1',
        date: '2026-10-01',
        type: 'INCOME',
        description: 'Registration fees',
        category: 'Event Income',
        amount: 10000,
        account_id: 'acc_01',
        payment_method: 'UPI',
        status: 'COMPLETED',
        created_by: 'treasurer@smym.org',
        created_at: '2026-10-01T10:00:00Z',
      },
      {
        transaction_id: 't_transfer',
        date: '2026-10-03',
        type: 'TRANSFER',
        description: 'Withdrawal to petty cash',
        category: 'Account Transfer',
        amount: 5000,
        account_id: 'acc_01',
        payment_method: 'CASH',
        status: 'COMPLETED',
        created_by: 'treasurer@smym.org',
        created_at: '2026-10-03T10:00:00Z',
      },
    ];

    const summary = calculateFinancialSummary(transactions, dummyAccounts, [], 0);

    // Total income should remain 10000, NOT 15000
    expect(summary.totalIncome).toBe(10000);
    // Total expense should remain 0, NOT 5000
    expect(summary.totalExpenses).toBe(0);
    expect(summary.netCashFlow).toBe(10000);
  });

  it('RULE: Voided transactions are strictly excluded from all totals', () => {
    const transactions: Transaction[] = [
      {
        transaction_id: 't1',
        date: '2026-10-01',
        type: 'INCOME',
        description: 'Valid donation',
        category: 'Donations',
        amount: 5000,
        account_id: 'acc_01',
        payment_method: 'UPI',
        status: 'COMPLETED',
        created_by: 'treasurer@smym.org',
        created_at: '2026-10-01T10:00:00Z',
      },
      {
        transaction_id: 't2_voided',
        date: '2026-10-02',
        type: 'INCOME',
        description: 'Mistaken duplicate entry',
        category: 'Donations',
        amount: 50000,
        account_id: 'acc_01',
        payment_method: 'UPI',
        status: 'VOID', // VOIDED
        created_by: 'treasurer@smym.org',
        created_at: '2026-10-02T10:00:00Z',
      },
    ];

    const summary = calculateFinancialSummary(transactions, dummyAccounts, [], 0);

    // Should only count the non-voided transaction
    expect(summary.totalIncome).toBe(5000);
  });

  it('calculates net outstanding bill balances correctly', () => {
    const bills: Bill[] = [
      {
        bill_id: 'b1',
        bill_name: 'Stage lighting',
        vendor: 'Light Corp',
        amount: 20000,
        paid_amount: 5000,
        due_date: '2026-11-01',
        category: 'Sound & Lighting',
        status: 'PARTIALLY_PAID',
      },
      {
        bill_id: 'b2',
        bill_name: 'Catering deposit',
        vendor: 'Caterer X',
        amount: 15000,
        paid_amount: 15000,
        due_date: '2026-10-01',
        category: 'Catering',
        status: 'PAID', // Fully paid, should not count towards outstanding
      },
      {
        bill_id: 'b3',
        bill_name: 'Trophies',
        vendor: 'Awards Ltd',
        amount: 8000,
        paid_amount: 0,
        due_date: '2026-10-15',
        category: 'Sports & Cultural',
        status: 'PENDING',
      },
    ];

    const summary = calculateFinancialSummary([], dummyAccounts, bills, 0);

    // Remaining: (20000 - 5000) + 8000 = 23000
    expect(summary.outstandingBillsTotal).toBe(23000);
    expect(summary.outstandingBillsCount).toBe(2);
  });
});

describe('Currency & Date Formatting', () => {
  it('formats amounts correctly in Indian Rupees (INR)', () => {
    const formatted = formatINR(150000);
    expect(formatted).toContain('1,50,000');
    expect(formatted).toContain('₹');
  });

  it('detects past dates correctly for overdue checks', () => {
    expect(isPastDate('2020-01-01')).toBe(true);
    expect(isPastDate('2099-01-01')).toBe(false);
  });

  it('formats dates consistently', () => {
    const res = formatDate('2026-10-10');
    expect(res).toBeDefined();
    expect(typeof res).toBe('string');
  });

  it('normalizes Google Sheets UTC midnight timestamps into correct IST ledger dates', () => {
    // 2024-11-30 18:30:00 UTC is 2024-12-01 00:00:00 IST
    const date = formatDate('2024-11-30T18:30:00.000Z');
    expect(date).toContain('1 Dec 2024');
  });
});
