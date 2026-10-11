import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { TransactionFormModal } from './components/forms/TransactionFormModal';
import { Account, EventItem, User } from './types';
import { api } from './services/api';
import { RefreshCw } from 'lucide-react';

const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Transactions = lazy(() => import('./pages/Transactions').then((m) => ({ default: m.Transactions })));
const Income = lazy(() => import('./pages/Income').then((m) => ({ default: m.Income })));
const Expenses = lazy(() => import('./pages/Expenses').then((m) => ({ default: m.Expenses })));
const Bills = lazy(() => import('./pages/Bills').then((m) => ({ default: m.Bills })));
const Events = lazy(() => import('./pages/Events').then((m) => ({ default: m.Events })));
const Reports = lazy(() => import('./pages/Reports').then((m) => ({ default: m.Reports })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));

function PageSkeletonLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[45vh] gap-3">
      <RefreshCw className="h-6 w-6 text-emerald-600 animate-spin" />
      <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
        Loading View...
      </span>
    </div>
  );
}

export function App() {
  const [currentUser, setCurrentUser] = useState<User>(api.getCurrentUser());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    const fetchMetadata = async () => {
      const [accs, evts] = await Promise.all([api.getAccounts(), api.getEvents()]);
      setAccounts(accs);
      setEvents(evts);
    };
    fetchMetadata();
  }, [dataVersion]);

  const handleTransactionCreated = () => {
    setDataVersion((v) => v + 1);
  };

  return (
    <ThemeProvider>
      <BrowserRouter>
      <Suspense fallback={<PageSkeletonLoader />}>
        <Routes>
          <Route
            element={
              <AppLayout
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                onOpenNewTransaction={() => setIsModalOpen(true)}
              />
            }
          >
            <Route
              path="/"
              element={
                <Dashboard
                  key={dataVersion}
                  onOpenNewTransaction={() => setIsModalOpen(true)}
                />
              }
            />
            <Route
              path="/transactions"
              element={
                <Transactions
                  key={dataVersion}
                  currentUser={currentUser}
                  onOpenNewTransaction={() => setIsModalOpen(true)}
                />
              }
            />
            <Route
              path="/income"
              element={
                <Income
                  key={dataVersion}
                  currentUser={currentUser}
                  onOpenNewTransaction={() => setIsModalOpen(true)}
                />
              }
            />
            <Route
              path="/expenses"
              element={
                <Expenses
                  key={dataVersion}
                  currentUser={currentUser}
                  onOpenNewTransaction={() => setIsModalOpen(true)}
                />
              }
            />
            <Route path="/bills" element={<Bills currentUser={currentUser} />} />
            <Route path="/events" element={<Events currentUser={currentUser} />} />
            <Route path="/reports" element={<Reports currentUser={currentUser} />} />
            <Route
              path="/login"
              element={<Login currentUser={currentUser} setCurrentUser={setCurrentUser} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>

      {/* Global Transaction Modal */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleTransactionCreated}
        accounts={accounts}
        events={events}
      />
    </BrowserRouter>
  </ThemeProvider>
  );
}

export default App;
