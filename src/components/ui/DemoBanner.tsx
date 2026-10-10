import React from 'react';
import { Database, Shield, ChevronDown } from 'lucide-react';
import { User, UserRole } from '../../types';

interface DemoBannerProps {
  currentUser: User;
  onRoleChange: (role: UserRole) => void;
  isMock: boolean;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  currentUser,
  onRoleChange,
  isMock,
}) => {
  if (!isMock) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 dark:from-amber-950/40 dark:via-slate-900 dark:to-emerald-950/40 border-b border-amber-200/80 dark:border-amber-900/40 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-3 transition-colors">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-full">
          <Database className="h-3 w-3" /> DEMO MODE
        </span>
        <span className="text-amber-800 dark:text-amber-300/90">
          Showing labeled sample records. Not connected to live Google Sheets yet.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-slate-600 dark:text-slate-400 font-medium">Test Role:</span>
        <div className="relative inline-block">
          <select
            value={currentUser.role}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className="bg-white dark:bg-slate-800 border border-amber-300 dark:border-slate-700 rounded-md py-1 pl-2.5 pr-7 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs appearance-none"
          >
            <option value="PUBLIC_VIEWER" className="dark:bg-slate-800">👁️ Public Viewer (Read-only)</option>
            <option value="EDITOR" className="dark:bg-slate-800">✏️ Editor (Can add/edit)</option>
            <option value="ADMIN" className="dark:bg-slate-800">🛡️ Admin (Full control + Void)</option>
          </select>
          <ChevronDown className="h-3 w-3 text-slate-400 dark:text-slate-500 absolute right-2 top-2 pointer-events-none" />
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <Shield className="h-3 w-3" /> Switch role to test permissions
        </span>
      </div>
    </div>
  );
};
