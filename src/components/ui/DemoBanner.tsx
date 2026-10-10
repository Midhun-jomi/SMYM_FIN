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
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
          <Database className="h-3 w-3" /> DEMO MODE
        </span>
        <span className="text-amber-800">
          Showing labeled sample records. Not connected to live Google Sheets yet.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-slate-600 font-medium">Test Role:</span>
        <div className="relative inline-block">
          <select
            value={currentUser.role}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className="bg-white border border-amber-300 rounded-md py-1 pl-2.5 pr-7 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs appearance-none"
          >
            <option value="PUBLIC_VIEWER">👁️ Public Viewer (Read-only)</option>
            <option value="EDITOR">✏️ Editor (Can add/edit)</option>
            <option value="ADMIN">🛡️ Admin (Full control + Void)</option>
          </select>
          <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500">
          <Shield className="h-3 w-3" /> Switch role to test permissions
        </span>
      </div>
    </div>
  );
};
