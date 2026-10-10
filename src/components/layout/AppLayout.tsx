import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { DemoBanner } from '../ui/DemoBanner';
import { User, UserRole } from '../../types';
import { api } from '../../services/api';

interface AppLayoutProps {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  onOpenNewTransaction: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentUser,
  setCurrentUser,
  onOpenNewTransaction,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMock = api.isMockMode();

  const handleRoleChange = (newRole: UserRole) => {
    const updatedUser: User = {
      ...currentUser,
      role: newRole,
      display_name:
        newRole === 'PUBLIC_VIEWER'
          ? 'Parish Member (Public View)'
          : newRole === 'EDITOR'
          ? 'Youth Secretary (Editor)'
          : 'Society Treasurer (Admin)',
    };
    api.setCurrentUser(updatedUser);
    setCurrentUser(updatedUser);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <div className="no-print">
        <DemoBanner
          currentUser={currentUser}
          onRoleChange={handleRoleChange}
          isMock={isMock}
        />
      </div>

      <div className="no-print">
        <Navbar
          currentUser={currentUser}
          onOpenNewTransaction={onOpenNewTransaction}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
      </div>

      <div className="flex-1 flex max-w-7xl w-full mx-auto print:max-w-full print:m-0 print:p-0">
        <div className="no-print">
          <Sidebar
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
            currentUser={currentUser}
          />
        </div>

        <main className="flex-1 min-w-0 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 print:p-0 print:m-0 print:max-w-full print:w-full">
          <Outlet />
        </main>
      </div>

      <footer className="no-print bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © {new Date().getFullYear()} <span className="font-semibold text-slate-700 dark:text-slate-200">SMYM FIN</span> — Church Society Financial Transparency & Management.
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            All records validated with single source of truth standards.
          </p>
        </div>
      </footer>
    </div>
  );
};
