'use client';

import React from 'react';
import { History, ShieldCheck, User, Clock, FileText, ArrowRight, Activity } from 'lucide-react';
import { AuditLog } from '../types/payslip';

interface AuditLogViewProps {
  logs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <History className="w-6 h-6 text-indigo-600" />
          <span>Audit Log & Payroll Integrity History</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable records of every payslip creation, version increment, salary adjustment, and approval action.
        </p>
      </div>

      {/* Audit Trail List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>Recent System Activity</span>
          </span>
          <span className="text-xs text-slate-500 font-semibold">{logs.length} Logged Entries</span>
        </div>

        <div className="divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-slate-50/80 transition-colors text-xs space-y-2">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-600">{log.payslipNumber}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                    v{log.version}
                  </span>
                  <span className="font-semibold text-slate-900">{log.action}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-slate-600">
                <div className="flex items-center gap-1 text-[11px]">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Performed by: <strong>{log.performedBy}</strong> ({log.userRole.replace('_', ' ')})</span>
                </div>
              </div>

              {(log.previousValue || log.newValue) && (
                <div className="p-2.5 rounded-lg bg-slate-100 font-mono text-[11px] text-slate-700 flex items-center gap-2">
                  <span className="line-through text-slate-400">{log.previousValue || 'N/A'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-emerald-700">{log.newValue}</span>
                </div>
              )}

              {log.reason && (
                <div className="text-[11px] text-slate-500 italic">
                  Reason: &quot;{log.reason}&quot;
                </div>
              )}

            </div>
          ))}

          {logs.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              No audit log entries recorded yet. Status updates and edits will be logged automatically.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
