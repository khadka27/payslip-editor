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
  Upload,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Eye,
  GripVertical
} from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { toPng } from 'html-to-image';
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
import { CustomSelect } from './ui/CustomSelect';
import { CustomDatePicker } from './ui/CustomDatePicker';
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
  const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(0.85);

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

  // Drag and Drop Section Reordering
  const [draggedSectionIdx, setDraggedSectionIdx] = useState<number | null>(null);

  const handleDragStartSection = (e: React.DragEvent, index: number) => {
    setDraggedSectionIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverSection = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropSection = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSectionIdx === null || draggedSectionIdx === targetIndex) return;

    const updated = [...template.sectionOrder];
    const itemToMove = updated[draggedSectionIdx];
    updated.splice(draggedSectionIdx, 1);
    updated.splice(targetIndex, 0, itemToMove);

    setTemplate({ ...template, sectionOrder: updated });
    setDraggedSectionIdx(null);
  };

  const handleSelectSampleEmployee = (empId: string) => {
    const found = INITIAL_EMPLOYEES.find((e) => e.id === empId);
    if (found) setEmployee(found);
  };

  // Cross-Origin Image Converter Helper for Canvas Export
  const convertImageToDataUrl = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!url || url.startsWith('data:')) {
        resolve(url);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth || img.width;
          c.height = img.naturalHeight || img.height;
          const ctx = c.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(c.toDataURL('image/png'));
            return;
          }
        } catch (err) {
          console.warn('Canvas toDataURL failed for cross-origin image:', err);
        }
        resolve('');
      };
      img.onerror = () => resolve('');
      img.src = url;
    });
  };

  // Helper to convert any CSS color (including modern lab, oklab, oklch) to standard hex/rgb via 2D Canvas Context
  const convertCssColorToRgb = (colorStr: string): string => {
    if (!colorStr || colorStr === 'transparent' || colorStr === 'inherit') return colorStr;
    if (!colorStr.includes('lab') && !colorStr.includes('oklch') && !colorStr.includes('color(')) return colorStr;
    
    try {
      const c = document.createElement('canvas');
      c.width = 1;
      c.height = 1;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = colorStr;
        return ctx.fillStyle; // Canvas automatically normalizes lab/oklab/oklch to standard #rrggbb or rgb()
      }
    } catch (err) {
      console.warn('Color conversion failed:', err);
    }
    return '#ffffff';
  };

  // High-Resolution 300 DPI PDF Engine using html-to-image + jsPDF (Full Tailwind v4 lab/oklab/oklch Support)
  const handleDownloadPdf = async () => {
    if (!payslipRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = payslipRef.current;

      // Temporarily remove preview scale transform for unclipped rendering
      const originalTransform = element.style.transform;
      element.style.transform = 'none';

      let imgData = '';
      try {
        // High-definition DOM to PNG conversion natively supporting Tailwind v4 & modern CSS color spaces
        imgData = await toPng(element, {
          quality: 1.0,
          pixelRatio: 2.5,
          backgroundColor: '#ffffff',
          cacheBust: true,
          skipFonts: true,
        });
      } catch (toPngErr) {
        console.warn('toPng fallback to html2canvas:', toPngErr);
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            const styleTags = clonedDoc.querySelectorAll('style');
            styleTags.forEach((tag) => {
              if (tag.textContent) {
                tag.textContent = tag.textContent
                  .replace(/lab\([^)]+\)/gi, '#0f172a')
                  .replace(/oklab\([^)]+\)/gi, '#0f172a')
                  .replace(/oklch\([^)]+\)/gi, '#0f172a');
              }
            });
          },
        });
        imgData = canvas.toDataURL('image/png');
      }

      // Restore zoom transform immediately
      element.style.transform = originalTransform;

      const isLetter = viewportMode === 'letter';
      const pdf = new jsPDF('p', 'mm', isLetter ? 'letter' : 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Load image dimensions to compute accurate page height
      const tempImg = new Image();
      tempImg.src = imgData;
      await new Promise((res) => { tempImg.onload = res; });

      const imgWidth = pageWidth;
      const imgHeight = (tempImg.height * imgWidth) / tempImg.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Page 1
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Multi-page support if content overflows single page
      while (heightLeft > 5) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const fileName = `Payslip_${company.name.replace(/\s+/g, '_')}_${salaryMonth}_${salaryYear}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF export error:', error);
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
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Template Preset</div>
              <CustomSelect
                options={DEFAULT_TEMPLATES.map((t) => ({ value: t.id, label: t.name }))}
                value={template.id}
                onChange={(val) => {
                  const found = DEFAULT_TEMPLATES.find((t) => t.id === val);
                  if (found) setTemplate(found);
                }}
                size="sm"
              />
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Currency</div>
              <CustomSelect
                fontMono
                options={[
                  { value: '$', label: '$ USD' },
                  { value: '€', label: '€ EUR' },
                  { value: '£', label: '£ GBP' },
                  { value: '₹', label: '₹ INR' },
                  { value: 'NRs', label: 'NRs NPR' },
                  { value: 'A$', label: 'A$ AUD' },
                  { value: 'C$', label: 'C$ CAD' },
                  { value: '¥', label: '¥ JPY' },
                ]}
                value={currencySymbol}
                onChange={setCurrencySymbol}
                size="sm"
              />
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

          {/* Zoom Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setZoomScale((prev) => Math.max(0.65, prev - 0.1))}
              className="p-1 rounded text-slate-600 hover:bg-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] px-1 font-bold text-slate-700">{Math.round(zoomScale * 100)}%</span>
            <button
              onClick={() => setZoomScale((prev) => Math.min(1.3, prev + 0.1))}
              className="p-1 rounded text-slate-600 hover:bg-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIsFullScreenPreview(true)}
            className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs transition-all active:scale-95"
          >
            <Maximize2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="hidden xs:inline sm:inline">Full Preview</span>
          </button>

          <button
            onClick={handleResetData}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Reset to Sample Data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-xs"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>{isGeneratingPdf ? 'Exporting...' : 'Download PDF'}</span>
          </button>
        </div>

      </div>

      {/* Main Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Control Panel (5 Columns) */}
        <div className="no-print lg:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
          
          {/* Sub-Tabs */}
          <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-[10px] sm:text-[11px] font-bold">
            <button
              onClick={() => setControlTab('company')}
              className={`py-2 px-1 rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                controlTab === 'company' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate w-full text-center">Company</span>
            </button>

            <button
              onClick={() => setControlTab('employee')}
              className={`py-2 px-1 rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                controlTab === 'employee' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate w-full text-center">Employee</span>
            </button>

            <button
              onClick={() => setControlTab('earnings')}
              className={`py-2 px-1 rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                controlTab === 'earnings' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate w-full text-center">Salary</span>
            </button>

            <button
              onClick={() => setControlTab('attendance')}
              className={`py-2 px-1 rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                controlTab === 'attendance' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate w-full text-center">Leaves</span>
            </button>

            <button
              onClick={() => setControlTab('styles')}
              className={`py-2 px-1 rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                controlTab === 'styles' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate w-full text-center">Design</span>
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
                  <label className="font-semibold text-slate-700 block mb-1">Date of Joining</label>
                  <CustomDatePicker
                    value={employee.joiningDate}
                    onChange={(val) => setEmployee({ ...employee, joiningDate: val })}
                    align="right"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Earnings & Deductions */}
          {controlTab === 'earnings' && (
            <div className="space-y-4 text-xs animate-fade-in">
              
              {/* Base Salary Header Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-slate-50 to-emerald-50/70 border border-indigo-100/90 shadow-xs flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1">
                    Base Salary
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 font-mono font-bold text-slate-400 text-sm select-none">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      value={employee.basicSalary || ''}
                      onChange={(e) => setEmployee({ ...employee, basicSalary: parseFloat(e.target.value) || 0 })}
                      className="w-full text-base font-extrabold font-mono pl-7 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 shadow-2xs focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Calculated Net Pay</div>
                  <div className="text-xl font-extrabold font-mono text-emerald-600 mt-1">{formatCurrency(calculated.netSalary, currencySymbol)}</div>
                </div>
              </div>

              {/* Earnings */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-600 uppercase text-[11px] tracking-wider">Earnings / Allowances</span>
                  <button onClick={handleAddEarning} className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 text-[11px] transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add Earning
                  </button>
                </div>

                {earnings.map((e, idx) => (
                  <div key={e.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 transition-all">
                    <input
                      type="text"
                      value={e.name}
                      onChange={(evt) => {
                        const updated = [...earnings];
                        updated[idx].name = evt.target.value;
                        setEarnings(updated);
                      }}
                      className="flex-1 p-2 rounded-lg border border-slate-300 bg-white font-semibold text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <div className="relative flex items-center w-28">
                      <span className="absolute left-2.5 text-[11px] font-mono font-bold text-slate-400 select-none">
                        {currencySymbol}
                      </span>
                      <input
                        type="number"
                        value={e.amount || ''}
                        onChange={(evt) => {
                          const updated = [...earnings];
                          updated[idx].amount = parseFloat(evt.target.value) || 0;
                          setEarnings(updated);
                        }}
                        className="w-full p-2 pl-6 rounded-lg border border-slate-300 bg-white font-mono font-bold text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <button onClick={() => handleRemoveEarning(e.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Deductions */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-600 uppercase text-[11px] tracking-wider">Deductions & Taxes</span>
                  <button onClick={handleAddDeduction} className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 text-[11px] transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add Deduction
                  </button>
                </div>

                {deductions.map((d, idx) => (
                  <div key={d.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 transition-all">
                    <input
                      type="text"
                      value={d.name}
                      onChange={(evt) => {
                        const updated = [...deductions];
                        updated[idx].name = evt.target.value;
                        setDeductions(updated);
                      }}
                      className="flex-1 p-2 rounded-lg border border-slate-300 bg-white font-semibold text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <div className="relative flex items-center w-28">
                      <span className="absolute left-2.5 text-[11px] font-mono font-bold text-rose-400 select-none">
                        -
                      </span>
                      <input
                        type="number"
                        value={d.amount || ''}
                        onChange={(evt) => {
                          const updated = [...deductions];
                          updated[idx].amount = parseFloat(evt.target.value) || 0;
                          setDeductions(updated);
                        }}
                        className="w-full p-2 pl-5 rounded-lg border border-slate-300 bg-white font-mono font-extrabold text-xs text-rose-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <button onClick={() => handleRemoveDeduction(d.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
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
                  <label className="font-semibold text-slate-700 block mb-1">Salary Month</label>
                  <CustomSelect
                    options={['January','February','March','April','May','June','July','August','September','October','November','December']}
                    value={salaryMonth}
                    onChange={setSalaryMonth}
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Salary Year</label>
                  <input
                    type="number"
                    value={salaryYear}
                    onChange={(e) => setSalaryYear(parseInt(e.target.value) || 2026)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 mt-1 font-mono text-slate-900 font-bold bg-slate-50/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
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
                    className="w-full p-2.5 rounded-xl border border-slate-300 mt-1 font-mono text-slate-900 font-bold bg-slate-50/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Overtime Hours</label>
                  <input
                    type="number"
                    value={attendance.overtimeHours}
                    onChange={(e) => setAttendance({ ...attendance, overtimeHours: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 mt-1 font-mono text-slate-900 font-bold bg-slate-50/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Paid Leave Days</label>
                  <input
                    type="number"
                    value={attendance.paidLeave || 0}
                    onChange={(e) => setAttendance({ ...attendance, paidLeave: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 mt-1 font-mono text-emerald-700 font-extrabold bg-slate-50/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Unpaid Leave Days</label>
                  <input
                    type="number"
                    value={attendance.unpaidLeave}
                    onChange={(e) => setAttendance({ ...attendance, unpaidLeave: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 mt-1 font-mono text-rose-600 font-extrabold bg-slate-50/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Date</label>
                <CustomDatePicker
                  value={paymentDate}
                  onChange={setPaymentDate}
                  align="right"
                />
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
                  <label className="font-semibold text-slate-700 block mb-1">Font Family</label>
                  <CustomSelect
                    options={[
                      { value: 'Inter', label: 'Inter (Clean Sans)' },
                      { value: 'Outfit', label: 'Outfit (Tech Sans)' },
                      { value: 'Roboto', label: 'Roboto (Corporate)' },
                      { value: 'Montserrat', label: 'Montserrat (Geometric)' },
                      { value: 'Poppins', label: 'Poppins (Modern)' },
                      { value: 'Courier Prime', label: 'Courier Prime (Mono)' },
                      { value: 'Fira Code', label: 'Fira Code (Tech Mono)' },
                      { value: 'Georgia', label: 'Georgia (Classic Serif)' },
                      { value: 'Playfair Display', label: 'Playfair (Luxury Serif)' },
                      { value: 'Cinzel', label: 'Cinzel (Executive Roman)' },
                    ]}
                    value={template.fontFamily}
                    onChange={(val) => setTemplate({ ...template, fontFamily: val as any })}
                  />
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
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase text-[10px]">Reorder Document Sections</span>
                  <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
                    <GripVertical className="w-3 h-3" /> Grab & Move
                  </span>
                </div>

                {template.sectionOrder.map((secId, idx) => (
                  <div
                    key={secId}
                    draggable
                    onDragStart={(e) => handleDragStartSection(e, idx)}
                    onDragOver={handleDragOverSection}
                    onDrop={(e) => handleDropSection(e, idx)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-[11px] cursor-grab active:cursor-grabbing transition-all ${
                      draggedSectionIdx === idx 
                        ? 'bg-indigo-50 border-indigo-400 opacity-60 scale-[0.98]' 
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800 capitalize">{idx + 1}. {secId.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleMoveSection(idx, 'up')} disabled={idx === 0} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20" title="Move Up">
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleMoveSection(idx, 'down')} disabled={idx === template.sectionOrder.length - 1} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20" title="Move Down">
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
        <div className="lg:col-span-7 bg-slate-200/80 p-4 sm:p-8 rounded-2xl border border-slate-300/80 flex flex-col items-center justify-start overflow-auto custom-scrollbar">
          
          {/* Printable Payslip Card */}
          <div
            ref={payslipRef}
            className={`printable-document bg-white text-slate-900 p-8 sm:p-12 shadow-2xl shadow-slate-900/10 transition-all ${
              viewportMode === 'mobile' ? 'w-[380px]' : viewportMode === 'letter' ? 'w-[8.5in] min-h-[11in]' : 'w-[210mm] min-h-[297mm]'
            }`}
            style={{ 
              fontFamily: template.fontFamily === 'Courier Prime' ? 'monospace' : template.fontFamily,
              transform: `scale(${zoomScale})`,
              transformOrigin: 'top center',
            }}
          >
            
            {template.sectionOrder.map((secId) => {
              switch (secId) {
                
                case 'header':
                  return (
                    <div key={secId} className={`flex items-start justify-between border-b-2 pb-5 mb-5 gap-3 ${viewportMode === 'mobile' ? 'flex-col sm:flex-row' : ''}`} style={{ borderColor: template.primaryColor }}>
                      <div className="space-y-1">
                        {template.showCompanyLogo && company.logoUrl ? (
                          <img src={company.logoUrl} alt="Logo" className="h-10 sm:h-12 max-w-[180px] object-contain mb-1" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg text-white font-bold flex items-center justify-center text-lg mb-1" style={{ backgroundColor: template.primaryColor }}>
                            {company.name.charAt(0)}
                          </div>
                        )}
                        <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">{company.name}</h1>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 max-w-sm">{company.address}, {company.city}, {company.country}</p>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono">Reg: {company.registrationNumber} • Tax ID: {company.taxPanVatNumber}</p>
                      </div>

                      <div className={`${viewportMode === 'mobile' ? 'text-left' : 'text-right'} space-y-1 shrink-0`}>
                        <span className="inline-block px-2.5 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider border" style={{ backgroundColor: `${template.primaryColor}15`, color: template.primaryColor, borderColor: `${template.primaryColor}40` }}>
                          CONFIDENTIAL PAYSLIP
                        </span>
                        <div className="text-sm sm:text-base font-extrabold font-mono text-slate-900 mt-1">{payslipNumber}</div>
                        <div className="text-[10px] sm:text-[11px] font-semibold text-slate-600">{salaryMonth} {salaryYear}</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-400">Pay Date: {paymentDate}</div>
                      </div>
                    </div>
                  );

                case 'company_info':
                  return null;

                case 'employee_info':
                  return (
                    <div key={secId} className={`grid gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-5 ${viewportMode === 'mobile' ? 'grid-cols-1 text-[11px]' : 'grid-cols-2'}`}>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Employee Name:</span> <strong className="text-slate-900 truncate">{employee.fullName}</strong></div>
                        <div className="flex items-center justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Employee ID:</span> <span className="font-mono font-bold">{employee.id}</span></div>
                        <div className="flex items-center justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Designation:</span> <span className="truncate">{employee.designation}</span></div>
                        <div className="flex items-center justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Department:</span> <span className="truncate">{employee.department}</span></div>
                        <div className="flex items-center justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Joining Date:</span> <span>{employee.joiningDate}</span></div>
                      </div>

                      <div className={`space-y-1.5 ${viewportMode === 'mobile' ? 'border-t pt-3 border-slate-200' : 'border-l pl-6 border-slate-200'}`}>
                        <div className="flex items-center justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Bank Name:</span> <span className="truncate">{employee.bankName}</span></div>
                        <div className="flex items-center justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Account Number:</span> <span className="font-mono">•••• {employee.bankAccountNumber.slice(-4)}</span></div>
                        <div className="flex items-center justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Tax / PAN ID:</span> <span className="font-mono">{employee.taxPanNumber}</span></div>
                        <div className="flex items-center justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Working Days:</span> <span>{attendance.workingDays} / Pres: {attendance.presentDays}</span></div>
                        <div className="flex items-center justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Paid Leave:</span> <span className="font-mono text-emerald-700 font-bold">{attendance.paidLeave || 0} days</span></div>
                        <div className="flex items-center justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Unpaid Absences:</span> <span>{attendance.unpaidLeave} days</span></div>
                      </div>
                    </div>
                  );

                case 'attendance_summary':
                  return null;

                case 'earnings_deductions_table':
                  return (
                    <div key={secId} className="border border-slate-300 rounded-lg overflow-hidden text-xs mb-5">
                      <div className="grid grid-cols-2 text-white font-bold py-2 px-3 sm:py-2.5 sm:px-4 text-[10px] sm:text-[11px] uppercase tracking-wider" style={{ backgroundColor: template.primaryColor }}>
                        <span className="truncate">Earnings</span>
                        <span className="border-l border-white/20 pl-2 sm:pl-4 truncate">Deductions</span>
                      </div>

                      <div className="grid grid-cols-2 divide-x divide-slate-200">
                        <div className={`space-y-1.5 ${viewportMode === 'mobile' ? 'p-2.5 text-[10px]' : 'p-4 text-xs space-y-2'}`}>
                          <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-100 pb-1 gap-1">
                            <span className="truncate">Basic Salary</span>
                            <span className="font-mono shrink-0">{formatCurrency(employee.basicSalary, currencySymbol)}</span>
                          </div>
                          {earnings.map((e) => (
                            <div key={e.id} className="flex items-center justify-between text-slate-700 gap-1">
                              <span className="truncate">{e.name}</span>
                              <span className="font-mono shrink-0">{formatCurrency(e.amount, currencySymbol)}</span>
                            </div>
                          ))}
                        </div>

                        <div className={`space-y-1.5 ${viewportMode === 'mobile' ? 'p-2.5 text-[10px]' : 'p-4 text-xs space-y-2'}`}>
                          <div className="flex items-center justify-between text-rose-700 font-semibold border-b border-slate-100 pb-1 gap-1">
                            <span className="truncate">Tax Withheld</span>
                            <span className="font-mono shrink-0">{formatCurrency(calculated.taxAmount, currencySymbol)}</span>
                          </div>
                          {deductions.map((d) => (
                            <div key={d.id} className="flex items-center justify-between text-slate-700 gap-1">
                              <span className="truncate">{d.name}</span>
                              <span className="font-mono text-rose-600 shrink-0">-{formatCurrency(d.amount, currencySymbol)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 bg-slate-100 border-t border-slate-300 font-bold py-2 px-2.5 sm:py-2.5 sm:px-4 text-[10px] sm:text-xs">
                        <div className="flex items-center justify-between gap-1 pr-1">
                          <span className="truncate">GROSS</span>
                          <span className="font-mono text-emerald-700 shrink-0">{formatCurrency(calculated.grossSalary, currencySymbol)}</span>
                        </div>
                        <div className="flex items-center justify-between border-l border-slate-300 pl-2 sm:pl-4 gap-1">
                          <span className="truncate">DEDUCTIONS</span>
                          <span className="font-mono text-rose-700 shrink-0">-{formatCurrency(calculated.totalDeductions, currencySymbol)}</span>
                        </div>
                      </div>
                    </div>
                  );

                case 'net_salary_callout':
                  return (
                    <div key={secId} className={`rounded-xl text-white flex justify-between shadow-md mb-5 ${viewportMode === 'mobile' ? 'p-3 flex-col gap-1 items-start' : 'p-5 flex-row items-center'}`} style={{ backgroundColor: template.primaryColor }}>
                      <div>
                        <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-200">NET SALARY PAYABLE</div>
                        <div className="text-[9px] sm:text-[11px] text-slate-300">Direct Bank Transfer ({paymentDate})</div>
                      </div>
                      <div className="text-xl sm:text-2xl font-extrabold font-mono text-white">
                        {formatCurrency(calculated.netSalary, currencySymbol)}
                      </div>
                    </div>
                  );

                case 'ytd_summary':
                  return template.showYtd ? (
                    <div key={secId} className={`rounded-xl bg-slate-50 border border-slate-200 grid gap-2 mb-5 ${viewportMode === 'mobile' ? 'grid-cols-1 p-2.5 text-[10px]' : 'grid-cols-3 gap-3 p-3.5 text-[11px]'}`}>
                      <div className="flex justify-between sm:block">
                        <div className="text-slate-400 font-semibold uppercase text-[9px] sm:text-[10px]">YTD Gross</div>
                        <div className="font-bold font-mono text-slate-900 sm:mt-0.5">{formatCurrency(calculated.updatedYtd.ytdGrossEarnings, currencySymbol)}</div>
                      </div>
                      <div className="flex justify-between sm:block">
                        <div className="text-slate-400 font-semibold uppercase text-[9px] sm:text-[10px]">YTD Tax</div>
                        <div className="font-bold font-mono text-slate-900 sm:mt-0.5">{formatCurrency(calculated.updatedYtd.ytdTaxPaid, currencySymbol)}</div>
                      </div>
                      <div className="flex justify-between sm:block">
                        <div className="text-slate-400 font-semibold uppercase text-[9px] sm:text-[10px]">YTD Net Pay</div>
                        <div className="font-extrabold font-mono text-emerald-700 sm:mt-0.5">{formatCurrency(calculated.updatedYtd.ytdNetSalary, currencySymbol)}</div>
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

      {/* FULL SCREEN PREVIEW MODAL */}
      {isFullScreenPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-start p-4 sm:p-8 overflow-y-auto animate-fade-in">
          
          {/* Top Modal Controls */}
          <div className="no-print w-full max-w-4xl flex items-center justify-between bg-white/10 p-4 rounded-2xl backdrop-blur-lg border border-white/10 text-white mb-6">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-400" />
              <span className="font-bold text-sm tracking-tight">Full Document View</span>
              <span className="text-xs text-slate-300 font-mono">({salaryMonth} {salaryYear})</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/10"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{isGeneratingPdf ? 'Exporting...' : 'Download PDF'}</span>
              </button>

              <button
                onClick={() => setIsFullScreenPreview(false)}
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all text-xs font-bold flex items-center gap-1"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Full Screen Printable Canvas */}
          <div
            className="printable-document bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-xl w-[210mm] min-h-[297mm] mb-8"
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
                        <div className="flex justify-between"><span className="text-slate-500 font-semibold">Paid Leave:</span> <span className="font-mono text-emerald-700 font-bold">{attendance.paidLeave || 0} days</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-semibold">Unpaid Absences:</span> <span>{attendance.unpaidLeave} days</span></div>
                      </div>
                    </div>
                  );

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
      )}

    </div>
  );
};
