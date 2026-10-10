import React, { useState } from 'react';
import { ShieldCheck, Printer, History } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MOCK_AUDIT_LOGS } from '../services/mockData';
import { User } from '../types';

interface ReportsPageProps {
  currentUser: User;
}

export const Reports: React.FC<ReportsPageProps> = () => {
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'AUDIT'>('SUMMARY');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Financial Reports & Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official records for parish council review, annual general meeting, and transparency audit.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          <span>Print Statement</span>
        </Button>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('SUMMARY')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'SUMMARY'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          General Statement
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'AUDIT'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="h-4 w-4" />
          Audit Trail Log
        </button>
      </div>

      {activeTab === 'SUMMARY' ? (
        <div className="space-y-6">
          <Card className="border-l-4 border-l-emerald-600">
            <h3 className="font-bold text-slate-900 text-base mb-2">
              Annual Financial Transparency Statement
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              This statement certifies that all incoming contributions and expenditures recorded in SMYM FIN are reconciled against Society operating bank statements and physical vouchers maintained by the elected executive committee.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>Financial Year: 2026–2027</span>
              <span>Prepared for: SMYM General Body & Diocese Directorate</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" /> Verified Compliant
              </span>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">
              Accounting Governance Rules Enforced
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="font-bold text-slate-800 block mb-1">1. Canonical Ledger</span>
                Google Sheets serves as the authoritative, tamper-evident source of truth with immutable record IDs.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="font-bold text-slate-800 block mb-1">2. Non-Destructive Voiding</span>
                Mistaken entries are flagged as VOID rather than deleted, guaranteeing audit completeness.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="font-bold text-slate-800 block mb-1">3. Transfer Isolation</span>
                Transfers between accounts update balances without falsely inflating income or expenses.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="font-bold text-slate-800 block mb-1">4. Access Control</span>
                Public members have uninhibited read transparency; all writes require verified Google OAuth credentials.
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Immutable Modification Trail
            </span>
            <span className="text-[11px] text-slate-500">
              Automated system log
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-5">Timestamp</th>
                  <th className="py-3 px-5">Actor</th>
                  <th className="py-3 px-5">Action</th>
                  <th className="py-3 px-5">Entity</th>
                  <th className="py-3 px-5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {MOCK_AUDIT_LOGS.map((log) => (
                  <tr key={log.log_id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-5 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-800 whitespace-nowrap">
                      {log.actor_email}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <Badge
                        variant={
                          log.action === 'CREATE'
                            ? 'emerald'
                            : log.action === 'VOID'
                            ? 'rose'
                            : 'blue'
                        }
                        size="sm"
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-500 whitespace-nowrap">
                      {log.entity_type} #{log.entity_id}
                    </td>
                    <td className="py-3.5 px-5 text-slate-700">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
