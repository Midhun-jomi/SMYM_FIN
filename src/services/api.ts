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

    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getDashboard`);
      if (!response.ok) throw new Error(`Google Sheets API responded with status ${response.status}`);
      const result = await response.json();
      
      const txns: Transaction[] = Array.isArray(result.transactions) ? result.transactions : [];
      const accs: Account[] = Array.isArray(result.accounts) ? result.accounts : [];
      const bills: Bill[] = Array.isArray(result.bills) ? result.bills : [];
      const events: EventItem[] = Array.isArray(result.events) ? result.events : [];
      const summary = calculateFinancialSummary(txns, accs, bills, events.length);

      return {
        summary,
        transactions: txns,
        accounts: accs,
        bills,
        events,
        isDemo: false,
      };
    } catch (err) {
      console.warn('Live Google Sheets endpoint error, falling back to cached demo data:', err);
      // Fallback gracefully so the app stays functional while showing notice
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
        isDemo: true,
      };
    }
  },

  async getTransactions(): Promise<Transaction[]> {
    if (this.isMockMode()) {
      return loadStored(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
    }
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getTransactions`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('Failed to fetch live transactions, using cached:', err);
      return loadStored(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
    }
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

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addTransaction', data: newTxn }),
      });
      if (response.ok) return newTxn;
      throw new Error('Direct POST returned non-ok status');
    } catch {
      // Fallback via GET query param (bulletproof across all CORS/redirect policies)
      const encoded = encodeURIComponent(JSON.stringify(newTxn));
      const res = await fetch(`${APPS_SCRIPT_URL}?action=addTransaction&payload=${encoded}`);
      if (!res.ok) throw new Error('Failed to save transaction to Google Sheets');
      return newTxn;
    }
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

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'voidTransaction', transactionId, actor: currentUser.email }),
      });
      if (response.ok) return;
      throw new Error('Direct POST failed');
    } catch {
      await fetch(
        `${APPS_SCRIPT_URL}?action=voidTransaction&transactionId=${transactionId}&actor=${encodeURIComponent(
          currentUser.email
        )}`
      );
    }
  },

  async getBills(): Promise<Bill[]> {
    if (this.isMockMode()) {
      return loadStored(STORAGE_KEYS.BILLS, MOCK_BILLS);
    }
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getBills`);
      if (!response.ok) throw new Error('Failed to fetch bills');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('Failed to fetch live bills, using cached:', err);
      return loadStored(STORAGE_KEYS.BILLS, MOCK_BILLS);
    }
  },

  async getEvents(): Promise<EventItem[]> {
    if (this.isMockMode()) {
      return loadStored(STORAGE_KEYS.EVENTS, MOCK_EVENTS);
    }
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getEvents`);
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('Failed to fetch live events, using cached:', err);
      return loadStored(STORAGE_KEYS.EVENTS, MOCK_EVENTS);
    }
  },

  async getAccounts(): Promise<Account[]> {
    if (this.isMockMode()) {
      return loadStored(STORAGE_KEYS.ACCOUNTS, MOCK_ACCOUNTS);
    }
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getAccounts`);
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('Failed to fetch live accounts, using cached:', err);
      return loadStored(STORAGE_KEYS.ACCOUNTS, MOCK_ACCOUNTS);
    }
  },

  getAvailableUsers(): User[] {
    return MOCK_USERS;
  },
};
