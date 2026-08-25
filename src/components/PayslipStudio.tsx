'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Building2, 
  User, 
  DollarSign, 
  Calendar, 
  Palette, 
  Plus, 
  Trash2, 
  Printer, 
  Download, 
  ShieldCheck, 
  Check, 
  Layers, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  Code2, 
  Copy, 
  Sparkles,
  Globe,
  FileSpreadsheet,
  CheckCircle2,
  Upload
} from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { 
  Company, 
  Employee, 
  PayslipTemplate, 
  EarningComponent, 
  DeductionComponent, 
  AttendanceRecord, 
  TaxConfig, 
  SectionType 
} from '../types/payslip';
import { calculateSalary, formatCurrency, generateVerificationCode } from '../lib/calculator';
import { DEFAULT_TEMPLATES } from '../lib/templates';
import { INITIAL_COMPANY, INITIAL_EMPLOYEES } from '../lib/storage';

interface PayslipStudioProps {
  onOpenVerification: (code: string) => void;
}

export const PayslipStudio: React.FC<PayslipStudioProps> = ({ onOpenVerification }) => {
  const payslipRef = useRef<HTMLDivElement>(null);
  
  // Left Panel Control Tab
  const [controlTab, setControlTab] = useState<'company' | 'employee' | 'earnings' | 'attendance' | 'styles'>('company');
  const [viewportMode, setViewportMode] = useState<'a4' | 'letter' | 'mobile'>('a4');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');

  // Core Data
  const [company, setCompany] = useState<Company>(INITIAL_COMPANY);
  const [employee, setEmployee] = useState<Employee>(INITIAL_EMPLOYEES[0]);
  
  // Salary Period Details
  const [salaryMonth, setSalaryMonth] = useState('August');
  const [salaryYear, setSalaryYear] = useState(2026);
  const [paymentDate, setPaymentDate] = useState('2026-08-31');
  const [payslipNumber, setPayslipNumber] = useState('PS-2026-00001');
  const [verificationCode, setVerificationCode] = useState('A8K7X2');

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
    overtimeHours: 6,
    lateArrivals: 0,
    earlyDepartures: 0,
    autoDeductUnpaidAbsence: true,
  });

  // Earnings List
  const [earnings, setEarnings] = useState<EarningComponent[]>([
    { id: 'e1', name: 'House Rent Allowance (HRA)', amount: 2500, calculationType: 'fixed', isTaxable: true, isFixed: true },
    { id: 'e2', name: 'Transport Allowance', amount: 800, calculationType: 'fixed', isTaxable: true, isFixed: true },
    { id: 'e3', name: 'Medical Allowance', amount: 500, calculationType: 'fixed', isTaxable: false, isFixed: true },
    { id: 'e4', name: 'Special Allowance', amount: 1200, calculationType: 'fixed', isTaxable: true, isFixed: true },
    { id: 'e5', name: 'Performance Bonus', amount: 1000, calculationType: 'fixed', isTaxable: true, isFixed: false },
    { id: 'e6', name: 'Overtime Pay (6 hrs)', amount: 550, calculationType: 'fixed', isTaxable: true, isFixed: false },
  ]);

  // Deductions List
  const [deductions, setDeductions] = useState<DeductionComponent[]>([
    { id: 'd1', name: 'Federal Income Tax', amount: 1850, calculationMethod: 'fixed', description: 'Statutory income tax' },
    { id: 'd2', name: 'Employee Provident Fund (EPF)', amount: 1020, calculationMethod: 'percentage_of_basic', rateOrPercentage: 12 },
    { id: 'd3', name: 'Social Security Contribution', amount: 527, calculationMethod: 'percentage_of_gross', rateOrPercentage: 3.5 },
    { id: 'd4', name: 'Health & Dental Insurance', amount: 350, calculationMethod: 'fixed' },
  ]);

  // Tax Config
  const [taxConfig, setTaxConfig] = useState<TaxConfig>({
    countryRegion: 'US',
    taxableEarnings: 14550,
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

  // Template Customization
  const [template, setTemplate] = useState<PayslipTemplate>(DEFAULT_TEMPLATES[0]);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Real-Time Calculations (Memoized for high performance)
  const calculated = useMemo(() => {
    return calculateSalary({
      basicSalary: employee.basicSalary,
      earnings,
      deductions,
      attendance,
      taxConfig,
    });
  }, [employee.basicSalary, earnings, deductions, attendance, taxConfig]);

  // Generate QR Code dynamically
  useEffect(() => {
    const verifyUrl = `${window.location.origin}?verify=${verificationCode}`;
    QRCode.toDataURL(verifyUrl, { width: 120, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } })
      .then((url: string) => setQrCodeDataUrl(url))
      .catch((err: unknown) => console.error(err));
  }, [verificationCode]);

  // Local File Upload Handler for Logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCompany((prev) => ({ ...prev, logoUrl: event.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Auto-Fetch Company Info from Website URL
  const [fetchWebsiteUrl, setFetchWebsiteUrl] = useState('');
  const [isFetchingCompany, setIsFetchingCompany] = useState(false);

  const handleAutoFetchCompanyInfo = async () => {
    if (!fetchWebsiteUrl.trim()) return;
    setIsFetchingCompany(true);

    try {
      let domain = fetchWebsiteUrl.trim().toLowerCase();
      domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

      // High quality domain logo service
      const logoUrl = `https://unavatar.io/${domain}?fallback=https://icon.horse/icon/${domain}`;
      
      // Format company name from domain
      let brandName = domain.split('.')[0];
      brandName = brandName.charAt(0).toUpperCase() + brandName.slice(1);
      const fullName = `${brandName} Global Technologies`;

      setCompany((prev) => ({
        ...prev,
        name: fullName,
        website: `www.${domain}`,
        email: `payroll@${domain}`,
        logoUrl: logoUrl,
      }));
    } catch (error) {
      console.error('Fetch company info failed:', error);
    } finally {
      setIsFetchingCompany(false);
    }
  };

  // Handlers
  const handleAddEarning = () => {
    setEarnings([
      ...earnings,
      { id: `e_${Date.now()}`, name: 'Custom Allowance', amount: 400, calculationType: 'fixed', isTaxable: true, isFixed: true },
    ]);
  };

  const handleRemoveEarning = (id: string) => {
    setEarnings(earnings.filter((e) => e.id !== id));
  };

  const handleAddDeduction = () => {
    setDeductions([
      ...deductions,
      { id: `d_${Date.now()}`, name: 'Other Deduction', amount: 150, calculationMethod: 'fixed' },
    ]);
  };

  const handleRemoveDeduction = (id: string) => {
    setDeductions(deductions.filter((d) => d.id !== id));
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const updated = [...template.sectionOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setTemplate({ ...template, sectionOrder: updated });
  };

  const handleSelectSampleEmployee = (empId: string) => {
    const found = INITIAL_EMPLOYEES.find((e) => e.id === empId);
    if (found) setEmployee(found);
  };

  // PDF Export
  const handleDownloadPdf = async () => {
    if (!payslipRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = payslipRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Payslip_${employee.fullName.replace(/\s+/g, '_')}_${salaryMonth}_${salaryYear}.pdf`);
    } catch (error) {
      console.error(error);
      alert('PDF generation fallback to print mode...');
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetData = () => {
    if (confirm('Reset company and employee data to defaults?')) {
      setCompany(INITIAL_COMPANY);
      setEmployee(INITIAL_EMPLOYEES[0]);
      setTemplate(DEFAULT_TEMPLATES[0]);
      setVerificationCode(generateVerificationCode());
      setCurrencySymbol('$');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Studio Header Control Bar */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Preset & Currency Selector */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200">
            <Sparkles className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-2">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Template Preset</div>
              <select
                value={template.id}
                onChange={(e) => {
                  const found = DEFAULT_TEMPLATES.find((t) => t.id === e.target.value);
                  if (found) setTemplate(found);
                }}
                className="text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white outline-none cursor-pointer"
              >
                {DEFAULT_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currency</div>
              <select
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white outline-none cursor-pointer font-mono"
              >
                <option value="$">$ USD</option>
                <option value="€">€ EUR</option>
                <option value="£">£ GBP</option>
                <option value="₹">₹ INR</option>
                <option value="NRs">NRs NPR</option>
                <option value="A$">A$ AUD</option>
                <option value="C$">C$ CAD</option>
                <option value="¥">¥ JPY</option>
              </select>
            </div>
          </div>
        </div>

        {/* Viewport Toggles & Main Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewportMode('a4')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewportMode === 'a4' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500'}`}
            >
              A4
            </button>
            <button
              onClick={() => setViewportMode('letter')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewportMode === 'letter' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500'}`}
            >
              Letter
            </button>
            <button
              onClick={() => setViewportMode('mobile')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewportMode === 'mobile' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500'}`}
            >
              Mobile
            </button>
          </div>

          <button
            onClick={handleResetData}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Reset to Sample Data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'Exporting PDF...' : 'Download PDF'}</span>
          </button>
        </div>

      </div>

      {/* Main Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Control Panel (5 Columns) */}
        <div className="no-print lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 max-h-[85vh] overflow-y-auto">
          
          {/* Sub-Tabs */}
          <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-bold">
            <button
              onClick={() => setControlTab('company')}
              className={`py-2 rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                controlTab === 'company' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Company</span>
            </button>

            <button
              onClick={() => setControlTab('employee')}
              className={`py-2 rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                controlTab === 'employee' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Employee</span>
            </button>

            <button
              onClick={() => setControlTab('earnings')}
              className={`py-2 rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                controlTab === 'earnings' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Salary</span>
            </button>

            <button
              onClick={() => setControlTab('attendance')}
              className={`py-2 rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                controlTab === 'attendance' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Leaves</span>
            </button>

            <button
              onClick={() => setControlTab('styles')}
              className={`py-2 rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                controlTab === 'styles' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Design</span>
            </button>
          </div>

          {/* TAB 1: Company Details */}
          {controlTab === 'company' && (
            <div className="space-y-4 text-xs animate-fade-in">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-indigo-600">Company Profile & Signatory</h3>

              {/* Auto-Fetch Company Info Card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Auto-Fetch Logo & Info from Website</span>
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-200">Smart Fetch</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. google.com, stripe.com, apple.com"
                    value={fetchWebsiteUrl}
                    onChange={(e) => setFetchWebsiteUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAutoFetchCompanyInfo()}
                    className="flex-1 p-2 text-xs rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAutoFetchCompanyInfo}
                    disabled={isFetchingCompany}
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 disabled:opacity-50"
                  >
                    {isFetchingCompany ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{isFetchingCompany ? 'Fetching...' : 'Fetch Info'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Company Name</label>
                <input
                  type="text"
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 mt-1 font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block">Company Logo (Image URL or Upload Local File)</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={company.logoUrl || ''}
                    onChange={(e) => setCompany({ ...company, logoUrl: e.target.value })}
                    className="flex-1 p-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://... or upload local image"
                  />
                  <label className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg border border-indigo-200 cursor-pointer flex items-center gap-1.5 text-xs transition-all shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
                {company.logoUrl && (
                  <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <img src={company.logoUrl} alt="Logo Preview" className="h-8 max-w-[120px] object-contain" />
                    <span className="text-[10px] text-slate-500 font-medium">Logo Preview</span>
                    <button
                      type="button"
                      onClick={() => setCompany({ ...company, logoUrl: '' })}
                      className="ml-auto text-[10px] text-rose-600 hover:underline font-semibold"
                    >
                      Clear Logo
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Street Address</label>
                  <input
                    type="text"
                    value={company.address}
                    onChange={(e) => setCompany({ ...company, address: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">City & Country</label>
                  <input
                    type="text"
                    value={`${company.city}, ${company.country}`}
                    onChange={(e) => setCompany({ ...company, city: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Registration Number</label>
                  <input
                    type="text"
                    value={company.registrationNumber}
                    onChange={(e) => setCompany({ ...company, registrationNumber: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Tax / PAN / VAT ID</label>
                  <input
                    type="text"
                    value={company.taxPanVatNumber}
                    onChange={(e) => setCompany({ ...company, taxPanVatNumber: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Signatory Name</label>
                  <input
                    type="text"
                    value={company.authorizedPersonName}
                    onChange={(e) => setCompany({ ...company, authorizedPersonName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Designation</label>
                  <input
                    type="text"
                    value={company.authorizedPersonDesignation}
                    onChange={(e) => setCompany({ ...company, authorizedPersonDesignation: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Employee Info */}
          {controlTab === 'employee' && (
            <div className="space-y-4 text-xs animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-indigo-600">Employee Details</h3>
                
                {/* Sample Employee Switcher */}
                <select
                  value={employee.id}
                  onChange={(e) => handleSelectSampleEmployee(e.target.value)}
                  className="text-[11px] font-semibold p-1 rounded border border-slate-300 bg-white"
                >
                  {INITIAL_EMPLOYEES.map((e) => (
                    <option key={e.id} value={e.id}>Load {e.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Employee ID</label>
                  <input
                    type="text"
                    value={employee.id}
                    onChange={(e) => setEmployee({ ...employee, id: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1 font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={employee.fullName}
                    onChange={(e) => setEmployee({ ...employee, fullName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Designation</label>
                  <input
                    type="text"
                    value={employee.designation}
                    onChange={(e) => setEmployee({ ...employee, designation: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Department</label>
                  <input
                    type="text"
                    value={employee.department}
                    onChange={(e) => setEmployee({ ...employee, department: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Bank Name</label>
                  <input
                    type="text"
                    value={employee.bankName}
                    onChange={(e) => setEmployee({ ...employee, bankName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Account Number</label>
                  <input
                    type="text"
                    value={employee.bankAccountNumber}
                    onChange={(e) => setEmployee({ ...employee, bankAccountNumber: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Tax / PAN / SSN ID</label>
                  <input
                    type="text"
                    value={employee.taxPanNumber}
                    onChange={(e) => setEmployee({ ...employee, taxPanNumber: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Date of Joining</label>
                  <input
                    type="date"
                    value={employee.joiningDate}
                    onChange={(e) => setEmployee({ ...employee, joiningDate: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Earnings & Deductions */}
          {controlTab === 'earnings' && (
            <div className="space-y-4 text-xs animate-fade-in">
              <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-md">
                <div>
                  <div className="text-[10px] text-indigo-300 font-semibold uppercase">Base Salary ({currencySymbol})</div>
                  <input
                    type="number"
                    value={employee.basicSalary}
                    onChange={(e) => setEmployee({ ...employee, basicSalary: parseFloat(e.target.value) || 0 })}
                    className="bg-transparent font-bold font-mono text-lg outline-none text-white w-32"
                  />
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Calculated Net Pay</div>
                  <div className="font-extrabold font-mono text-emerald-400 text-lg">{formatCurrency(calculated.netSalary, currencySymbol)}</div>
                </div>
              </div>

              {/* Earnings */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-600 uppercase text-[11px]">Earnings / Allowances</span>
                  <button onClick={handleAddEarning} className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                    <Plus className="w-3 h-3" /> Add Earning
                  </button>
                </div>

                {earnings.map((e, idx) => (
                  <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <input
                      type="text"
                      value={e.name}
                      onChange={(evt) => {
                        const updated = [...earnings];
                        updated[idx].name = evt.target.value;
                        setEarnings(updated);
                      }}
                      className="flex-1 p-1 rounded border border-slate-300 bg-white font-semibold text-xs"
                    />
                    <input
                      type="number"
                      value={e.amount}
                      onChange={(evt) => {
                        const updated = [...earnings];
                        updated[idx].amount = parseFloat(evt.target.value) || 0;
                        setEarnings(updated);
                      }}
                      className="w-20 p-1 rounded border border-slate-300 bg-white font-mono text-xs"
                    />
                    <button onClick={() => handleRemoveEarning(e.id)} className="p-1 text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Deductions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-600 uppercase text-[11px]">Deductions & Taxes</span>
                  <button onClick={handleAddDeduction} className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 text-[11px]">
                    <Plus className="w-3 h-3" /> Add Deduction
                  </button>
                </div>

                {deductions.map((d, idx) => (
                  <div key={d.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <input
                      type="text"
                      value={d.name}
                      onChange={(evt) => {
                        const updated = [...deductions];
                        updated[idx].name = evt.target.value;
                        setDeductions(updated);
                      }}
                      className="flex-1 p-1 rounded border border-slate-300 bg-white font-semibold text-xs"
                    />
                    <input
                      type="number"
                      value={d.amount}
                      onChange={(evt) => {
                        const updated = [...deductions];
                        updated[idx].amount = parseFloat(evt.target.value) || 0;
                        setDeductions(updated);
                      }}
                      className="w-20 p-1 rounded border border-slate-300 bg-white font-mono text-xs text-rose-600 font-bold"
                    />
                    <button onClick={() => handleRemoveDeduction(d.id)} className="p-1 text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Attendance & Leaves */}
          {controlTab === 'attendance' && (
            <div className="space-y-4 text-xs animate-fade-in">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-indigo-600">Attendance & Period</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Salary Month</label>
                  <select
                    value={salaryMonth}
                    onChange={(e) => setSalaryMonth(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1 bg-white"
                  >
                    {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Salary Year</label>
                  <input
                    type="number"
                    value={salaryYear}
                    onChange={(e) => setSalaryYear(parseInt(e.target.value) || 2026)}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Working Days</label>
                  <input
                    type="number"
                    value={attendance.workingDays}
                    onChange={(e) => setAttendance({ ...attendance, workingDays: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Overtime Hours</label>
                  <input
                    type="number"
                    value={attendance.overtimeHours}
                    onChange={(e) => setAttendance({ ...attendance, overtimeHours: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Unpaid Leave Days</label>
                  <input
                    type="number"
                    value={attendance.unpaidLeave}
                    onChange={(e) => setAttendance({ ...attendance, unpaidLeave: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1 font-mono text-rose-600 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between text-slate-800">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={attendance.autoDeductUnpaidAbsence}
                    onChange={(e) => setAttendance({ ...attendance, autoDeductUnpaidAbsence: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>Auto-deduct unpaid leave</span>
                </label>
                <span className="font-mono font-bold text-rose-700">-{formatCurrency(calculated.unpaidAbsenceDeduction, currencySymbol)}</span>
              </div>
            </div>
          )}

          {/* TAB 5: Style, Colors & Order */}
          {controlTab === 'styles' && (
            <div className="space-y-4 text-xs animate-fade-in">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-indigo-600">Template Customization</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Accent Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={template.primaryColor}
                      onChange={(e) => setTemplate({ ...template, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={template.primaryColor}
                      onChange={(e) => setTemplate({ ...template, primaryColor: e.target.value })}
                      className="w-full p-1.5 rounded border border-slate-300 font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Font Family</label>
                  <select
                    value={template.fontFamily}
                    onChange={(e) => setTemplate({ ...template, fontFamily: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 mt-1 bg-white"
                  >
                    <option value="Inter">Inter (Clean)</option>
                    <option value="Outfit">Outfit (Modern)</option>
                    <option value="Roboto">Roboto (Standard)</option>
                    <option value="Courier Prime">Courier (Contractor)</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 uppercase text-[10px]">Visibility Controls</span>
                {[
                  { key: 'showCompanyLogo', label: 'Company Logo' },
                  { key: 'showQrCode', label: 'Verification QR Code' },
                  { key: 'showSignatures', label: 'Authorized Signature' },
                  { key: 'showYtd', label: 'Year-to-Date (YTD)' },
                  { key: 'showEmployerContrib', label: 'Employer Side Costs' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={(template as any)[item.key]}
                      onChange={(e) => setTemplate({ ...template, [item.key]: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                  </label>
                ))}
              </div>

              {/* Section Order */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 uppercase text-[10px]">Reorder Document Sections</span>
                {template.sectionOrder.map((secId, idx) => (
                  <div key={secId} className="flex items-center justify-between p-2 rounded bg-slate-50 border text-[11px]">
                    <span className="font-semibold text-slate-700 capitalize">{idx + 1}. {secId.replace('_', ' ')}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleMoveSection(idx, 'up')} disabled={idx === 0} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20">
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleMoveSection(idx, 'down')} disabled={idx === template.sectionOrder.length - 1} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20">
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Side LIVE Canvas Display (7 Columns) */}
        <div className="lg:col-span-7 bg-slate-200/80 p-4 sm:p-8 rounded-2xl border border-slate-300/80 flex flex-col items-center justify-start overflow-auto">
          
          {/* Printable Payslip Card */}
          <div
            ref={payslipRef}
            className={`printable-document bg-white text-slate-900 p-8 sm:p-12 shadow-2xl shadow-slate-900/10 transition-all ${
              viewportMode === 'mobile' ? 'w-[380px]' : viewportMode === 'letter' ? 'w-[8.5in] min-h-[11in]' : 'w-[210mm] min-h-[297mm]'
            }`}
            style={{ fontFamily: template.fontFamily === 'Courier Prime' ? 'monospace' : template.fontFamily }}
          >
            
            {template.sectionOrder.map((secId) => {
              switch (secId) {
                
                case 'header':
                  return (
                    <div key={secId} className="flex items-start justify-between border-b-2 pb-5 mb-5" style={{ borderColor: template.primaryColor }}>
                      <div className="space-y-1">
                        {template.showCompanyLogo && company.logoUrl ? (
                          <img src={company.logoUrl} alt="Logo" className="h-12 max-w-[180px] object-contain mb-1" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg text-white font-bold flex items-center justify-center text-lg mb-1" style={{ backgroundColor: template.primaryColor }}>
                            {company.name.charAt(0)}
                          </div>
                        )}
                        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{company.name}</h1>
                        <p className="text-[11px] text-slate-500 max-w-sm">{company.address}, {company.city}, {company.country}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Reg: {company.registrationNumber} • Tax ID: {company.taxPanVatNumber}</p>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border" style={{ backgroundColor: `${template.primaryColor}15`, color: template.primaryColor, borderColor: `${template.primaryColor}40` }}>
                          CONFIDENTIAL PAYSLIP
                        </span>
                        <div className="text-base font-extrabold font-mono text-slate-900 mt-2">{payslipNumber}</div>
                        <div className="text-[11px] font-semibold text-slate-600">{salaryMonth} {salaryYear}</div>
                        <div className="text-[10px] text-slate-400">Pay Date: {paymentDate}</div>
                      </div>
                    </div>
                  );

                case 'company_info':
                  return null;

                case 'employee_info':
                  return (
                    <div key={secId} className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-5">
                      <div className="space-y-1.5">
                        <div className="flex justify-between"><span className="text-slate-500 font-semibold">Employee Name:</span> <strong className="text-slate-900">{employee.fullName}</strong></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-semibold">Employee ID:</span> <span className="font-mono font-bold">{employee.id}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-semibold">Designation:</span> <span>{employee.designation}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-semibold">Department:</span> <span>{employee.department}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-semibold">Joining Date:</span> <span>{employee.joiningDate}</span></div>
                      </div>

                      <div className="space-y-1.5 border-l border-slate-200 pl-6">
                        <div className="flex justify-between"><span className="text-slate-500 font-semibold">Bank Name:</span> <span>{employee.bankName}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-semibold">Account Number:</span> <span className="font-mono">•••• {employee.bankAccountNumber.slice(-4)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-semibold">Tax / PAN ID:</span> <span className="font-mono">{employee.taxPanNumber}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-semibold">Working Days:</span> <span>{attendance.workingDays} / Present: {attendance.presentDays}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-semibold">Unpaid Absences:</span> <span>{attendance.unpaidLeave} days</span></div>
                      </div>
                    </div>
                  );

                case 'attendance_summary':
                  return null;

                case 'earnings_deductions_table':
                  return (
                    <div key={secId} className="border border-slate-300 rounded-lg overflow-hidden text-xs mb-5">
                      <div className="grid grid-cols-2 text-white font-bold py-2.5 px-4 text-[11px] uppercase tracking-wider" style={{ backgroundColor: template.primaryColor }}>
                        <span>Earnings Component</span>
                        <span className="border-l border-white/20 pl-4">Deductions Component</span>
                      </div>

                      <div className="grid grid-cols-2 divide-x divide-slate-200">
                        <div className="p-4 space-y-2">
                          <div className="flex justify-between font-bold text-slate-900 border-b border-slate-100 pb-1">
                            <span>Basic Salary</span>
                            <span className="font-mono">{formatCurrency(employee.basicSalary, currencySymbol)}</span>
                          </div>
                          {earnings.map((e) => (
                            <div key={e.id} className="flex justify-between text-slate-700">
                              <span>{e.name}</span>
                              <span className="font-mono">{formatCurrency(e.amount, currencySymbol)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="p-4 space-y-2">
                          <div className="flex justify-between text-rose-700 font-semibold border-b border-slate-100 pb-1">
                            <span>Income Tax Withheld</span>
                            <span className="font-mono">{formatCurrency(calculated.taxAmount, currencySymbol)}</span>
                          </div>
                          {deductions.map((d) => (
                            <div key={d.id} className="flex justify-between text-slate-700">
                              <span>{d.name}</span>
                              <span className="font-mono text-rose-600">-{formatCurrency(d.amount, currencySymbol)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 bg-slate-100 border-t border-slate-300 font-bold py-2.5 px-4">
                        <div className="flex justify-between">
                          <span>GROSS EARNINGS</span>
                          <span className="font-mono text-emerald-700">{formatCurrency(calculated.grossSalary, currencySymbol)}</span>
                        </div>
                        <div className="flex justify-between border-l border-slate-300 pl-4">
                          <span>TOTAL DEDUCTIONS</span>
                          <span className="font-mono text-rose-700">-{formatCurrency(calculated.totalDeductions, currencySymbol)}</span>
                        </div>
                      </div>
                    </div>
                  );

                case 'net_salary_callout':
                  return (
                    <div key={secId} className="p-5 rounded-xl text-white flex items-center justify-between shadow-md mb-5" style={{ backgroundColor: template.primaryColor }}>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-200">NET SALARY PAYABLE</div>
                        <div className="text-[11px] text-slate-300">Direct Bank Transfer ({paymentDate})</div>
                      </div>
                      <div className="text-2xl font-extrabold font-mono text-white">
                        {formatCurrency(calculated.netSalary, currencySymbol)}
                      </div>
                    </div>
                  );

                case 'ytd_summary':
                  return template.showYtd ? (
                    <div key={secId} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-3 text-[11px] mb-5">
                      <div>
                        <div className="text-slate-400 font-semibold uppercase text-[10px]">YTD Gross Earnings</div>
                        <div className="font-bold font-mono text-slate-900 mt-0.5">{formatCurrency(calculated.updatedYtd.ytdGrossEarnings, currencySymbol)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-semibold uppercase text-[10px]">YTD Tax Withheld</div>
                        <div className="font-bold font-mono text-slate-900 mt-0.5">{formatCurrency(calculated.updatedYtd.ytdTaxPaid, currencySymbol)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-semibold uppercase text-[10px]">YTD Net Pay</div>
                        <div className="font-extrabold font-mono text-emerald-700 mt-0.5">{formatCurrency(calculated.updatedYtd.ytdNetSalary, currencySymbol)}</div>
                      </div>
                    </div>
                  ) : null;

                case 'signatures_stamps':
                  return template.showSignatures ? (
                    <div key={secId} className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs mb-4">
                      <div className="flex items-center gap-3">
                        {template.showQrCode && qrCodeDataUrl && (
                          <img src={qrCodeDataUrl} alt="QR Code" className="w-16 h-16 border border-slate-200 rounded p-1" />
                        )}
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Scan to Verify</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">Code: <strong>{verificationCode}</strong></div>
                          <button
                            onClick={() => onOpenVerification(verificationCode)}
                            className="no-print text-[10px] text-indigo-600 underline font-semibold cursor-pointer"
                          >
                            Verify Authenticity
                          </button>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="font-bold text-slate-900">{company.authorizedPersonName}</div>
                        <div className="text-[11px] text-slate-500">{company.authorizedPersonDesignation}</div>
                        <div className="text-[9px] text-slate-400">Digitally Verified & Sealed</div>
                      </div>
                    </div>
                  ) : null;

                default:
                  return null;
              }
            })}

            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center">
              Computer-generated payslip statement issued by {company.name}.
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
