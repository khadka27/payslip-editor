'use client';

import React, { useRef, useState, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Building2, 
  User, 
  Calendar, 
  DollarSign, 
  ArrowLeft,
  Share2,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Payslip, PayslipTemplate, PayslipStatus } from '../types/payslip';
import { formatCurrency } from '../lib/calculator';

interface PayslipViewerProps {
  payslip: Payslip;
  template?: PayslipTemplate;
  onBack: () => void;
  onUpdateStatus: (id: string, newStatus: PayslipStatus) => void;
  onVerifyLookup: (code: string) => void;
}

export const PayslipViewer: React.FC<PayslipViewerProps> = ({
  payslip,
  template,
  onBack,
  onUpdateStatus,
  onVerifyLookup,
}) => {
  const payslipRef = useRef<HTMLDivElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [viewportMode, setViewportMode] = useState<'a4' | 'letter' | 'mobile'>('a4');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Generate QR Code dynamically
  useEffect(() => {
    const verifyUrl = `${window.location.origin}?verify=${payslip.verificationCode}`;
    QRCode.toDataURL(verifyUrl, { width: 120, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } })
      .then((url: string) => setQrCodeDataUrl(url))
      .catch((err: unknown) => console.error(err));
  }, [payslip.verificationCode]);

  // Handle PDF Export
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
      pdf.save(`Payslip_${payslip.employeeData.fullName.replace(/\s+/g, '_')}_${payslip.salaryMonth}_${payslip.salaryYear}.pdf`);
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('Error generating PDF. Using standard print fallback...');
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isLocked = payslip.status === 'locked' || payslip.status === 'published';
  const isApproved = payslip.status === 'approved' || isLocked;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Viewport Control & Actions Bar (Hidden during window.print()) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 font-mono">{payslip.payslipNumber}</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isLocked ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : isApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {isLocked ? <Lock className="w-3 h-3" /> : isApproved ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {payslip.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Period: {payslip.salaryMonth} {payslip.salaryYear} • Employee: {payslip.employeeData.fullName}</p>
          </div>
        </div>

        {/* Viewport Toggles & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Viewport Mode */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewportMode('a4')}
              className={`px-3 py-1 rounded-lg transition-all ${viewportMode === 'a4' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
            >
              A4
            </button>
            <button
              onClick={() => setViewportMode('letter')}
              className={`px-3 py-1 rounded-lg transition-all ${viewportMode === 'letter' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
            >
              Letter
            </button>
            <button
              onClick={() => setViewportMode('mobile')}
              className={`px-3 py-1 rounded-lg transition-all ${viewportMode === 'mobile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
            >
              Mobile
            </button>
          </div>

          {/* Workflow Status Change Selector */}
          {!isLocked && (
            <select
              value={payslip.status}
              onChange={(e) => onUpdateStatus(payslip.id, e.target.value as PayslipStatus)}
              className="text-xs font-semibold p-2 rounded-xl border border-slate-300 bg-white outline-none cursor-pointer"
            >
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
              <option value="locked">Lock Document</option>
            </select>
          )}

          {/* Print & PDF Buttons */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
        </div>

      </div>

      {/* Main Document Render Area */}
      <div className="flex justify-center bg-slate-200/70 p-4 sm:p-8 rounded-2xl border border-slate-300/80 overflow-auto">
        
        {/* Printable Payslip Card */}
        <div
          ref={payslipRef}
          className={`printable-document bg-white text-slate-900 p-8 sm:p-12 shadow-2xl transition-all ${
            viewportMode === 'mobile' ? 'w-[380px]' : viewportMode === 'letter' ? 'w-[8.5in] min-h-[11in]' : 'w-[210mm] min-h-[297mm]'
          }`}
          style={{ fontFamily: template?.fontFamily || 'Inter, sans-serif' }}
        >
          
          {/* Header Banner */}
          <div className="flex items-start justify-between border-b-2 border-indigo-600 pb-6 mb-6">
            <div className="space-y-1">
              {payslip.companyData.logoUrl ? (
                <img src={payslip.companyData.logoUrl} alt="Logo" className="h-12 max-w-[180px] object-contain mb-2" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-lg">
                  {payslip.companyData.name.charAt(0)}
                </div>
              )}
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{payslip.companyData.name}</h1>
              <p className="text-[11px] text-slate-500 max-w-sm">{payslip.companyData.address}, {payslip.companyData.city}, {payslip.companyData.country}</p>
              <p className="text-[10px] text-slate-400 font-mono">
                Reg: {payslip.companyData.registrationNumber} • Tax ID: {payslip.companyData.taxPanVatNumber}
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block px-3 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider border border-indigo-200">
                PAYSLIP STATEMENT
              </span>
              <div className="text-base font-extrabold font-mono text-slate-900 mt-2">{payslip.payslipNumber}</div>
              <div className="text-[11px] font-semibold text-slate-600">{payslip.salaryMonth} {payslip.salaryYear}</div>
              <div className="text-[10px] text-slate-400">Pay Date: {payslip.paymentDate}</div>
            </div>
          </div>

          {/* Employee & Pay Period Details Grid */}
          <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-6">
            <div className="space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Employee Name:</span> <strong className="text-slate-900">{payslip.employeeData.fullName}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Employee ID:</span> <span className="font-mono font-bold">{payslip.employeeData.id}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Designation:</span> <span>{payslip.employeeData.designation}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Department:</span> <span>{payslip.employeeData.department}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Date of Joining:</span> <span>{payslip.employeeData.joiningDate}</span></div>
            </div>

            <div className="space-y-1.5 border-l border-slate-200 pl-6">
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Bank Name:</span> <span>{payslip.employeeData.bankName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Account Number:</span> <span className="font-mono">{payslip.paymentInfo.accountNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Tax / PAN ID:</span> <span className="font-mono">{payslip.employeeData.taxPanNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Working Days:</span> <span>{payslip.attendance.workingDays} / Present: {payslip.attendance.presentDays}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Unpaid Absences:</span> <span>{payslip.attendance.unpaidLeave} days</span></div>
            </div>
          </div>

          {/* Itemized Earnings & Deductions Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs mb-6">
            <div className="grid grid-cols-2 bg-slate-900 text-white font-bold py-2.5 px-4 text-[11px] uppercase tracking-wider">
              <span>Earnings Component</span>
              <span className="border-l border-slate-700 pl-4">Deductions Component</span>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-200">
              
              {/* Earnings Column */}
              <div className="p-4 space-y-2">
                <div className="flex justify-between font-bold text-slate-900 border-b border-slate-100 pb-1">
                  <span>Basic Salary</span>
                  <span className="font-mono">{formatCurrency(payslip.basicSalary)}</span>
                </div>
                {payslip.earnings.map((e) => (
                  <div key={e.id} className="flex justify-between text-slate-700">
                    <span>{e.name}</span>
                    <span className="font-mono">{formatCurrency(e.amount)}</span>
                  </div>
                ))}
              </div>

              {/* Deductions Column */}
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-rose-700 font-semibold border-b border-slate-100 pb-1">
                  <span>Income Tax Withheld</span>
                  <span className="font-mono">{formatCurrency(payslip.taxAmount)}</span>
                </div>
                {payslip.deductions.map((d) => (
                  <div key={d.id} className="flex justify-between text-slate-700">
                    <span>{d.name}</span>
                    <span className="font-mono text-rose-600">-{formatCurrency(d.amount)}</span>
                  </div>
                ))}
              </div>

            </div>

            {/* Totals Bar */}
            <div className="grid grid-cols-2 bg-slate-100 border-t border-slate-300 font-bold py-2.5 px-4">
              <div className="flex justify-between">
                <span>GROSS EARNINGS</span>
                <span className="font-mono text-emerald-700">{formatCurrency(payslip.grossSalary)}</span>
              </div>
              <div className="flex justify-between border-l border-slate-300 pl-4">
                <span>TOTAL DEDUCTIONS</span>
                <span className="font-mono text-rose-700">-{formatCurrency(payslip.totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* NET SALARY PAYABLE BANNER */}
          <div className="p-5 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-md mb-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">NET PAYABLE AMOUNT</div>
              <div className="text-[11px] text-slate-400">Transferred via {payslip.paymentInfo.paymentMethod.replace('_', ' ')}</div>
            </div>
            <div className="text-2xl font-extrabold font-mono text-emerald-400">
              {formatCurrency(payslip.netSalary)}
            </div>
          </div>

          {/* YTD & Employer Side Contributions */}
          <div className="grid grid-cols-2 gap-4 text-[11px] mb-6">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-700 uppercase">Year-to-Date (YTD) Totals</div>
              <div className="flex justify-between text-slate-600"><span>YTD Gross Earnings:</span> <span className="font-mono font-bold">{formatCurrency(payslip.ytd.ytdGrossEarnings)}</span></div>
              <div className="flex justify-between text-slate-600"><span>YTD Tax Withheld:</span> <span className="font-mono">{formatCurrency(payslip.ytd.ytdTaxPaid)}</span></div>
              <div className="flex justify-between text-slate-600"><span>YTD Net Pay:</span> <span className="font-mono font-bold text-indigo-600">{formatCurrency(payslip.ytd.ytdNetSalary)}</span></div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-700 uppercase">Employer Side Contributions</div>
              <div className="flex justify-between text-slate-600"><span>Employer EPF (12%):</span> <span className="font-mono">{formatCurrency(payslip.employerContributions.epf)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Social Security:</span> <span className="font-mono">{formatCurrency(payslip.employerContributions.socialSecurity)}</span></div>
              <div className="flex justify-between text-slate-600 font-bold border-t border-slate-200 pt-1"><span>Total Side Cost:</span> <span className="font-mono">{formatCurrency(payslip.employerContributions.total)}</span></div>
            </div>
          </div>

          {/* Verification Badge & Signatures */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
            
            {/* QR Code */}
            <div className="flex items-center gap-3">
              {qrCodeDataUrl && (
                <img src={qrCodeDataUrl} alt="Verification QR Code" className="w-16 h-16 border border-slate-200 rounded p-1" />
              )}
              <div className="space-y-0.5">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Scan to Verify</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500">Code: <strong>{payslip.verificationCode}</strong></div>
                <button
                  onClick={() => onVerifyLookup(payslip.verificationCode)}
                  className="no-print text-[10px] text-indigo-600 underline font-semibold"
                >
                  Verify Authenticity
                </button>
              </div>
            </div>

            {/* Signature */}
            <div className="text-right space-y-1">
              <div className="font-bold text-slate-900">{payslip.companyData.authorizedPersonName}</div>
              <div className="text-[11px] text-slate-500">{payslip.companyData.authorizedPersonDesignation}</div>
              <div className="text-[9px] text-slate-400">Digitally Verified & Approved</div>
            </div>

          </div>

          {/* Footer Notes */}
          <div className="mt-6 pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center">
            This is an official computer-generated payroll record issued by {payslip.companyData.name}.
          </div>

        </div>

      </div>

    </div>
  );
};
