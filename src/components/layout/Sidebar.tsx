import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Calendar,
  BarChart3,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'All Transactions', icon: Receipt },
    { to: '/income', label: 'Income Records', icon: ArrowDownLeft, badge: 'Collections' },
    { to: '/expenses', label: 'Expenses', icon: ArrowUpRight },
    { to: '/bills', label: 'Bills & Dues', icon: FileText },
    { to: '/events', label: 'Youth Events', icon: Calendar },
    { to: '/reports', label: 'Audit & Reports', icon: BarChart3 },
    { to: '/login', label: 'Access & Auth', icon: ShieldCheck },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-64 p-4 transition-colors">
      <div className="mb-6 px-3">
        <h6 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Financial Management
        </h6>
      </div>

      <nav className="space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 shadow-xs border border-emerald-200/50 dark:border-emerald-800/60'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                )
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0 text-current" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-md">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Society Quick Details Footer */}
      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 px-3">
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-2 mb-1 text-slate-800 dark:text-slate-200 font-bold text-xs">
            <Building className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>SMYM Youth Unit</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Financial Year 2026-2027<br />
            Currency: <span className="font-semibold text-slate-700 dark:text-slate-300">INR (₹)</span>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-50 h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
