import { Company, Employee, Payslip, PayslipTemplate, AuditLog } from '../types/payslip';
import { DEFAULT_TEMPLATES } from './templates';
import { calculateSalary } from './calculator';

const STORAGE_KEYS = {
  COMPANY: 'payslip_app_company',
  EMPLOYEES: 'payslip_app_employees',
  PAYSLIPS: 'payslip_app_payslips',
  TEMPLATES: 'payslip_app_templates',
  AUDIT_LOGS: 'payslip_app_audit_logs',
};

export const INITIAL_COMPANY: Company = {
  id: 'comp_001',
  name: 'Acme Global Technologies Inc.',
  logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
  address: '100 Innovation Way, Tech Park, Suite 400',
  city: 'San Francisco',
  state: 'CA',
  country: 'United States',
  postalCode: '94105',
  phone: '+1 (555) 234-5678',
  email: 'payroll@acmeglobal.com',
  website: 'www.acmeglobal.com',
  registrationNumber: 'REG-2024-998877',
  taxPanVatNumber: 'TAX-US-9948201',
  employerIdNumber: 'EIN-12-3456789',
  bankName: 'Silicon Valley Commercial Bank',
  accountNumber: '•••• •••• 8842',
  ifscIban: 'SVCB0001928',
  branch: 'Financial District Branch',
  authorizedPersonName: 'Sarah Jenkins',
  authorizedPersonDesignation: 'Head of Human Resources',
  signatureUrl: '',
  stampUrl: '',
  customFields: {
    'Cost Center': 'CC-TECH-90',
    'ISO Cert': 'ISO-9001:2015',
  },
};

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'EMP-101',
    fullName: 'Alexander Wright',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    dob: '1992-05-14',
    gender: 'Male',
    nationality: 'American',
    address: '742 Evergreen Terrace, San Francisco, CA',
    phone: '+1 (555) 432-1098',
    email: 'alexander.wright@acmeglobal.com',
    department: 'Engineering',
    designation: 'Senior Principal Engineer',
    employmentType: 'full_time',
    joiningDate: '2021-03-15',
    workLocation: 'HQ - San Francisco',
    costCenter: 'CC-ENGINEERING',
    reportingManager: 'David Sterling (VP Engineering)',
    bankName: 'JPMorgan Chase Bank',
    bankAccountNumber: '987654321045',
    branch: 'Market St Branch',
    taxPanNumber: 'PAN-AW-99201',
    socialSecurityNumber: 'SSN-XXX-XX-9812',
    basicSalary: 8500,
  },
  {
    id: 'EMP-102',
    fullName: 'Sophia Martinez',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    dob: '1995-11-20',
    gender: 'Female',
    nationality: 'American',
    address: '1204 Pine Street, San Jose, CA',
    phone: '+1 (555) 876-5432',
    email: 'sophia.martinez@acmeglobal.com',
    department: 'Product & Design',
    designation: 'Lead UI/UX Designer',
    employmentType: 'full_time',
    joiningDate: '2022-07-01',
    workLocation: 'Remote - USA',
    costCenter: 'CC-PRODUCT',
    reportingManager: 'Sarah Jenkins',
    bankName: 'Bank of America',
    bankAccountNumber: '456789123089',
    branch: 'Silicon Valley Branch',
    taxPanNumber: 'PAN-SM-44102',
    socialSecurityNumber: 'SSN-XXX-XX-4419',
    basicSalary: 7200,
  },
  {
    id: 'EMP-103',
    fullName: 'Marcus Vance',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    dob: '1988-08-05',
    gender: 'Male',
    nationality: 'British',
    address: '45 Kensington Avenue, London, UK',
    phone: '+44 20 7946 0912',
    email: 'marcus.vance@acmeglobal.com',
    department: 'Sales & Marketing',
    designation: 'Global Account Director',
    employmentType: 'contract',
    joiningDate: '2023-01-10',
    workLocation: 'London Office',
    costCenter: 'CC-SALES',
    reportingManager: 'Elena Rostova',
    bankName: 'HSBC UK',
    bankAccountNumber: '778899112233',
    branch: 'City of London Branch',
    taxPanNumber: 'UK-NINO-QQ123456C',
    basicSalary: 6800,
  },
];

export function getCompanyStorage(): Company {
  if (typeof window === 'undefined') return INITIAL_COMPANY;
  const stored = localStorage.getItem(STORAGE_KEYS.COMPANY);
  return stored ? JSON.parse(stored) : INITIAL_COMPANY;
}

