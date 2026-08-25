'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { PayslipStudio } from '../components/PayslipStudio';
import { VerificationView } from '../components/VerificationView';
import { getPayslipsStorage } from '../lib/storage';
import { Payslip } from '../types/payslip';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [payslips, setPayslips] = useState<Payslip[]>([]);

  useEffect(() => {
    setPayslips(getPayslipsStorage());
    
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

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Header */}
      <Navbar onOpenVerification={() => setIsVerificationModalOpen(true)} />

      {/* Main Payslip Studio Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PayslipStudio
          onOpenVerification={(code) => {
            setVerificationCode(code);
            setIsVerificationModalOpen(true);
          }}
        />
      </main>

      {/* Verification Lookup Modal */}
      {isVerificationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative animate-scale-up">
            <button
              onClick={() => setIsVerificationModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
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

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-bold text-slate-700">PaySlip Studio</span> — Free Online Payslip Editor & Generator
          </div>
          <div>
            100% Free & Open • Unlimited PDF Exports • No Account Required
          </div>
        </div>
      </footer>

    </div>
  );
}
