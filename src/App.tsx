import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Income } from './pages/Income';
import { Expenses } from './pages/Expenses';
import { Bills } from './pages/Bills';
import { Events } from './pages/Events';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { TransactionFormModal } from './components/forms/TransactionFormModal';
import { Account, EventItem, User } from './types';
import { api } from './services/api';

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
    <BrowserRouter>
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

      {/* Global Transaction Modal */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleTransactionCreated}
        accounts={accounts}
        events={events}
      />
    </BrowserRouter>
  );
}

export default App;
