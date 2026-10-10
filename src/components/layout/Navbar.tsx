import React from 'react';
import { Link } from 'react-router-dom';
import {
  Coins,
  PlusCircle,
  Menu,
  X,
  Shield,
  LogIn,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ThemeToggle } from '../ui/ThemeToggle';
import { User } from '../../types';

interface NavbarProps {
  currentUser: User;
  onOpenNewTransaction: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenNewTransaction,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const roleBadges = {
    PUBLIC_VIEWER: <Badge variant="slate" size="sm">Viewer (Public)</Badge>,
    EDITOR: <Badge variant="blue" size="sm">Editor</Badge>,
    ADMIN: <Badge variant="emerald" size="sm">Admin</Badge>,
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Coins className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  SMYM <span className="text-emerald-600 dark:text-emerald-400 font-black">FIN</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                  Parish Finance System
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Header Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* User Role & Identity */}
            <div className="hidden sm:flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{currentUser.display_name}</span>
              {roleBadges[currentUser.role]}
            </div>

            {/* Quick Action Button for Authorized Users */}
            {currentUser.role !== 'PUBLIC_VIEWER' ? (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenNewTransaction}
                className="shadow-emerald-600/20 shadow-sm"
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Add Record</span>
              </Button>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In (Editor)</span>
                </Button>
              </Link>
            )}

            {currentUser.role !== 'PUBLIC_VIEWER' && (
              <Link to="/login" title="Account / Switch Role">
                <button className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <Shield className="h-4 w-4" />
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
