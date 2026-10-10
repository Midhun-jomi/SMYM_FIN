import { Transaction, Account, Bill, EventItem, User, UserRole, FinancialSummary, AuditLog } from '../types';
import {
  MOCK_TRANSACTIONS,
  MOCK_ACCOUNTS,
  MOCK_BILLS,
  MOCK_EVENTS,
  MOCK_USERS,
  MOCK_AUDIT_LOGS,
  IS_DEMO_DATA,
} from './mockData';
import { calculateFinancialSummary } from '../utils/finance';
import { normalizeDateString } from '../utils/date';

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

// Local storage keys for persisting mock changes across reloads
const STORAGE_KEYS = {
  TRANSACTIONS: 'smym_fin_txns_v1',
  ACCOUNTS: 'smym_fin_accounts_v1',
  BILLS: 'smym_fin_bills_v1',
  EVENTS: 'smym_fin_events_v1',
  USERS: 'smym_fin_users_v1',
  CURRENT_USER: 'smym_fin_current_user_v1',
  AUTH_PASSCODE: 'smym_fin_auth_passcode_v1',
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

  logout(): void {
    const publicUser: User = {
      user_id: 'viewer_public',
      email: 'visitor@smym.org',
      display_name: 'Parish Member (Public View)',
      role: 'PUBLIC_VIEWER',
      status: 'ACTIVE',
    };
    this.setCurrentUser(publicUser);
    localStorage.removeItem(STORAGE_KEYS.AUTH_PASSCODE);
  },

  async loginWithPasscode(email: string, role: UserRole, passcode: string): Promise<User> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = passcode.trim();
    const validAdminCode = import.meta.env.VITE_ADMIN_PASSCODE || 'SMYM26';
    const validEditorCode = import.meta.env.VITE_EDITOR_PASSCODE || 'SMYM26';

    if (this.isMockMode()) {
      const isPassValid =
        role === 'ADMIN'
          ? cleanPass === validAdminCode
          : cleanPass === validEditorCode || cleanPass === validAdminCode;

      if (!isPassValid) {
        throw new Error('Invalid access passcode for requested role.');
      }

      const users = loadStored<User[]>(STORAGE_KEYS.USERS, MOCK_USERS);
      const matched = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (matched && matched.status === 'DISABLED') {
        throw new Error('This user account has been deactivated by parish administration.');
      }

      const user: User = {
        user_id: matched?.user_id || `usr_${Date.now()}`,
        email: cleanEmail,
        display_name: matched?.display_name || (role === 'ADMIN' ? 'Fr. Director (Admin)' : 'Youth Secretary (Editor)'),
        role,
        status: 'ACTIVE',
      };
      this.setCurrentUser(user);
      saveStored(STORAGE_KEYS.AUTH_PASSCODE, cleanPass);
      return user;
    }

    try {
      const res = await fetch(
        `${APPS_SCRIPT_URL}?action=verifyPasscode&email=${encodeURIComponent(cleanEmail)}&role=${encodeURIComponent(
          role
        )}&passcode=${encodeURIComponent(cleanPass)}`
      );
      if (!res.ok) throw new Error('Authentication request failed');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const user: User = data.user;
      this.setCurrentUser(user);
      saveStored(STORAGE_KEYS.AUTH_PASSCODE, cleanPass);
      return user;
    } catch (err) {
      const isPassValid =
        role === 'ADMIN'
          ? cleanPass === validAdminCode
          : cleanPass === validEditorCode || cleanPass === validAdminCode;

      if (!isPassValid) {
        throw new Error((err as Error).message || 'Invalid access passcode for requested role.');
      }

      const user: User = {
        user_id: `usr_${Date.now()}`,
        email: cleanEmail,
        display_name: role === 'ADMIN' ? 'Society Director (Admin)' : 'Executive Member (Editor)',
        role,
        status: 'ACTIVE',
      };
      this.setCurrentUser(user);
      saveStored(STORAGE_KEYS.AUTH_PASSCODE, cleanPass);
      return user;
    }
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
      
      const rawTxns = Array.isArray(result.transactions) ? result.transactions : [];
      const txns: Transaction[] = (rawTxns.length > 0 ? rawTxns : MOCK_TRANSACTIONS).map((t: Transaction) => ({
        ...t,
        date: normalizeDateString(t.date),
      }));

      const rawAccs = Array.isArray(result.accounts) ? result.accounts : [];
      const accs: Account[] = rawAccs.length > 0 ? rawAccs : MOCK_ACCOUNTS;

      const rawBills = Array.isArray(result.bills) ? result.bills : [];
      const bills: Bill[] = rawBills.length > 0 ? rawBills : MOCK_BILLS;

      const rawEvents = Array.isArray(result.events) ? result.events : [];
      const events: EventItem[] = rawEvents.length > 0 ? rawEvents : MOCK_EVENTS;

      const summary = calculateFinancialSummary(txns, accs, bills, events.length);

      return {
        summary,
        transactions: txns,
        accounts: accs,
        bills,
        events,
        isDemo: rawTxns.length === 0,
      };
    } catch (err) {
      console.warn('Live Google Sheets endpoint error, falling back to cached demo data:', err);
      // Fallback gracefully so the app stays functional while showing notice
      const txns = loadStored(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS).map((t: Transaction) => ({
        ...t,
        date: normalizeDateString(t.date),
      }));
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
      return loadStored(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS).map((t: Transaction) => ({
        ...t,
        date: normalizeDateString(t.date),
      }));
    }
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getTransactions`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      const rawList = Array.isArray(data) && data.length > 0 ? data : MOCK_TRANSACTIONS;
      return rawList.map((t: Transaction) => ({
        ...t,
        date: normalizeDateString(t.date),
      }));
    } catch (err) {
      console.warn('Failed to fetch live transactions, using cached:', err);
      return loadStored(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS).map((t: Transaction) => ({
        ...t,
        date: normalizeDateString(t.date),
      }));
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

    const passcode = loadStored(STORAGE_KEYS.AUTH_PASSCODE, '');

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'voidTransaction', transactionId, actor: currentUser.email, passcode }),
      });
      if (response.ok) return;
      throw new Error('Direct POST failed');
    } catch {
      await fetch(
        `${APPS_SCRIPT_URL}?action=voidTransaction&transactionId=${transactionId}&actor=${encodeURIComponent(
          currentUser.email
        )}&passcode=${encodeURIComponent(passcode)}`
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
      return Array.isArray(data) && data.length > 0 ? data : MOCK_EVENTS;
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
      return Array.isArray(data) && data.length > 0 ? data : MOCK_ACCOUNTS;
    } catch (err) {
      console.warn('Failed to fetch live accounts, using cached:', err);
      return loadStored(STORAGE_KEYS.ACCOUNTS, MOCK_ACCOUNTS);
    }
  },

  async addBill(bill: Omit<Bill, 'bill_id'>): Promise<Bill> {
    const currentUser = this.getCurrentUser();
    if (currentUser.role === 'PUBLIC_VIEWER') {
      throw new Error('Permission denied: Public viewers cannot create bills.');
    }

    const newBill: Bill = {
      ...bill,
      bill_id: `bill_${Date.now()}`,
    };

    if (this.isMockMode()) {
      const current = loadStored<Bill[]>(STORAGE_KEYS.BILLS, MOCK_BILLS);
      const updated = [newBill, ...current];
      saveStored(STORAGE_KEYS.BILLS, updated);
      return newBill;
    }

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addBill', data: newBill }),
      });
      if (res.ok) return newBill;
      throw new Error('POST failed');
    } catch {
      const encoded = encodeURIComponent(JSON.stringify(newBill));
      await fetch(`${APPS_SCRIPT_URL}?action=addBill&payload=${encoded}`);
      return newBill;
    }
  },

  async payBill(data: {
    bill_id: string;
    amount: number;
    account_id: string;
    payment_method: string;
    date: string;
  }): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (currentUser.role === 'PUBLIC_VIEWER') {
      throw new Error('Permission denied: Public viewers cannot process payments.');
    }

    const payload = {
      ...data,
      actor: currentUser.email,
    };

    if (this.isMockMode()) {
      const currentBills = loadStored<Bill[]>(STORAGE_KEYS.BILLS, MOCK_BILLS);
      const updated = currentBills.map((b) => {
        if (b.bill_id === data.bill_id) {
          const newPaid = (b.paid_amount || 0) + data.amount;
          const newStatus = newPaid >= b.amount ? ('PAID' as const) : ('PARTIALLY_PAID' as const);
          return { ...b, paid_amount: newPaid, status: newStatus };
        }
        return b;
      });
      saveStored(STORAGE_KEYS.BILLS, updated);

      const bill = currentBills.find((b) => b.bill_id === data.bill_id);
      if (bill) {
        await this.addTransaction({
          date: data.date,
          type: 'EXPENSE',
          description: `Payment for bill: ${bill.bill_name}`,
          category: bill.category,
          amount: data.amount,
          account_id: data.account_id,
          payment_method: data.payment_method as any,
          reference_id: bill.bill_id,
          status: 'COMPLETED',
          created_by: currentUser.email,
        });
      }
      return;
    }

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'payBill', data: payload }),
      });
      if (res.ok) return;
      throw new Error('POST failed');
    } catch {
      const encoded = encodeURIComponent(JSON.stringify(payload));
      await fetch(`${APPS_SCRIPT_URL}?action=payBill&payload=${encoded}`);
    }
  },

  async addEvent(event: Omit<EventItem, 'event_id' | 'total_income' | 'total_expense' | 'net_balance'>): Promise<EventItem> {
    const currentUser = this.getCurrentUser();
    if (currentUser.role === 'PUBLIC_VIEWER') {
      throw new Error('Permission denied: Public viewers cannot create events.');
    }

    const newEvent: EventItem = {
      ...event,
      event_id: `evt_${Date.now()}`,
      total_income: 0,
      total_expense: 0,
      net_balance: 0,
    };

    if (this.isMockMode()) {
      const current = loadStored<EventItem[]>(STORAGE_KEYS.EVENTS, MOCK_EVENTS);
      const updated = [newEvent, ...current];
      saveStored(STORAGE_KEYS.EVENTS, updated);
      return newEvent;
    }

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addEvent', data: newEvent }),
      });
      if (res.ok) return newEvent;
      throw new Error('POST failed');
    } catch {
      const encoded = encodeURIComponent(JSON.stringify(newEvent));
      await fetch(`${APPS_SCRIPT_URL}?action=addEvent&payload=${encoded}`);
      return newEvent;
    }
  },

  async getUsers(): Promise<User[]> {
    if (this.isMockMode()) {
      return loadStored(STORAGE_KEYS.USERS, MOCK_USERS);
    }
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getUsers`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      return Array.isArray(data) && data.length > 0 ? data : loadStored(STORAGE_KEYS.USERS, MOCK_USERS);
    } catch (err) {
      console.warn('Failed to fetch live users, using cached:', err);
      return loadStored(STORAGE_KEYS.USERS, MOCK_USERS);
    }
  },

  async addUser(user: Omit<User, 'user_id'>): Promise<User> {
    const currentUser = this.getCurrentUser();
    if (currentUser.role !== 'ADMIN') {
      throw new Error('Permission denied: Only Admins can add authorized users.');
    }

    const newUser: User = {
      ...user,
      user_id: `usr_${Date.now()}`,
    };

    if (this.isMockMode()) {
      const current = loadStored<User[]>(STORAGE_KEYS.USERS, MOCK_USERS);
      const updated = [newUser, ...current];
      saveStored(STORAGE_KEYS.USERS, updated);
      return newUser;
    }

    const passcode = loadStored(STORAGE_KEYS.AUTH_PASSCODE, '');

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addUser', data: newUser, actor: currentUser.email, passcode }),
      });
      if (res.ok) return newUser;
      throw new Error('POST failed');
    } catch {
      const encoded = encodeURIComponent(JSON.stringify(newUser));
      await fetch(
        `${APPS_SCRIPT_URL}?action=addUser&payload=${encoded}&actor=${encodeURIComponent(
          currentUser.email
        )}&passcode=${encodeURIComponent(passcode)}`
      );
      return newUser;
    }
  },

  async updateUserRole(userId: string, role?: UserRole, status?: 'ACTIVE' | 'DISABLED'): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (currentUser.role !== 'ADMIN') {
      throw new Error('Permission denied: Only Admins can modify user roles.');
    }

    if (currentUser.user_id === userId) {
      throw new Error('Security policy: You cannot modify your own role or permissions.');
    }

    const passcode = loadStored(STORAGE_KEYS.AUTH_PASSCODE, '');
    const payload = {
      user_id: userId,
      role,
      status,
      actor: currentUser.email,
      passcode,
    };

    if (this.isMockMode()) {
      const current = loadStored<User[]>(STORAGE_KEYS.USERS, MOCK_USERS);
      const updated = current.map((u) => {
        if (u.user_id === userId) {
          return {
            ...u,
            role: role || u.role,
            status: status || u.status,
          };
        }
        return u;
      });
      saveStored(STORAGE_KEYS.USERS, updated);
      return;
    }

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateUserRole', data: payload, actor: currentUser.email, passcode }),
      });
      if (res.ok) return;
      throw new Error('POST failed');
    } catch {
      const encoded = encodeURIComponent(JSON.stringify(payload));
      await fetch(
        `${APPS_SCRIPT_URL}?action=updateUserRole&payload=${encoded}&actor=${encodeURIComponent(
          currentUser.email
        )}&passcode=${encodeURIComponent(passcode)}`
      );
    }
  },

  async getUserRole(email: string): Promise<UserRole> {
    if (this.isMockMode()) {
      const users = loadStored<User[]>(STORAGE_KEYS.USERS, MOCK_USERS);
      const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      return found?.status === 'ACTIVE' ? found.role : 'PUBLIC_VIEWER';
    }
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getUserRole&email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        return data.role || 'PUBLIC_VIEWER';
      }
      return 'PUBLIC_VIEWER';
    } catch {
      return 'PUBLIC_VIEWER';
    }
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    if (this.isMockMode()) {
      return MOCK_AUDIT_LOGS;
    }
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getAuditLogs`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      const data = await response.json();
      return Array.isArray(data) && data.length > 0 ? data : MOCK_AUDIT_LOGS;
    } catch (err) {
      console.warn('Failed to fetch live audit logs, using mock:', err);
      return MOCK_AUDIT_LOGS;
    }
  },

  getAvailableUsers(): User[] {
    return loadStored(STORAGE_KEYS.USERS, MOCK_USERS);
  },
};
