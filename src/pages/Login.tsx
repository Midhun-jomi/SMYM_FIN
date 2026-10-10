import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  LogOut,
  Users,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import { AddUserModal } from '../components/forms/AddUserModal';

declare global {
  interface Window {
    google?: any;
  }
}

interface LoginPageProps {
  currentUser: User;
  setCurrentUser: (user: User) => void;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const Login: React.FC<LoginPageProps> = ({ currentUser, setCurrentUser }) => {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsersList(data);
    } catch (err) {
      console.warn('Failed to fetch user list:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  // Google Identity Services (GIS) One Tap / Button integration
  useEffect(() => {
    if (window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            try {
              const base64Url = response.credential.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              const profile = JSON.parse(jsonPayload);
              const resolvedRole = await api.getUserRole(profile.email);

              const authenticatedUser: User = {
                user_id: profile.sub || `usr_${Date.now()}`,
                email: profile.email,
                display_name: profile.name || profile.email,
                role: resolvedRole,
                status: 'ACTIVE',
              };

              api.setCurrentUser(authenticatedUser);
              setCurrentUser(authenticatedUser);
              setLookupMessage({
                type: 'success',
                text: `Successfully authenticated as ${authenticatedUser.display_name} with role [${resolvedRole}]`,
              });
            } catch (err) {
              setLookupMessage({
                type: 'error',
                text: 'Failed to parse Google authentication credential.',
              });
            }
          },
        });

        const btnContainer = document.getElementById('googleSignInBtnContainer');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'filled_blue',
            size: 'large',
            shape: 'pill',
            text: 'signin_with',
            width: 260,
          });
        }
      } catch (err) {
        console.warn('GIS initialization error:', err);
      }
    }
  }, [GOOGLE_CLIENT_ID]);

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

  const handleLookupAndSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEmail.trim()) return;

    setLookupLoading(true);
    setLookupMessage(null);
    try {
      const email = lookupEmail.trim().toLowerCase();
      const resolvedRole = await api.getUserRole(email);

      const matchedUser = usersList.find((u) => u.email.toLowerCase() === email);
      const displayName = matchedUser ? matchedUser.display_name : email.split('@')[0];

      const authenticatedUser: User = {
        user_id: matchedUser?.user_id || `usr_${Date.now()}`,
        email,
        display_name: displayName,
        role: resolvedRole,
        status: matchedUser?.status || 'ACTIVE',
      };

      api.setCurrentUser(authenticatedUser);
      setCurrentUser(authenticatedUser);
      setLookupMessage({
        type: 'success',
        text: `Recognized user ${email}! Authoritative role loaded: [${resolvedRole}].`,
      });
    } catch (err) {
      setLookupMessage({
        type: 'error',
        text: (err as Error).message || 'Failed to resolve user authorization.',
      });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleToggleRole = async (targetUser: User) => {
    if (targetUser.email === currentUser.email) {
      alert('Security violation: You cannot alter your own permissions.');
      return;
    }

    const newRole: UserRole = targetUser.role === 'ADMIN' ? 'EDITOR' : 'ADMIN';
    setActionLoading(targetUser.user_id);
    try {
      await api.updateUserRole(targetUser.user_id, newRole, targetUser.status);
      await fetchUsers();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (targetUser: User) => {
    if (targetUser.email === currentUser.email) {
      alert('Security violation: You cannot deactivate your own account.');
      return;
    }

    const newStatus = targetUser.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    setActionLoading(targetUser.user_id);
    try {
      await api.updateUserRole(targetUser.user_id, targetUser.role, newStatus);
      await fetchUsers();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-2 border border-emerald-100 dark:border-emerald-800/60">
          <Shield className="h-8 w-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Access Control & Authentication
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Public parishioners have transparent read-only access. Only authenticated parish committee members can record entries or alter accounts.
        </p>
      </div>

      {/* Current User Session Card */}
      <Card className="border-2 border-emerald-100 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/30 to-white dark:from-emerald-950/20 dark:to-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
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

          {currentUser.role !== 'PUBLIC_VIEWER' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSimulateLogin('PUBLIC_VIEWER')}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/60"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out to Public View</span>
            </Button>
          ) : (
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
              Public Read-Only Session
            </div>
          )}
        </div>
      </Card>

      {/* Google Authentication / Email Verification Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Identity Services */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                Google Workspace Sign-In
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Sign in with your registered parish or Google email to automatically synchronize your authorized role.
            </p>

            {GOOGLE_CLIENT_ID ? (
              <div className="py-3 flex justify-center">
                <div id="googleSignInBtnContainer" />
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
                <p className="font-semibold mb-1">Google OAuth Client ID Not Set</p>
                <p className="text-[11px] leading-relaxed">
                  Add <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded font-mono">VITE_GOOGLE_CLIENT_ID</code> to your <code className="font-mono">.env</code> to activate the live GIS One Tap prompt. In the meantime, use the Role Switcher below!
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500">
            Authorizations are authoritative and resolved directly from the church registry.
          </div>
        </Card>

        {/* Email Role Lookup / Test Session */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                Authoritative Role Lookup
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Enter any email address to test server-side role resolution against the database:
            </p>

            <form onSubmit={handleLookupAndSignIn} className="space-y-3">
              <Input
                id="lookup_email"
                type="email"
                placeholder="e.g. treasurer@smym.org"
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full"
                isLoading={lookupLoading}
              >
                <span>Verify & Switch Session</span>
              </Button>
            </form>

            {lookupMessage && (
              <div
                className={`mt-3 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  lookupMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {lookupMessage.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                )}
                <span>{lookupMessage.text}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Demo Role Switcher */}
      <Card>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
              1-Click Role Switcher
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Instantly switch your simulated identity to inspect UI permissions, guard rails, and audit trails:
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

      {/* Society User Management Panel (Admin Only) */}
      {currentUser.role === 'ADMIN' && (
        <Card className="p-0 overflow-hidden border-2 border-emerald-500/20">
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Authorized Society Users & Roles
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Admin control: Grant Editor or Admin privileges to parish committee members.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchUsers}>
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddUserModalOpen(true)}
              >
                <UserPlus className="h-4 w-4" />
                <span>Authorize Member</span>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 font-semibold text-slate-600 dark:text-slate-400">
                  <th className="py-2.5 px-4">Member Name</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {usersList.map((user) => {
                  const isCurrent = user.email.toLowerCase() === currentUser.email.toLowerCase();
                  const isLoading = actionLoading === user.user_id;

                  return (
                    <tr key={user.user_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {user.display_name}
                        {isCurrent && (
                          <span className="ml-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            (You)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {user.email}
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge
                          variant={user.role === 'ADMIN' ? 'emerald' : user.role === 'EDITOR' ? 'blue' : 'slate'}
                          size="sm"
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge variant={user.status === 'ACTIVE' ? 'emerald' : 'rose'} size="sm">
                          {user.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-right space-x-2">
                        {isCurrent ? (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                            Protected (Self)
                          </span>
                        ) : (
                          <>
                            <button
                              disabled={isLoading}
                              onClick={() => handleToggleRole(user)}
                              className="px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              Toggle to {user.role === 'ADMIN' ? 'EDITOR' : 'ADMIN'}
                            </button>
                            <button
                              disabled={isLoading}
                              onClick={() => handleToggleStatus(user)}
                              className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${
                                user.status === 'ACTIVE'
                                  ? 'border-rose-200 text-rose-700 dark:border-rose-900 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                  : 'border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              }`}
                            >
                              {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSuccess={fetchUsers}
      />
    </div>
  );
};
