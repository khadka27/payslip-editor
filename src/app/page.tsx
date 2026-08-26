'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { PayslipStudio } from '../components/PayslipStudio';
import { EmployeeManager } from '../components/EmployeeManager';
import { PdfImporter } from '../components/PdfImporter';
import { VerificationView } from '../components/VerificationView';
import { getPayslipsStorage, saveEmployeesStorage, getEmployeesStorage } from '../lib/storage';
import { Payslip, Employee } from '../types/payslip';
import { 
  Sparkles, 
  Lock, 
  Zap, 
  ShieldCheck, 
  FileCheck2, 
  Building2, 
  Users, 
  Download, 
  Check, 
  Globe,
  Sliders
} from 'lucide-react';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'studio' | 'importer' | 'employees'>('studio');
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    setPayslips(getPayslipsStorage());
    setEmployees(getEmployeesStorage());
    
    // Check URL parameters for ?verify=CODE
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const verifyParam = urlParams.get('verify');
      if (verifyParam) {
        setVerificationCode(verifyParam);
        setIsVerificationModalOpen(true);
      }
    }
    
    setIsLoaded(true);
  }, []);

  const handleSaveEmployees = (updated: Employee[]) => {
    setEmployees(updated);
    saveEmployeesStorage(updated);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Handcrafted Header Navigation */}
      <Navbar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenVerification={() => setIsVerificationModalOpen(true)} 
      />

      {/* Modern Hero Section */}
      <div className="no-print bg-gradient-to-b from-white via-slate-50 to-slate-100/70 border-b border-slate-200/80 pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                <span>Next-Gen Enterprise Payslip Generator</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Create & Customize Professional <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Employee Payslips</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Design high-definition 300 DPI PDF payslips with automatic tax calculations, custom company logos, verification QR codes, and custom section reordering.
              </p>
            </div>

            {/* Feature Badges Grid */}
            <div className="grid grid-cols-2 gap-2.5 w-full md:w-auto text-xs font-semibold shrink-0">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 text-[11px]">100% Private</div>
                  <div className="text-[10px] text-slate-500 font-normal">Client-Side Storage</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 text-[11px]">Instant Export</div>
                  <div className="text-[10px] text-slate-500 font-normal">300 DPI High-Res PDF</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 text-[11px]">Auto Fetch</div>
                  <div className="text-[10px] text-slate-500 font-normal">Website Domain Logos</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <FileCheck2 className="w-4 h-4 text-violet-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 text-[11px]">10+ Fonts</div>
                  <div className="text-[10px] text-slate-500 font-normal">Custom Design Themes</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Studio & Management Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'studio' ? (
          <PayslipStudio
            onOpenVerification={(code) => {
              setVerificationCode(code);
              setIsVerificationModalOpen(true);
            }}
          />
        ) : activeTab === 'importer' ? (
          <PdfImporter />
        ) : (
          <EmployeeManager
            employees={employees}
            onSaveEmployees={handleSaveEmployees}
          />
        )}
      </main>

      {/* Verification Lookup Modal */}
      {isVerificationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative animate-scale-up">
            <button
              onClick={() => setIsVerificationModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xs font-bold p-1.5 rounded-lg hover:bg-slate-100"
            >
              ✕ Close
            </button>

            <VerificationView
              payslips={payslips}
              initialCode={verificationCode}
            />
          </div>
        </div>
      )}

      {/* Premium Handcrafted Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-10 mt-16 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-base">PaySlip<span className="text-indigo-600">Studio</span></span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                v2.5 Release
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Professional, free, open-source online payslip editor and generator. Design, edit, and export compliance-ready employee salary slips with zero account registration or server data retention.
            </p>
            <div className="text-[11px] text-slate-400 font-medium">
              © {new Date().getFullYear()} PaySlip Studio. Built with React, Next.js & Tailwind CSS.
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Features & Capabilities</h4>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> 10+ Professional Font Families</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Domain Auto Logo Fetcher</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Drag & Drop Section Reorder</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Paid & Unpaid Absence Deduction</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Privacy & Security</h4>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> 100% In-Browser Computation</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Dynamic Verification QR Codes</li>
              <li className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Direct 300 DPI PDF Exports</li>
              <li className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> CSV Employee Bulk Import</li>
            </ul>
          </div>

        </div>
      </footer>

    </div>
  );
}
