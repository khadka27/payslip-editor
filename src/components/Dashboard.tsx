'use client';

import React from 'react';
import { 
  Users, 
  DollarSign, 
  FileCheck2, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  Building2, 
  ShieldCheck, 
  Layers, 
  Play,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { Company, Employee, Payslip, PayslipTemplate } from '../types/payslip';
import { formatCurrency } from '../lib/calculator';

interface DashboardProps {
  company: Company;
  employees: Employee[];
  payslips: Payslip[];
  templates: PayslipTemplate[];
  onNavigate: (tab: string) => void;
  onSelectPayslip: (payslip: Payslip) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  company,
  employees,
  payslips,
  templates,
  onNavigate,
  onSelectPayslip,
}) => {
  const totalPayrollGross = payslips.reduce((acc, p) => acc + p.grossSalary, 0);
  const totalNetPaid = payslips.reduce((acc, p) => acc + p.netSalary, 0);
  const totalTaxPaid = payslips.reduce((acc, p) => acc + p.taxAmount, 0);
  const approvedCount = payslips.filter((p) => p.status === 'approved' || p.status === 'published' || p.status === 'locked').length;
  const draftCount = payslips.filter((p) => p.status === 'draft' || p.status === 'pending_review').length;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30">
              <Building2 className="w-3.5 h-3.5" />
              <span>{company.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Payroll Control Center
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Manage employees, generate automated payslips, edit custom templates, and ensure 100% tax & statutory compliance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('payroll_wizard')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Run New Payroll</span>
            </button>
            <button
              onClick={() => onNavigate('template_editor')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-md border border-white/10 transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>Customize Templates</span>
            </button>
          </div>
        </div>
      </div>

      {/* High-Level Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Net Payroll</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(totalNetPaid)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Processed this period</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Employees</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {employees.length} Employees
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
              <span>{employees.filter(e => e.employmentType === 'full_time').length} Full-time</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Payslips</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {approvedCount} / {payslips.length}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-blue-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{draftCount} pending approval</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Statutory Tax Withheld</span>
            <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(totalTaxPaid)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
              <span>Gross: {formatCurrency(totalPayrollGross)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Content Grid: Recent Payslips & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Recent Payslips */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <span>Recent Payslips</span>
            </h2>
            <button
              onClick={() => onNavigate('payslips')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View all ({payslips.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Payslip #</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Net Salary</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payslips.slice(0, 5).map((ps) => {
                    const isApproved = ps.status === 'approved' || ps.status === 'published' || ps.status === 'locked';
                    return (
                      <tr key={ps.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                          {ps.payslipNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-xs">
                              {ps.employeeData.photoUrl ? (
                                <img src={ps.employeeData.photoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                ps.employeeData.fullName.charAt(0)
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{ps.employeeData.fullName}</div>
                              <div className="text-[10px] text-slate-500">{ps.employeeData.designation}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {ps.salaryMonth} {ps.salaryYear}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {formatCurrency(ps.netSalary)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {isApproved ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {ps.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => onSelectPayslip(ps)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                          >
                            View & Print
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {payslips.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No payslips generated yet. Click &quot;Run New Payroll&quot; to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Tools & Templates */}
        <div className="space-y-6">
          
          {/* Quick Action Shortcuts */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Quick Shortcuts</span>
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => onNavigate('employees')}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Employee Directory</div>
                    <div className="text-[11px] text-slate-500">Manage profiles, bank details & SSN</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </button>

              <button
                onClick={() => onNavigate('company')}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Company & Signatures</div>
                    <div className="text-[11px] text-slate-500">Upload logo, stamp & bank details</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </button>

              <button
                onClick={() => onNavigate('batch_export')}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Bulk Payslip ZIP Export</div>
                    <div className="text-[11px] text-slate-500">Export 100+ PDF payslips at once</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </button>
            </div>
          </div>

          {/* Active Template Quick Info */}
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-5 rounded-xl border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900">Active Template</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200/60 text-indigo-800">
                {templates.length} Templates Ready
              </span>
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900">
                {templates[0]?.name || 'Standard Corporate'}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {templates[0]?.description}
              </p>
            </div>
            <button
              onClick={() => onNavigate('template_editor')}
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Open Template Studio
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
