import React from 'react';
import { Shield, Key, LogOut } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface LoginPageProps {
  currentUser: User;
  setCurrentUser: (user: User) => void;
}

export const Login: React.FC<LoginPageProps> = ({ currentUser, setCurrentUser }) => {
  const isMock = api.isMockMode();

  const handleSimulateLogin = (role: UserRole) => {
    const updatedUser: User = {
      user_id: `usr_${role.toLowerCase()}`,
      email:
        role === 'ADMIN'
          ? 'admin@smym.org'
          : role === 'EDITOR'
          ? 'editor@smym.org'
          : 'visitor@smym.org',
      display_name:
        role === 'ADMIN'
          ? 'Fr. Director / Treasurer (Admin)'
          : role === 'EDITOR'
          ? 'Youth Secretary (Editor)'
          : 'Parish Member (Public View)',
      role,
      status: 'ACTIVE',
    };
    api.setCurrentUser(updatedUser);
    setCurrentUser(updatedUser);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-2 border border-emerald-100 dark:border-emerald-800/60">
          <Shield className="h-8 w-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Access Control & Authentication
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Public parishioners have transparent read-only access. Only authorized executive members can create or modify financial entries.
        </p>
      </div>

      {/* Current Active Status */}
      <Card className="border-2 border-emerald-100 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/30 to-white dark:from-emerald-950/20 dark:to-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              {currentUser.display_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{currentUser.display_name}</h3>
                <Badge
                  variant={
                    currentUser.role === 'ADMIN'
                      ? 'emerald'
                      : currentUser.role === 'EDITOR'
                      ? 'blue'
                      : 'slate'
                  }
                  size="sm"
                >
                  {currentUser.role}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{currentUser.email}</p>
            </div>
          </div>

          {currentUser.role !== 'PUBLIC_VIEWER' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSimulateLogin('PUBLIC_VIEWER')}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/60"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out to Public View</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Google Sign-In / Demo Simulator */}
      {isMock ? (
        <Card>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                Demo Mode Role Switcher
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              In development mode, you can immediately switch your role below to test and inspect all UI permissions:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleSimulateLogin('PUBLIC_VIEWER')}
              className={`p-4 rounded-xl border text-left transition-all ${
                currentUser.role === 'PUBLIC_VIEWER'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/50 shadow-xs ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">1. Public Viewer</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Read-only, no write permissions or void buttons.</p>
            </button>

            <button
              onClick={() => handleSimulateLogin('EDITOR')}
              className={`p-4 rounded-xl border text-left transition-all ${
                currentUser.role === 'EDITOR'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/50 shadow-xs ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">2. Society Editor</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Can create & edit transactions, manage bills & events.</p>
            </button>

            <button
              onClick={() => handleSimulateLogin('ADMIN')}
              className={`p-4 rounded-xl border text-left transition-all ${
                currentUser.role === 'ADMIN'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/50 shadow-xs ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">3. Society Admin</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Full control, user management, and void capabilities.</p>
            </button>
          </div>
        </Card>
      ) : (
        <Card className="text-center py-8">
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">Sign in with Google Workspace</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Use your authorized parish council or SMYM committee Google account.
          </p>
          <div id="googleSignInButton" className="inline-block" />
        </Card>
      )}

      {/* Permissions Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
          <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Permission Matrix
          </h4>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 font-semibold text-slate-600 dark:text-slate-400">
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4 text-center">Public Viewer</th>
                <th className="py-2.5 px-4 text-center">Editor</th>
                <th className="py-2.5 px-4 text-center">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="py-2.5 px-4">View approved reports & charts</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4">Add new transactions</td>
                <td className="py-2.5 px-4 text-center text-slate-300 dark:text-slate-600">✗</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4">Manage bills & events</td>
                <td className="py-2.5 px-4 text-center text-slate-300 dark:text-slate-600">✗</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4">Void / Invalidate transactions</td>
                <td className="py-2.5 px-4 text-center text-slate-300 dark:text-slate-600">✗</td>
                <td className="py-2.5 px-4 text-center text-slate-300 dark:text-slate-600">✗</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4">Manage member roles</td>
                <td className="py-2.5 px-4 text-center text-slate-300 dark:text-slate-600">✗</td>
                <td className="py-2.5 px-4 text-center text-slate-300 dark:text-slate-600">✗</td>
                <td className="py-2.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