export function saveCompanyStorage(company: Company): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(company));
}

export function getEmployeesStorage(): Employee[] {
  if (typeof window === 'undefined') return INITIAL_EMPLOYEES;
  const stored = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
  return stored ? JSON.parse(stored) : INITIAL_EMPLOYEES;
}

export function saveEmployeesStorage(employees: Employee[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
}

export function getTemplatesStorage(): PayslipTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_TEMPLATES;
  const stored = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
  return stored ? JSON.parse(stored) : DEFAULT_TEMPLATES;
}

export function saveTemplatesStorage(templates: PayslipTemplate[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
}

export function getAuditLogsStorage(): AuditLog[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
  return stored ? JSON.parse(stored) : [];
}

export function saveAuditLogStorage(log: AuditLog): void {
  if (typeof window === 'undefined') return;
  const current = getAuditLogsStorage();
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([log, ...current]));
}

export function getPayslipsStorage(): Payslip[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.PAYSLIPS);
  if (stored) return JSON.parse(stored);

  // Generate Initial Seed Payslip for DEMO
  const company = INITIAL_COMPANY;
  const emp = INITIAL_EMPLOYEES[0];

  const attendance = {
    calendarDays: 31,
    workingDays: 22,
    presentDays: 22,
    absentDays: 0,
    paidLeave: 0,
    unpaidLeave: 0,
    sickLeave: 0,
    annualLeave: 0,
    publicHolidays: 0,
    overtimeHours: 8,
    lateArrivals: 0,
    earlyDepartures: 0,
    autoDeductUnpaidAbsence: true,
  };

  const earnings = [
    { id: '1', name: 'House Rent Allowance (HRA)', amount: 2500, calculationType: 'fixed' as const, isTaxable: true, isFixed: true },
    { id: '2', name: 'Transport Allowance', amount: 800, calculationType: 'fixed' as const, isTaxable: true, isFixed: true },
    { id: '3', name: 'Medical Allowance', amount: 500, calculationType: 'fixed' as const, isTaxable: false, isFixed: true },
    { id: '4', name: 'Special Allowance', amount: 1200, calculationType: 'fixed' as const, isTaxable: true, isFixed: true },
    { id: '5', name: 'Performance Bonus', amount: 1500, calculationType: 'fixed' as const, isTaxable: true, isFixed: false },
    { id: '6', name: 'Overtime Pay (8 hrs)', amount: 650, calculationType: 'fixed' as const, isTaxable: true, isFixed: false },
  ];

  const deductions = [
    { id: 'd1', name: 'Federal Income Tax', amount: 1850, calculationMethod: 'fixed' as const, description: 'Statutory income tax deduction' },
    { id: 'd2', name: 'Employee Provident Fund (EPF)', amount: 1020, calculationMethod: 'percentage_of_basic' as const, rateOrPercentage: 12, description: '12% of basic' },
    { id: 'd3', name: 'Social Security Contribution', amount: 527, calculationMethod: 'percentage_of_gross' as const, rateOrPercentage: 3.5 },
    { id: 'd4', name: 'Health & Dental Insurance', amount: 350, calculationMethod: 'fixed' as const },
  ];

  const taxConfig = {
    countryRegion: 'US' as const,
    taxableEarnings: 14450,
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
  };

  const calculated = calculateSalary({
    basicSalary: emp.basicSalary,
    earnings,
    deductions,
    attendance,
    taxConfig,
  });

  const seedPayslip: Payslip = {
    id: 'ps_seed_001',
    payslipNumber: 'PS-2026-00001',
    verificationCode: 'A8K7X2',
    salaryMonth: 'August',
    salaryYear: 2026,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    paymentDate: '2026-08-31',
    payFrequency: 'monthly',
    employeeId: emp.id,
    employeeData: emp,
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
      paymentMethod: 'bank_transfer',
      paymentDate: '2026-08-31',
      bankName: emp.bankName,
      accountNumber: `•••• ${emp.bankAccountNumber.slice(-4)}`,
      transactionRef: 'TXN-9988221045',
      paymentStatus: 'processed',
    },
    templateId: 'tpl_standard',
    status: 'approved',
    version: 1,
    notes: 'Standard August 2026 Payroll Statement',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const initialList = [seedPayslip];
  savePayslipsStorage(initialList);
  return initialList;
}

export function savePayslipsStorage(payslips: Payslip[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PAYSLIPS, JSON.stringify(payslips));
}
