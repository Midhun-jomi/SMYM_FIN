import { Transaction, Account, Bill, EventItem, User, FinancialSummary } from '../types';
import {
  MOCK_TRANSACTIONS,
  MOCK_ACCOUNTS,
  MOCK_BILLS,
  MOCK_EVENTS,
  MOCK_USERS,
  IS_DEMO_DATA,
} from './mockData';
import { calculateFinancialSummary } from '../utils/finance';

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

// Local storage keys for persisting mock changes across reloads
const STORAGE_KEYS = {
  TRANSACTIONS: 'smym_fin_txns_v1',
  ACCOUNTS: 'smym_fin_accounts_v1',
  BILLS: 'smym_fin_bills_v1',
  EVENTS: 'smym_fin_events_v1',
  CURRENT_USER: 'smym_fin_current_user_v1',
};

function loadStored<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to local storage', err);
  }
}

export const api = {
  isMockMode(): boolean {
    return !APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes('your_deployment_id');
  },

  getCurrentUser(): User {
    const stored = loadStored<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (stored) return stored;
    // Default to Public Viewer as required by spec
    return {
      user_id: 'viewer_public',
      email: 'visitor@smym.org',
      display_name: 'Parish Member (Public View)',
      role: 'PUBLIC_VIEWER',
      status: 'ACTIVE',
    };
  },

  setCurrentUser(user: User): void {
    saveStored(STORAGE_KEYS.CURRENT_USER, user);
  },

  async getDashboardData(): Promise<{
    summary: FinancialSummary;
    transactions: Transaction[];
    accounts: Account[];
    bills: Bill[];
    events: EventItem[];
    isDemo: boolean;
  }> {
    if (this.isMockMode()) {
      const txns = loadStored(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
      const accs = loadStored(STORAGE_KEYS.ACCOUNTS, MOCK_ACCOUNTS);
      const bills = loadStored(STORAGE_KEYS.BILLS, MOCK_BILLS);
      const events = loadStored(STORAGE_KEYS.EVENTS, MOCK_EVENTS);
      const summary = calculateFinancialSummary(txns, accs, bills, events.length);

      return {
        summary,
        transactions: txns,
        accounts: accs,
        bills,
        events,
        isDemo: IS_DEMO_DATA,
      };
    }

    const response = await fetch(`${APPS_SCRIPT_URL}?action=getDashboard`);
    if (!response.ok) throw new Error('Failed to fetch dashboard data from Google Sheets');
    const result = await response.json();
    return { ...result, isDemo: false };
  },

  async getTransactions(): Promise<Transaction[]> {
    if (this.isMockMode()) {
      return loadStored(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
    }
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getTransactions`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  },

  async addTransaction(txn: Omit<Transaction, 'transaction_id' | 'created_at'>): Promise<Transaction> {
    const currentUser = this.getCurrentUser();
    if (currentUser.role === 'PUBLIC_VIEWER') {
      throw new Error('Permission denied: Public viewers cannot create transactions.');
    }

    const newTxn: Transaction = {
      ...txn,
      transaction_id: `txn_${Date.now()}`,
      created_at: new Date().toISOString(),
      created_by: currentUser.email,
    };

    if (this.isMockMode()) {
      const current = loadStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
      const updated = [newTxn, ...current];
      saveStored(STORAGE_KEYS.TRANSACTIONS, updated);
      return newTxn;
    }

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addTransaction', data: newTxn }),
    });
    if (!response.ok) throw new Error('Failed to save transaction to Google Sheets');
    return response.json();
  },

  async voidTransaction(transactionId: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (currentUser.role !== 'ADMIN') {
      throw new Error('Permission denied: Only Admins can void transactions.');
    }

    if (this.isMockMode()) {
      const current = loadStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
      const updated = current.map((t) =>
        t.transaction_id === transactionId ? { ...t, status: 'VOID' as const, updated_by: currentUser.email } : t
      );
      saveStored(STORAGE_KEYS.TRANSACTIONS, updated);
      return;
    }

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'voidTransaction', transactionId, actor: currentUser.email }),
    });
    if (!response.ok) throw new Error('Failed to void transaction');
  },

  async getBills(): Promise<Bill[]> {
    if (this.isMockMode()) {
      return loadStored(STORAGE_KEYS.BILLS, MOCK_BILLS);
    }
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getBills`);
    return response.json();
  },

  async getEvents(): Promise<EventItem[]> {
    if (this.isMockMode()) {
      return loadStored(STORAGE_KEYS.EVENTS, MOCK_EVENTS);
    }
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getEvents`);
    return response.json();
  },

  async getAccounts(): Promise<Account[]> {
    if (this.isMockMode()) {
      return loadStored(STORAGE_KEYS.ACCOUNTS, MOCK_ACCOUNTS);
    }
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getAccounts`);
    return response.json();
  },

  getAvailableUsers(): User[] {
    return MOCK_USERS;
  },
};
