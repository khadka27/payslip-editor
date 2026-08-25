export type UserRole = 'super_admin' | 'hr_admin' | 'accountant' | 'employee';

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'temporary';

export type PayFrequency = 'monthly' | 'weekly' | 'biweekly' | 'daily';

export type PayslipStatus = 'draft' | 'pending_review' | 'approved' | 'published' | 'locked' | 'cancelled';

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  registrationNumber: string;
  taxPanVatNumber: string;
  employerIdNumber: string;
  bankName: string;
  accountNumber: string;
  ifscIban: string;
  branch: string;
  authorizedPersonName: string;
  authorizedPersonDesignation: string;
  signatureUrl?: string;
  stampUrl?: string;
  customFields?: Record<string, string>;
}

export interface Employee {
  id: string; // e.g. EMP-101
  fullName: string;
  photoUrl?: string;
  parentName?: string;
  dob: string;
  gender?: string;
  nationality: string;
  address: string;
  phone: string;
  email: string;
  department: string;
  designation: string;
  employmentType: EmploymentType;
  joiningDate: string;
  confirmationDate?: string;
  workLocation: string;
  costCenter?: string;
  reportingManager?: string;
  bankName: string;
  bankAccountNumber: string;
  branch: string;
  ifscCode?: string;
  taxPanNumber: string;
  socialSecurityNumber?: string;
  basicSalary: number;
  customFields?: Record<string, string>;
}

export interface EarningComponent {
  id: string;
  name: string;
  amount: number;
  calculationType: 'fixed' | 'percentage_of_basic' | 'hourly';
  rateOrPercentage?: number;
  isTaxable: boolean;
  isFixed: boolean; // fixed vs variable
  description?: string;
}

export interface DeductionComponent {
  id: string;
  name: string;
  amount: number;
  calculationMethod: 'fixed' | 'percentage_of_gross' | 'percentage_of_basic' | 'formula';
  rateOrPercentage?: number;
  applicablePeriod?: string;
  description?: string;
}

export interface AttendanceRecord {
  calendarDays: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  paidLeave: number;
  unpaidLeave: number;
  sickLeave: number;
  annualLeave: number;
  publicHolidays: number;
  overtimeHours: number;
  lateArrivals: number;
  earlyDepartures: number;
  autoDeductUnpaidAbsence: boolean;
}

export interface TaxBracket {
  minIncome: number;
  maxIncome?: number; // undefined means infinite
  ratePercentage: number;
}

export interface TaxConfig {
  countryRegion: 'US' | 'IN' | 'UK' | 'NP' | 'Custom';
  taxableEarnings: number;
  nonTaxableEarnings: number;
  taxExemption: number;
  taxRelief: number;
  taxDeduction: number;
  customTaxRate?: number;
  useProgressiveSlabs: boolean;
  progressiveSlabs?: TaxBracket[];
}

export interface EmployerContributions {
  epf: number;
  socialSecurity: number;
  healthInsurance: number;
  pension: number;
  employerTax: number;
  other: number;
  total: number;
}

export interface YtdSummary {
  ytdBasicSalary: number;
  ytdAllowances: number;
  ytdBonuses: number;
  ytdOvertime: number;
  ytdGrossEarnings: number;
  ytdTaxableIncome: number;
  ytdTaxPaid: number;
  ytdEmployeeContributions: number;
  ytdOtherDeductions: number;
  ytdNetSalary: number;
}

export interface PaymentInfo {
  paymentMethod: 'bank_transfer' | 'cash' | 'cheque' | 'other';
  paymentDate: string;
  bankName: string;
  accountNumber: string; // displayed masked e.g. ****6789
  transactionRef: string;
  paymentStatus: 'pending' | 'processed' | 'failed';
}

export interface Payslip {
  id: string;
  payslipNumber: string; // e.g. PS-2026-00001
  verificationCode: string; // e.g. A8K7X2
  salaryMonth: string; // e.g. "August"
  salaryYear: number; // e.g. 2026
  startDate: string;
  endDate: string;
  paymentDate: string;
  payFrequency: PayFrequency;
  
  employeeId: string;
  employeeData: Employee;
  companyData: Company;
  
  attendance: AttendanceRecord;
  earnings: EarningComponent[];
  deductions: DeductionComponent[];
  
  basicSalary: number;
  totalAllowances: number;
  totalBonuses: number;
  totalOvertime: number;
  grossSalary: number;
  
  taxableIncome: number;
  taxAmount: number;
  employeeContributions: number;
  otherDeductions: number;
  totalDeductions: number;
  
  netSalary: number;
  
  taxConfig: TaxConfig;
  employerContributions: EmployerContributions;
  ytd: YtdSummary;
  paymentInfo: PaymentInfo;
  
  templateId?: string;
  status: PayslipStatus;
  version: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SectionType = 
  | 'header'
  | 'company_info'
  | 'employee_info'
  | 'attendance_summary'
  | 'earnings_deductions_table'
  | 'net_salary_callout'
  | 'ytd_summary'
  | 'employer_contributions'
  | 'payment_details'
  | 'signatures_stamps'
  | 'qr_verification'
  | 'notes_footer';

export interface PayslipTemplate {
  id: string;
  name: string;
  description: string;
  pageSize: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
  primaryColor: string; // hex
  secondaryColor: string; // hex
  accentColor: string; // hex
  fontFamily: 'Inter' | 'Roboto' | 'Outfit' | 'Courier Prime' | 'Georgia';
  fontSize: 'xs' | 'sm' | 'base';
  borderStyle: 'solid' | 'dashed' | 'none' | 'double';
  showCompanyLogo: boolean;
  showEmployeePhoto: boolean;
  showQrCode: boolean;
  showStamps: boolean;
  showSignatures: boolean;
  showYtd: boolean;
  showEmployerContrib: boolean;
  showAttendance: boolean;
  sectionOrder: SectionType[];
  customHeaderText?: string;
  customFooterText?: string;
  isDefault?: boolean;
}

export interface AuditLog {
  id: string;
  payslipId: string;
  payslipNumber: string;
  performedBy: string;
  userRole: UserRole;
  action: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  timestamp: string;
  version: number;
}
