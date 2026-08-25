'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Trash2, 
  Plus, 
  Download, 
  Lock,
  History
} from 'lucide-react';
import { Payslip, PayslipStatus } from '../types/payslip';
import { formatCurrency } from '../lib/calculator';

interface AllPayslipsViewProps {
  payslips: Payslip[];
  onSelectPayslip: (payslip: Payslip) => void;
  onDeletePayslip: (id: string) => void;
  onOpenWizard: () => void;
}

export const AllPayslipsView: React.FC<AllPayslipsViewProps> = ({
  payslips,
  onSelectPayslip,
  onDeletePayslip,
  onOpenWizard,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const months = Array.from(new Set(payslips.map((p) => p.salaryMonth))).filter(Boolean);

  const filtered = payslips.filter((ps) => {
    const matchesSearch = 
      ps.payslipNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ps.employeeData.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ps.verificationCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || ps.status === selectedStatus;
    const matchesMonth = selectedMonth === 'all' || ps.salaryMonth === selectedMonth;

    return matchesSearch && matchesStatus && matchesMonth;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-600" />
            <span>All Payslip Records</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, search, review, approve, lock, and print individual or period payslips.
          </p>
        </div>

        <button
          onClick={onOpenWizard}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Payslip Run</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by ID, name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs p-2.5 pl-9 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs p-2.5 rounded-lg border border-slate-300 bg-white outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
            <option value="locked">Locked</option>
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs p-2.5 rounded-lg border border-slate-300 bg-white outline-none"
          >
            <option value="all">All Months</option>
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <span className="text-xs font-semibold text-slate-500 pl-2">
            Showing {filtered.length} of {payslips.length}
          </span>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Payslip #</th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Period</th>
                <th className="py-3.5 px-4">Gross Salary</th>
                <th className="py-3.5 px-4">Deductions</th>
                <th className="py-3.5 px-4">Net Salary</th>
                <th className="py-3.5 px-4">Status & Ver Code</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((ps) => {
                const isApproved = ps.status === 'approved' || ps.status === 'published' || ps.status === 'locked';
                return (
                  <tr key={ps.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                      {ps.payslipNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{ps.employeeData.fullName}</div>
                      <div className="text-[10px] text-slate-500">{ps.employeeData.designation} ({ps.employeeData.id})</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {ps.salaryMonth} {ps.salaryYear}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {formatCurrency(ps.grossSalary)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-rose-600">
                      -{formatCurrency(ps.totalDeductions)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">
                      {formatCurrency(ps.netSalary)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {isApproved ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {ps.status}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {ps.verificationCode}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => onSelectPayslip(ps)}
                        className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition-colors"
                      >
                        View Document
                      </button>
                      <button
                        onClick={() => onDeletePayslip(ps.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No payslips found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
