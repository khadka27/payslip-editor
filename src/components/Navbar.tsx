'use client';

import React from 'react';
import { 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Download, 
  Layers, 
  CheckCircle2 
} from 'lucide-react';

interface NavbarProps {
  onOpenVerification: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenVerification }) => {
  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <FileText className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-lg">PaySlip Studio</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Free Online Editor
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Instant Payslip Generator & Custom Template Engine</p>
            </div>
          </div>

          {/* Quick Verification Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenVerification}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verify Code</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
