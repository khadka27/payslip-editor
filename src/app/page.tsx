'use client';

import React, { useState, useEffect } from 'react';
import { 
  Company, 
  Employee, 
  Payslip, 
  PayslipTemplate, 
  AuditLog, 
  UserRole, 
  PayslipStatus 
} from '../types/payslip';
import { 
  getCompanyStorage, 
  saveCompanyStorage, 
  getEmployeesStorage, 
  saveEmployeesStorage, 
  getPayslipsStorage, 
  savePayslipsStorage, 
  getTemplatesStorage, 
  saveTemplatesStorage, 
  getAuditLogsStorage, 
  saveAuditLogStorage 
} from '../lib/storage';

import { Navbar } from '../components/Navbar';
import { Dashboard } from '../components/Dashboard';
import { CompanySettings } from '../components/CompanySettings';
import { EmployeeManager } from '../components/EmployeeManager';
import { PayrollWizard } from '../components/PayrollWizard';
import { PayslipEditor } from '../components/PayslipEditor';
import { PayslipViewer } from '../components/PayslipViewer';
import { AllPayslipsView } from '../components/AllPayslipsView';
import { VerificationView } from '../components/VerificationView';
import { AuditLogView } from '../components/AuditLogView';
import { EmployeePortal } from '../components/EmployeePortal';
import { BatchGenerator } from '../components/BatchGenerator';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('super_admin');

  // Core App State
  const [company, setCompany] = useState<Company>(getCompanyStorage());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [templates, setTemplates] = useState<PayslipTemplate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Active View Target
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [verificationCodeQuery, setVerificationCodeQuery] = useState('');

  // Initial Load & Persistence
  useEffect(() => {
    setCompany(getCompanyStorage());
    setEmployees(getEmployeesStorage());
    const initialPayslips = getPayslipsStorage();
    setPayslips(initialPayslips);
    setTemplates(getTemplatesStorage());
    setAuditLogs(getAuditLogsStorage());

    // Check URL parameters for ?verify=CODE
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const verifyParam = urlParams.get('verify');
      if (verifyParam) {
        setVerificationCodeQuery(verifyParam);
        setActiveTab('verification');
      }
    }

    setIsLoaded(true);
  }, []);

  // Handlers for state updates with localStorage sync
  const handleSaveCompany = (updated: Company) => {
    setCompany(updated);
    saveCompanyStorage(updated);
    addAuditLog('System', 'Updated Company Profile & Branding Info');
  };

  const handleSaveEmployees = (updated: Employee[]) => {
    setEmployees(updated);
    saveEmployeesStorage(updated);
    addAuditLog('HR Manager', `Updated Employee Directory (Total: ${updated.length})`);
  };

  const handlePayslipCreated = (newPayslip: Payslip) => {
    const updated = [newPayslip, ...payslips];
    setPayslips(updated);
    savePayslipsStorage(updated);
    setSelectedPayslip(newPayslip);

    addAuditLog(
      currentRole,
      `Created Payslip ${newPayslip.payslipNumber} for ${newPayslip.employeeData.fullName}`,
      newPayslip.id,
      newPayslip.payslipNumber,
      `Initial version created with net salary ${newPayslip.netSalary}`
    );
  };

  const handleBatchCreated = (newBatch: Payslip[]) => {
    const updated = [...newBatch, ...payslips];
    setPayslips(updated);
    savePayslipsStorage(updated);
    addAuditLog(currentRole, `Run Bulk Payroll Batch: Generated ${newBatch.length} payslips`);
  };

  const handleUpdatePayslipStatus = (id: string, newStatus: PayslipStatus) => {
    const updated = payslips.map((p) => {
      if (p.id === id) {
        const prevStatus = p.status;
        const newVersion = p.version + 1;
        const updatedPs = { ...p, status: newStatus, version: newVersion, updatedAt: new Date().toISOString() };
        
        addAuditLog(
          currentRole,
          `Status changed to ${newStatus}`,
          id,
          p.payslipNumber,
          `Previous status: ${prevStatus} -> ${newStatus}`,
          newVersion
        );
        return updatedPs;
      }
      return p;
    });

    setPayslips(updated);
    savePayslipsStorage(updated);

    if (selectedPayslip && selectedPayslip.id === id) {
      setSelectedPayslip(updated.find((p) => p.id === id) || null);
    }
  };

  const handleDeletePayslip = (id: string) => {
    if (confirm('Are you sure you want to delete this payslip record?')) {
      const target = payslips.find((p) => p.id === id);
      const updated = payslips.filter((p) => p.id !== id);
      setPayslips(updated);
      savePayslipsStorage(updated);

      if (target) {
        addAuditLog(currentRole, `Deleted Payslip ${target.payslipNumber}`, id, target.payslipNumber);
      }
    }
  };

  const handleSaveTemplate = (updatedTpl: PayslipTemplate) => {
    const exists = templates.some((t) => t.id === updatedTpl.id);
    let newTemplates: PayslipTemplate[];
    if (exists) {
      newTemplates = templates.map((t) => (t.id === updatedTpl.id ? updatedTpl : t));
    } else {
      newTemplates = [updatedTpl, ...templates];
    }
    setTemplates(newTemplates);
    saveTemplatesStorage(newTemplates);
    addAuditLog(currentRole, `Updated Payslip Template: ${updatedTpl.name}`);
  };

  const addAuditLog = (
    performer: string,
    action: string,
    payslipId: string = 'N/A',
    payslipNumber: string = 'N/A',
    reason?: string,
    version: number = 1
  ) => {
    const log: AuditLog = {
      id: `log_${Date.now()}`,
      payslipId,
      payslipNumber,
      performedBy: performer,
      userRole: currentRole,
      action,
      reason,
      timestamp: new Date().toISOString(),
      version,
    };
    const updated = [log, ...auditLogs];
    setAuditLogs(updated);
    saveAuditLogStorage(log);
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
      
      {/* Navigation Header Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedPayslip(null);
          setActiveTab(tab);
        }}
        currentRole={currentRole}
        setCurrentRole={(role) => {
          setCurrentRole(role);
          if (role === 'employee') {
            setActiveTab('employee_portal');
          }
        }}
        onOpenQuickCreate={() => {
          setSelectedPayslip(null);
          setActiveTab('payroll_wizard');
        }}
        onOpenRunPayroll={() => {
          setSelectedPayslip(null);
          setActiveTab('payroll_wizard');
        }}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW 1: Individual Payslip Viewer (Triggered when selecting a payslip) */}
        {selectedPayslip ? (
          <PayslipViewer
            payslip={selectedPayslip}
            template={templates.find((t) => t.id === selectedPayslip.templateId) || templates[0]}
            onBack={() => setSelectedPayslip(null)}
            onUpdateStatus={handleUpdatePayslipStatus}
            onVerifyLookup={(code) => {
              setVerificationCodeQuery(code);
              setSelectedPayslip(null);
              setActiveTab('verification');
            }}
          />
        ) : (
          <>
            {/* VIEW 2: Dashboard */}
            {activeTab === 'dashboard' && (
              <Dashboard
                company={company}
                employees={employees}
                payslips={payslips}
                templates={templates}
                onNavigate={(tab) => setActiveTab(tab)}
                onSelectPayslip={(ps) => setSelectedPayslip(ps)}
              />
            )}

            {/* VIEW 3: Company Setup */}
            {activeTab === 'company' && (
              <CompanySettings company={company} onSave={handleSaveCompany} />
            )}

            {/* VIEW 4: Employees Directory */}
            {activeTab === 'employees' && (
              <EmployeeManager employees={employees} onSaveEmployees={handleSaveEmployees} />
            )}

            {/* VIEW 5: Payroll Run Wizard */}
            {activeTab === 'payroll_wizard' && (
              <PayrollWizard
                company={company}
                employees={employees}
                currentRole={currentRole}
                onPayslipCreated={handlePayslipCreated}
                onNavigateToViewer={(ps) => setSelectedPayslip(ps)}
              />
            )}

            {/* VIEW 6: Payslip Template Studio */}
            {activeTab === 'template_editor' && (
              <PayslipEditor
                templates={templates}
                activeTemplate={templates[0]}
                onSaveTemplate={handleSaveTemplate}
                onSelectTemplate={() => {}}
              />
            )}

            {/* VIEW 7: All Payslips Records */}
            {activeTab === 'payslips' && (
              <AllPayslipsView
                payslips={payslips}
                onSelectPayslip={(ps) => setSelectedPayslip(ps)}
                onDeletePayslip={handleDeletePayslip}
                onOpenWizard={() => setActiveTab('payroll_wizard')}
              />
            )}

            {/* VIEW 8: Bulk ZIP Export */}
            {activeTab === 'batch_export' && (
              <BatchGenerator
                company={company}
                employees={employees}
                onBatchCreated={handleBatchCreated}
                onNavigateToAll={() => setActiveTab('payslips')}
              />
            )}

            {/* VIEW 9: Public Authenticity Verification */}
            {activeTab === 'verification' && (
              <VerificationView
                payslips={payslips}
                initialCode={verificationCodeQuery}
                onSelectPayslip={(ps) => setSelectedPayslip(ps)}
              />
            )}

            {/* VIEW 10: Audit Trail & Logs */}
            {activeTab === 'audit_logs' && (
              <AuditLogView logs={auditLogs} />
            )}

            {/* VIEW 11: Employee Self-Service Portal */}
            {activeTab === 'employee_portal' && (
              <EmployeePortal
                employee={employees[0]}
                payslips={payslips}
                onSelectPayslip={(ps) => setSelectedPayslip(ps)}
              />
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-bold text-slate-700">PaySlip Editor & Generator</span> — Professional Payroll System
          </div>
          <div>
            Built with Next.js, Tailwind CSS & TypeScript • Clean Light Theme
          </div>
        </div>
      </footer>

    </div>
  );
}
