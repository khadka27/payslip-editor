'use client';

import React, { useState } from 'react';
import { 
  Play, 
  User, 
  Calendar, 
  Plus, 
  Trash2, 
  Calculator, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  DollarSign, 
  ShieldCheck, 
  Sparkles,
  Layers,
  FileCheck
} from 'lucide-react';
import { 
  Company, 
  Employee, 
  Payslip, 
  EarningComponent, 
  DeductionComponent, 
  AttendanceRecord, 
  TaxConfig, 
  PayFrequency,
  PayslipStatus,
  UserRole
} from '../types/payslip';
import { calculateSalary, formatCurrency, generateVerificationCode } from '../lib/calculator';

interface PayrollWizardProps {
  company: Company;
  employees: Employee[];
  currentRole: UserRole;
  onPayslipCreated: (payslip: Payslip) => void;
  onNavigateToViewer: (payslip: Payslip) => void;
}

export const PayrollWizard: React.FC<PayrollWizardProps> = ({
  company,
  employees,
  currentRole,
  onPayslipCreated,
  onNavigateToViewer,
}) => {
  const [step, setStep] = useState(1);

  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || '');
  const [salaryMonth, setSalaryMonth] = useState('August');
  const [salaryYear, setSalaryYear] = useState(2026);
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-31');
  const [paymentDate, setPaymentDate] = useState('2026-08-31');
  const [payFrequency, setPayFrequency] = useState<PayFrequency>('monthly');

  // Attendance
  const [attendance, setAttendance] = useState<AttendanceRecord>({
    calendarDays: 31,
    workingDays: 22,
    presentDays: 22,
    absentDays: 0,
    paidLeave: 0,
    unpaidLeave: 0,
    sickLeave: 0,
    annualLeave: 0,
    publicHolidays: 0,
    overtimeHours: 5,
    lateArrivals: 0,
    earlyDepartures: 0,
    autoDeductUnpaidAbsence: true,
  });

  // Custom Earnings
  const [earnings, setEarnings] = useState<EarningComponent[]>([
    { id: '1', name: 'House Rent Allowance (HRA)', amount: 2500, calculationType: 'fixed', isTaxable: true, isFixed: true },
    { id: '2', name: 'Transport Allowance', amount: 800, calculationType: 'fixed', isTaxable: true, isFixed: true },
    { id: '3', name: 'Medical Allowance', amount: 500, calculationType: 'fixed', isTaxable: false, isFixed: true },
    { id: '4', name: 'Special Allowance', amount: 1200, calculationType: 'fixed', isTaxable: true, isFixed: true },
    { id: '5', name: 'Performance Bonus', amount: 1000, calculationType: 'fixed', isTaxable: true, isFixed: false },
    { id: '6', name: 'Overtime Pay', amount: 450, calculationType: 'fixed', isTaxable: true, isFixed: false },
  ]);

  // Custom Deductions
  const [deductions, setDeductions] = useState<DeductionComponent[]>([
    { id: 'd1', name: 'Federal Income Tax', amount: 1650, calculationMethod: 'fixed', description: 'Statutory income tax' },
    { id: 'd2', name: 'Employee Provident Fund (EPF)', amount: 1020, calculationMethod: 'percentage_of_basic', rateOrPercentage: 12 },
    { id: 'd3', name: 'Social Security Contribution', amount: 480, calculationMethod: 'percentage_of_gross', rateOrPercentage: 3.5 },
    { id: 'd4', name: 'Health Insurance Premium', amount: 350, calculationMethod: 'fixed' },
  ]);

  // Tax Config
  const [taxConfig, setTaxConfig] = useState<TaxConfig>({
    countryRegion: 'US',
    taxableEarnings: 14000,
    nonTaxableEarnings: 500,
    taxExemption: 0,
    taxRelief: 0,
    taxDeduction: 0,
    useProgressiveSlabs: true,
    progressiveSlabs: [
      { minIncome: 0, maxIncome: 2000, ratePercentage: 10 },
      { minIncome: 2000, maxIncome: 8000, ratePercentage: 15 },
      { minIncome: 8000, ratePercentage: 22 },
    ],
  });

  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash' | 'cheque' | 'other'>('bank_transfer');

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId) || employees[0];

  // Calculated Real-Time
  const calculated = calculateSalary({
    basicSalary: selectedEmployee?.basicSalary || 5000,
    earnings,
    deductions,
    attendance,
    taxConfig,
  });

  // Dynamic Item Adders
  const handleAddEarning = () => {
    const newItem: EarningComponent = {
      id: `e_${Date.now()}`,
      name: 'Custom Allowance',
      amount: 500,
      calculationType: 'fixed',
      isTaxable: true,
      isFixed: true,
    };
    setEarnings([...earnings, newItem]);
  };

  const handleRemoveEarning = (id: string) => {
    setEarnings(earnings.filter((e) => e.id !== id));
  };

  const handleAddDeduction = () => {
    const newItem: DeductionComponent = {
      id: `d_${Date.now()}`,
      name: 'Custom Deduction',
      amount: 200,
      calculationMethod: 'fixed',
    };
    setDeductions([...deductions, newItem]);
  };

  const handleRemoveDeduction = (id: string) => {
    setDeductions(deductions.filter((d) => d.id !== id));
  };

  // Final Generate Handler
  const handleGeneratePayslip = (statusToSet: PayslipStatus = 'approved') => {
    if (!selectedEmployee) return;

    const payslipNum = `PS-${salaryYear}-${Math.floor(10000 + Math.random() * 90000)}`;
    const vCode = generateVerificationCode();

    const newPayslip: Payslip = {
      id: `ps_${Date.now()}`,
      payslipNumber: payslipNum,
      verificationCode: vCode,
      salaryMonth,
      salaryYear,
      startDate,
      endDate,
      paymentDate,
      payFrequency,
      employeeId: selectedEmployee.id,
      employeeData: selectedEmployee,
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
      taxConfig,
      employerContributions: calculated.employerContributions,
      ytd: calculated.updatedYtd,
      paymentInfo: {
        paymentMethod,
        paymentDate,
        bankName: selectedEmployee.bankName,
        accountNumber: `•••• ${selectedEmployee.bankAccountNumber.slice(-4)}`,
        transactionRef: `TXN-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        paymentStatus: 'processed',
      },
      templateId: 'tpl_standard',
      status: statusToSet,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onPayslipCreated(newPayslip);
    onNavigateToViewer(newPayslip);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      
      {/* Step Indicator Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Interactive Payroll & Payslip Generator</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Step-by-step salary calculations, custom allowances, tax slab adjustments & attendance deductions.
            </p>
          </div>
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
            Step {step} of 4
          </span>
        </div>

        {/* Step Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setStep(1)}
            className={`p-3 rounded-xl border text-left transition-all ${
              step === 1 ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs' : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Step 1</div>
            <div className="text-xs font-bold mt-0.5">Period & Employee</div>
          </button>

          <button
            onClick={() => setStep(2)}
            className={`p-3 rounded-xl border text-left transition-all ${
              step === 2 ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs' : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Step 2</div>
            <div className="text-xs font-bold mt-0.5">Attendance & Leaves</div>
          </button>

          <button
            onClick={() => setStep(3)}
            className={`p-3 rounded-xl border text-left transition-all ${
              step === 3 ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs' : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Step 3</div>
            <div className="text-xs font-bold mt-0.5">Earnings & Deductions</div>
          </button>

          <button
            onClick={() => setStep(4)}
            className={`p-3 rounded-xl border text-left transition-all ${
              step === 4 ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs' : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Step 4</div>
            <div className="text-xs font-bold mt-0.5">Tax & Final Calculation</div>
          </button>
        </div>
      </div>

      {/* STEP 1: Period & Employee */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 animate-fade-in">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-indigo-600 flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Select Employee & Payroll Period</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-700">Target Employee *</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 mt-1 bg-white font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.id}) — {emp.designation} (${emp.basicSalary}/mo)
                  </option>
                ))}
              </select>

              {selectedEmployee && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-800">{selectedEmployee.fullName}</div>
                  <div className="text-slate-500">{selectedEmployee.department} • {selectedEmployee.workLocation}</div>
                  <div className="text-slate-600 font-mono">Bank: {selectedEmployee.bankName} (••• {selectedEmployee.bankAccountNumber.slice(-4)})</div>
                  <div className="text-slate-600 font-mono">PAN/SSN: {selectedEmployee.taxPanNumber}</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Salary Month</label>
                <select
                  value={salaryMonth}
                  onChange={(e) => setSalaryMonth(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 bg-white outline-none"
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
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Period Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Period End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 bg-white outline-none"
                >
                  <option value="bank_transfer">Direct Bank Transfer</option>
                  <option value="cash">Cash Payment</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md hover:bg-indigo-700"
            >
              <span>Next: Attendance & Overtime</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Attendance & Leaves */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 animate-fade-in">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-indigo-600 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Attendance, Leaves & Overtime Tracking</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Calendar Days</label>
              <input
                type="number"
                value={attendance.calendarDays}
                onChange={(e) => setAttendance({ ...attendance, calendarDays: parseInt(e.target.value) || 0 })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Working Days</label>
              <input
                type="number"
                value={attendance.workingDays}
                onChange={(e) => setAttendance({ ...attendance, workingDays: parseInt(e.target.value) || 0 })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Days Present</label>
              <input
                type="number"
                value={attendance.presentDays}
                onChange={(e) => setAttendance({ ...attendance, presentDays: parseInt(e.target.value) || 0 })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Overtime Hours</label>
              <input
                type="number"
                value={attendance.overtimeHours}
                onChange={(e) => setAttendance({ ...attendance, overtimeHours: parseInt(e.target.value) || 0 })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Paid Leave Days</label>
              <input
                type="number"
                value={attendance.paidLeave}
                onChange={(e) => setAttendance({ ...attendance, paidLeave: parseInt(e.target.value) || 0 })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Unpaid Leave Days</label>
              <input
                type="number"
                value={attendance.unpaidLeave}
                onChange={(e) => setAttendance({ ...attendance, unpaidLeave: parseInt(e.target.value) || 0 })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 font-mono text-rose-600 font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Sick Leave</label>
              <input
                type="number"
                value={attendance.sickLeave}
                onChange={(e) => setAttendance({ ...attendance, sickLeave: parseInt(e.target.value) || 0 })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Public Holidays</label>
              <input
                type="number"
                value={attendance.publicHolidays}
                onChange={(e) => setAttendance({ ...attendance, publicHolidays: parseInt(e.target.value) || 0 })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 font-mono"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoDeduct"
                checked={attendance.autoDeductUnpaidAbsence}
                onChange={(e) => setAttendance({ ...attendance, autoDeductUnpaidAbsence: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <label htmlFor="autoDeduct" className="font-semibold text-slate-800 cursor-pointer">
                Automatically calculate salary deduction for unpaid leave days
              </label>
            </div>
            <div className="font-bold text-rose-700 font-mono">
              - {formatCurrency(calculated.unpaidAbsenceDeduction)}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md hover:bg-indigo-700"
            >
              <span>Next: Custom Earnings & Deductions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Earnings & Deductions */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 animate-fade-in">
          
          {/* Base Salary Header */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
            <div>
              <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Base Salary</div>
              <div className="text-xl font-bold font-mono">{formatCurrency(selectedEmployee?.basicSalary || 5000)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Calculated Gross</div>
              <div className="text-xl font-bold font-mono text-emerald-400">{formatCurrency(calculated.grossSalary)}</div>
            </div>
          </div>

          {/* Earnings List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Custom Earning Components</h3>
              <button
                onClick={handleAddEarning}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Earning Component</span>
              </button>
            </div>

            <div className="space-y-2">
              {earnings.map((earn, idx) => (
                <div key={earn.id} className="grid grid-cols-1 sm:grid-cols-5 gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs items-center">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={earn.name}
                      onChange={(e) => {
                        const updated = [...earnings];
                        updated[idx].name = e.target.value;
                        setEarnings(updated);
                      }}
                      className="w-full text-xs p-2 rounded border border-slate-300 bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={earn.amount}
                      onChange={(e) => {
                        const updated = [...earnings];
                        updated[idx].amount = parseFloat(e.target.value) || 0;
                        setEarnings(updated);
                      }}
                      className="w-full text-xs p-2 rounded border border-slate-300 bg-white font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={earn.isTaxable}
                        onChange={(e) => {
                          const updated = [...earnings];
                          updated[idx].isTaxable = e.target.checked;
                          setEarnings(updated);
                        }}
                      />
                      <span>Taxable</span>
                    </label>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => handleRemoveEarning(earn.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deductions List */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wider">Custom Deduction Components</h3>
              <button
                onClick={handleAddDeduction}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Deduction Component</span>
              </button>
            </div>

            <div className="space-y-2">
              {deductions.map((ded, idx) => (
                <div key={ded.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs items-center">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={ded.name}
                      onChange={(e) => {
                        const updated = [...deductions];
                        updated[idx].name = e.target.value;
                        setDeductions(updated);
                      }}
                      className="w-full text-xs p-2 rounded border border-slate-300 bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={ded.amount}
                      onChange={(e) => {
                        const updated = [...deductions];
                        updated[idx].amount = parseFloat(e.target.value) || 0;
                        setDeductions(updated);
                      }}
                      className="w-full text-xs p-2 rounded border border-slate-300 bg-white font-mono text-rose-600 font-bold"
                    />
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => handleRemoveDeduction(ded.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md hover:bg-indigo-700"
            >
              <span>Next: Tax Slabs & Summary</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* STEP 4: Tax Slabs & Final Calculation Summary */}
      {step === 4 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 animate-fade-in">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-indigo-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Tax Slabs & Final Summary</span>
          </h2>

          {/* Region & Slabs Setup */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Tax Jurisdiction / Country</label>
              <select
                value={taxConfig.countryRegion}
                onChange={(e) => setTaxConfig({ ...taxConfig, countryRegion: e.target.value as any })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 bg-white outline-none"
              >
                <option value="US">United States (IRS)</option>
                <option value="IN">India (New Tax Regime)</option>
                <option value="UK">United Kingdom (PAYE)</option>
                <option value="NP">Nepal Tax Rules</option>
                <option value="Custom">Custom Progressive Slabs</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Tax Exemptions ($)</label>
              <input
                type="number"
                value={taxConfig.taxExemption}
                onChange={(e) => setTaxConfig({ ...taxConfig, taxExemption: parseFloat(e.target.value) || 0 })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Calculated Tax Withheld</label>
              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-900 mt-1">
                {formatCurrency(calculated.taxAmount)}
              </div>
            </div>
          </div>

          {/* Calculation Summary Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Salary Summary Sheet</span>
              <span className="text-xs font-mono text-slate-300">{selectedEmployee.fullName} ({selectedEmployee.id})</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-slate-400">Basic Salary</div>
                <div className="text-sm font-bold font-mono">{formatCurrency(calculated.basicSalary)}</div>
              </div>
              <div>
                <div className="text-slate-400">Total Allowances</div>
                <div className="text-sm font-bold font-mono text-emerald-400">+{formatCurrency(calculated.totalAllowances)}</div>
              </div>
              <div>
                <div className="text-slate-400">Total Deductions</div>
                <div className="text-sm font-bold font-mono text-rose-400">-{formatCurrency(calculated.totalDeductions)}</div>
              </div>
              <div>
                <div className="text-xs text-indigo-300 font-bold uppercase">NET PAYABLE</div>
                <div className="text-2xl font-extrabold font-mono text-emerald-400">{formatCurrency(calculated.netSalary)}</div>
              </div>
            </div>

            {/* Formula display */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300 font-mono">
              Net Salary ({formatCurrency(calculated.netSalary)}) = Gross ({formatCurrency(calculated.grossSalary)}) - Total Deductions ({formatCurrency(calculated.totalDeductions)})
            </div>
          </div>

          {/* Final Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(3)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleGeneratePayslip('draft')}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all"
              >
                Save as Draft
              </button>

              <button
                onClick={() => handleGeneratePayslip('approved')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Open Payslip</span>
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
