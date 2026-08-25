'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Calendar, 
  DollarSign, 
  Lock,
  FileText
} from 'lucide-react';
import { Payslip } from '../types/payslip';
import { formatCurrency } from '../lib/calculator';

interface VerificationViewProps {
  payslips: Payslip[];
  initialCode?: string;
  onSelectPayslip?: (payslip: Payslip) => void;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  payslips,
  initialCode = '',
  onSelectPayslip,
}) => {
  const [searchCode, setSearchCode] = useState(initialCode);
  const [searchedPayslip, setSearchedPayslip] = useState<Payslip | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialCode) {
      handleSearch(initialCode);
    }
  }, [initialCode]);

  const handleSearch = (codeToSearch: string) => {
    const cleaned = codeToSearch.trim().toUpperCase();
    if (!cleaned) return;

    const found = payslips.find(
      (p) => p.verificationCode.toUpperCase() === cleaned || p.payslipNumber.toUpperCase() === cleaned
    );

    setSearchedPayslip(found || null);
    setHasSearched(true);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs border border-indigo-100">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Payslip Authenticity Verification
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Verify legitimate payroll documents issued by registered employers using the unique Verification Code or Payslip ID.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md space-y-4">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Enter Verification Code or Payslip ID
        </label>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="e.g. A8K7X2 or PS-2026-00001"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchCode)}
              className="w-full text-sm font-mono font-bold p-3 pl-9 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
            />
          </div>

          <button
            onClick={() => handleSearch(searchCode)}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            Verify Now
          </button>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1">
          <Lock className="w-3 h-3 text-emerald-600" />
          <span>Privacy Protected — Personal contact info is masked for confidentiality.</span>
        </div>
      </div>

      {/* Verification Result */}
      {hasSearched && (
        <div className="animate-scale-up">
          {searchedPayslip ? (
            <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500/80 shadow-lg space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Authentic Document Verified</h3>
                    <span className="text-[11px] text-emerald-600 font-semibold">Status: Officially Issued & Sealed</span>
                  </div>
                </div>

                <span className="font-mono text-xs font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                  {searchedPayslip.verificationCode}
                </span>
              </div>

              {/* Verified Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Issuing Company</div>
                  <div className="font-bold text-slate-800 mt-0.5">{searchedPayslip.companyData.name}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Payslip ID</div>
                  <div className="font-bold font-mono text-slate-800 mt-0.5">{searchedPayslip.payslipNumber}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Pay Period</div>
                  <div className="font-bold text-slate-800 mt-0.5">{searchedPayslip.salaryMonth} {searchedPayslip.salaryYear}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Employee Initials</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {searchedPayslip.employeeData.fullName.split(' ').map((n) => n[0]).join('.')} (ID: {searchedPayslip.employeeId})
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Gross Salary</div>
                  <div className="font-bold font-mono text-slate-800 mt-0.5">{formatCurrency(searchedPayslip.grossSalary)}</div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] font-semibold text-emerald-700 uppercase">Verified Net Payable</div>
                  <div className="font-extrabold font-mono text-emerald-800 text-sm mt-0.5">{formatCurrency(searchedPayslip.netSalary)}</div>
                </div>
              </div>

              {onSelectPayslip && (
                <div className="pt-2 text-center">
                  <button
                    onClick={() => onSelectPayslip(searchedPayslip)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all"
                  >
                    Open Full Document
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border-2 border-rose-200 shadow-md text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Verification Record Not Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active payroll record matching code &quot;<strong>{searchCode}</strong>&quot; was found. Please double-check the code on your payslip document.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
