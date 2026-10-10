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
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <DemoBanner
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        isMock={isMock}
      />

      <Navbar
        currentUser={currentUser}
        onOpenNewTransaction={onOpenNewTransaction}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © {new Date().getFullYear()} <span className="font-semibold text-slate-700">SMYM FIN</span> — Church Society Financial Transparency & Management.
          </p>
          <p className="text-slate-600">
            All records validated with single source of truth standards.
          </p>
        </div>
      </footer>
    </div>
  );
};
