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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Coins className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight leading-tight group-hover:text-emerald-700 transition-colors">
                  SMYM <span className="text-emerald-600 font-black">FIN</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">
                  Parish Finance System
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Header Right Actions */}
          <div className="flex items-center gap-3">
            {/* User Role & Identity */}
            <div className="hidden sm:flex items-center gap-2 border-r border-slate-200 pr-3">
              <span className="text-xs text-slate-500 font-medium">{currentUser.display_name}</span>
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
                <button className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
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
