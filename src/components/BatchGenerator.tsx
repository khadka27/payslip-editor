'use client';

import React, { useState } from 'react';
import { CreditCard, Download, CheckCircle2, FileArchive, Users, Play, Sparkles } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Company, Employee, Payslip } from '../types/payslip';
import { calculateSalary, formatCurrency, generateVerificationCode } from '../lib/calculator';

interface BatchGeneratorProps {
  company: Company;
  employees: Employee[];
  onBatchCreated: (newPayslips: Payslip[]) => void;
  onNavigateToAll: () => void;
}

export const BatchGenerator: React.FC<BatchGeneratorProps> = ({
  company,
  employees,
  onBatchCreated,
  onNavigateToAll,
}) => {
  const [salaryMonth, setSalaryMonth] = useState('August');
  const [salaryYear, setSalaryYear] = useState(2026);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const handleRunBatch = async () => {
    setIsProcessing(true);
    setCompletedCount(0);

    const generatedBatch: Payslip[] = [];
    const zip = new JSZip();
    const folder = zip.folder(`Payslips_${salaryMonth}_${salaryYear}`);

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const attendance = {
        calendarDays: 31,
        workingDays: 22,
        presentDays: 22,
        absentDays: 0,
        paidLeave: 0,
        unpaidLeave: 0,
        sickLeave: 0,
        annualLeave: 0,
        publicHolidays: 0,
        overtimeHours: 4,
        lateArrivals: 0,
        earlyDepartures: 0,
        autoDeductUnpaidAbsence: true,
      };

      const earnings = [
        { id: '1', name: 'House Rent Allowance (HRA)', amount: 2000, calculationType: 'fixed' as const, isTaxable: true, isFixed: true },
        { id: '2', name: 'Transport Allowance', amount: 600, calculationType: 'fixed' as const, isTaxable: true, isFixed: true },
      ];

      const deductions = [
        { id: 'd1', name: 'Statutory Tax', amount: 1200, calculationMethod: 'fixed' as const },
        { id: 'd2', name: 'Provident Fund (EPF)', amount: 600, calculationMethod: 'fixed' as const },
      ];

      const calculated = calculateSalary({
        basicSalary: emp.basicSalary,
        earnings,
        deductions,
        attendance,
        taxConfig: { countryRegion: 'US', taxableEarnings: emp.basicSalary + 2600, nonTaxableEarnings: 0, taxExemption: 0, taxRelief: 0, taxDeduction: 0, useProgressiveSlabs: true },
      });

      const ps: Payslip = {
        id: `ps_batch_${Date.now()}_${i}`,
        payslipNumber: `PS-${salaryYear}-${10000 + i}`,
        verificationCode: generateVerificationCode(),
        salaryMonth,
        salaryYear,
        startDate: `2026-08-01`,
        endDate: `2026-08-31`,
        paymentDate: `2026-08-31`,
        payFrequency: 'monthly',
        employeeId: emp.id,
        employeeData: emp,
        companyData: company,
        attendance,
        earnings,
        deductions,
        basicSalary: calculated.basicSalary,
        totalAllowances: calculated.totalAllowances,
        totalBonuses: calculated.totalBonuses,
        totalOvertime: calculated.totalOvertime,
        grossSalary: calculated.grossSalary,
        taxableIncome: calculated.taxableIncome,
        taxAmount: calculated.taxAmount,
        employeeContributions: calculated.employeeContributions,
        otherDeductions: calculated.otherDeductions,
        totalDeductions: calculated.totalDeductions,
        netSalary: calculated.netSalary,
        taxConfig: { countryRegion: 'US', taxableEarnings: emp.basicSalary + 2600, nonTaxableEarnings: 0, taxExemption: 0, taxRelief: 0, taxDeduction: 0, useProgressiveSlabs: true },
        employerContributions: calculated.employerContributions,
        ytd: calculated.updatedYtd,
        paymentInfo: {
          paymentMethod: 'bank_transfer',
          paymentDate: '2026-08-31',
          bankName: emp.bankName,
          accountNumber: `•••• ${emp.bankAccountNumber.slice(-4)}`,
          transactionRef: `TXN-BULK-${i}`,
          paymentStatus: 'processed',
        },
        templateId: 'tpl_standard',
        status: 'approved',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      generatedBatch.push(ps);

      // Create JSON statement file inside ZIP
      if (folder) {
        folder.file(
          `Payslip_${emp.fullName.replace(/\s+/g, '_')}_${emp.id}.json`,
          JSON.stringify(ps, null, 2)
        );
      }

      setCompletedCount(i + 1);
      await new Promise((res) => setTimeout(res, 50));
    }

    onBatchCreated(generatedBatch);

    // Save ZIP File
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `Batch_Payslips_${salaryMonth}_${salaryYear}.zip`);

    setIsProcessing(false);
    alert(`Bulk Run Complete! Generated ${generatedBatch.length} payslips and downloaded ZIP package.`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <CreditCard className="w-6 h-6 text-indigo-600" />
          <span>Bulk Payroll & ZIP Batch Exporter</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Automate full monthly payroll runs for all registered employees and export individual payslips in one ZIP bundle.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">Salary Month</label>
            <select
              value={salaryMonth}
              onChange={(e) => setSalaryMonth(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 mt-1 bg-white"
            >
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Salary Year</label>
            <input
              type="number"
              value={salaryYear}
              onChange={(e) => setSalaryYear(parseInt(e.target.value) || 2026)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 mt-1 font-mono"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="font-bold text-slate-900">{employees.length} Target Employees Selected</div>
              <div className="text-slate-500 text-[11px]">All active employees in directory will receive payslips</div>
            </div>
          </div>

          <span className="font-bold text-indigo-700">{salaryMonth} {salaryYear}</span>
        </div>

        {isProcessing && (
          <div className="space-y-2 p-4 rounded-xl bg-slate-900 text-white text-xs">
            <div className="flex justify-between font-bold">
              <span>Generating Batch Payslips...</span>
              <span className="font-mono">{completedCount} / {employees.length}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-full transition-all duration-200"
                style={{ width: `${(completedCount / employees.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleRunBatch}
          disabled={isProcessing || employees.length === 0}
          className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <FileArchive className="w-4 h-4" />
          <span>{isProcessing ? 'Processing & Compiling ZIP...' : `Generate ${employees.length} Payslips & Download ZIP`}</span>
        </button>
      </div>

    </div>
  );
};
