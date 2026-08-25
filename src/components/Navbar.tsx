'use client';

import React from 'react';
import { 
  Building2, 
  Users, 
  FileText, 
  Layout, 
  ShieldCheck, 
  History, 
  UserCheck, 
  PlusCircle, 
  Play, 
  Layers,
  Sparkles,
  Menu,
  X,
  CreditCard
} from 'lucide-react';
import { UserRole } from '../types/payslip';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  onOpenQuickCreate: () => void;
  onOpenRunPayroll: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole,
  onOpenQuickCreate,
  onOpenRunPayroll,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layout, roles: ['super_admin', 'hr_admin', 'accountant', 'employee'] },
    { id: 'company', label: 'Company Profile', icon: Building2, roles: ['super_admin', 'hr_admin'] },
    { id: 'employees', label: 'Employees', icon: Users, roles: ['super_admin', 'hr_admin', 'accountant'] },
    { id: 'payroll_wizard', label: 'Run Payroll', icon: Play, roles: ['super_admin', 'hr_admin', 'accountant'] },
    { id: 'payslips', label: 'All Payslips', icon: FileText, roles: ['super_admin', 'hr_admin', 'accountant', 'employee'] },
    { id: 'template_editor', label: 'Template Editor', icon: Layers, roles: ['super_admin', 'hr_admin'] },
    { id: 'batch_export', label: 'Bulk Run', icon: CreditCard, roles: ['super_admin', 'hr_admin', 'accountant'] },
    { id: 'verification', label: 'Verify Code', icon: ShieldCheck, roles: ['super_admin', 'hr_admin', 'accountant', 'employee'] },
    { id: 'audit_logs', label: 'Audit Logs', icon: History, roles: ['super_admin', 'hr_admin', 'accountant'] },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(currentRole));

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <FileText className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-lg">PaySlip</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" /> Pro Edition
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Enterprise Payroll & Template Engine</p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Role Switcher & Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Role Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <UserCheck className="w-4 h-4 text-slate-500 ml-2" />
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer py-1 pr-2"
              >
                <option value="super_admin">Super Admin</option>
                <option value="hr_admin">HR Admin</option>
                <option value="accountant">Accountant</option>
                <option value="employee">Employee View</option>
              </select>
            </div>

            {/* Quick Action Buttons */}
            {currentRole !== 'employee' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenRunPayroll}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all shadow-sm active:scale-[0.98]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Payroll</span>
                </button>
                <button
                  onClick={onOpenQuickCreate}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all active:scale-[0.98]"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Quick Payslip</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2">
          <div className="mb-3 pt-2 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role Switcher</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as UserRole)}
              className="bg-slate-100 text-xs font-semibold text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              <option value="super_admin">Super Admin</option>
              <option value="hr_admin">HR Admin</option>
              <option value="accountant">Accountant</option>
              <option value="employee">Employee View</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium ${
                    isActive ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {currentRole !== 'employee' && (
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  onOpenRunPayroll();
                  setMobileMenuOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Payroll</span>
              </button>
              <button
                onClick={() => {
                  onOpenQuickCreate();
                  setMobileMenuOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Quick Payslip</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
