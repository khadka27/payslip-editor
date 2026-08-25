'use client';

import React from 'react';
import { User, FileText, Download, TrendingUp, DollarSign, Calendar, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Employee, Payslip } from '../types/payslip';
import { formatCurrency } from '../lib/calculator';

interface EmployeePortalProps {
  employee: Employee;
  payslips: Payslip[];
  onSelectPayslip: (payslip: Payslip) => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  employee,
  payslips,
  onSelectPayslip,
}) => {
  const myPayslips = payslips.filter((p) => p.employeeId === employee.id);
  const latestPayslip = myPayslips[0];

  const totalYtdEarnings = latestPayslip ? latestPayslip.ytd.ytdGrossEarnings : myPayslips.reduce((acc, p) => acc + p.grossSalary, 0);
  const totalYtdNet = latestPayslip ? latestPayslip.ytd.ytdNetSalary : myPayslips.reduce((acc, p) => acc + p.netSalary, 0);
  const totalYtdTax = latestPayslip ? latestPayslip.ytd.ytdTaxPaid : myPayslips.reduce((acc, p) => acc + p.taxAmount, 0);

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-400 overflow-hidden flex items-center justify-center font-bold text-xl text-indigo-200">
            {employee.photoUrl ? (
              <img src={employee.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              employee.fullName.charAt(0)
            )}
          </div>
          <div>
            <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Employee Self-Service Portal</div>
            <h1 className="text-2xl font-extrabold">{employee.fullName}</h1>
            <p className="text-xs text-slate-300">{employee.designation} • {employee.department}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-md border border-white/10 text-xs">
          <div>
            <div className="text-slate-400">Employee ID</div>
            <div className="font-mono font-bold">{employee.id}</div>
          </div>
          <div className="border-l border-white/10 pl-3">
            <div className="text-slate-400">Bank Account</div>
            <div className="font-mono">•••• {employee.bankAccountNumber.slice(-4)}</div>
          </div>
        </div>
      </div>

      {/* YTD Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">YTD Gross Salary</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{formatCurrency(totalYtdEarnings)}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">YTD Net Pay Received</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">{formatCurrency(totalYtdNet)}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">YTD Tax Paid</div>
          <div className="text-2xl font-bold font-mono text-violet-600 mt-2">{formatCurrency(totalYtdTax)}</div>
        </div>
      </div>

      {/* My Payslips Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>My Issued Payslips ({myPayslips.length})</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Payslip #</th>
                <th className="py-3 px-4">Pay Period</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Net Salary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {myPayslips.map((ps) => (
                <tr key={ps.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{ps.payslipNumber}</td>
                  <td className="py-3.5 px-4">{ps.salaryMonth} {ps.salaryYear}</td>
                  <td className="py-3.5 px-4 text-slate-600">{ps.paymentDate}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{formatCurrency(ps.netSalary)}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase">
                      {ps.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectPayslip(ps)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
                    >
                      View & Download
                    </button>
                  </td>
                </tr>
              ))}
              {myPayslips.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No payslips issued for your profile yet.
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
