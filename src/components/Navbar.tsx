'use client';

import React from 'react';
import { 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Users, 
  Sliders, 
  CheckCircle2,
  Lock,
  Zap,
  ArrowRight,
  FileUp
} from 'lucide-react';

interface NavbarProps {
  activeTab?: 'studio' | 'importer' | 'employees';
  onTabChange?: (tab: 'studio' | 'importer' | 'employees') => void;
  onOpenVerification: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab = 'studio', 
  onTabChange, 
  onOpenVerification 
}) => {
  return (
    <header className="no-print sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <FileText className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">PaySlip<span className="text-indigo-600">Studio</span></span>
                <span className="hidden sm:inline-flex text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Free & Open
                </span>
              </div>
              <p className="hidden xs:block text-[11px] text-slate-500 font-medium">Professional Payslip Generator & Payroll Manager</p>
            </div>
          </div>

          {/* Navigation Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs font-bold">
            <button
              onClick={() => onTabChange?.('studio')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'studio'
                  ? 'bg-white text-indigo-600 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Studio</span>
            </button>

            <button
              onClick={() => onTabChange?.('importer')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'importer'
                  ? 'bg-white text-indigo-600 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Import PDF</span>
            </button>

            <button
              onClick={() => onTabChange?.('employees')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'employees'
                  ? 'bg-white text-indigo-600 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Directory</span>
            </button>
          </div>

          {/* Verification Code Trigger & Quick Badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenVerification}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all border border-slate-200/80 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Verify Code</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
