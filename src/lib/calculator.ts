import { 
  EarningComponent, 
  DeductionComponent, 
  AttendanceRecord, 
  TaxConfig, 
  EmployerContributions, 
  YtdSummary 
} from '../types/payslip';

export interface CalculationResult {
  basicSalary: number;
  totalAllowances: number;
  totalBonuses: number;
  totalOvertime: number;
  unpaidAbsenceDeduction: number;
  grossSalary: number;
  taxableIncome: number;
  taxAmount: number;
  employeeContributions: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  employerContributions: EmployerContributions;
  updatedYtd: YtdSummary;
}

export function calculateSalary(params: {
  basicSalary: number;
  earnings: EarningComponent[];
  deductions: DeductionComponent[];
  attendance: AttendanceRecord;
  taxConfig: TaxConfig;
  previousYtd?: YtdSummary;
}): CalculationResult {
  const { basicSalary, earnings, deductions, attendance, taxConfig, previousYtd } = params;

  // 1. Attendance Unpaid Deduction
  let unpaidAbsenceDeduction = 0;
  if (attendance.autoDeductUnpaidAbsence && attendance.workingDays > 0 && attendance.unpaidLeave > 0) {
    const dailyRate = basicSalary / attendance.workingDays;
    unpaidAbsenceDeduction = Math.round(dailyRate * attendance.unpaidLeave);
  }

  // 2. Earnings Aggregation
  let totalAllowances = 0;
  let totalBonuses = 0;
  let totalOvertime = 0;
  let totalTaxableEarnings = basicSalary;
  let totalNonTaxableEarnings = 0;

  earnings.forEach((item) => {
    let itemAmt = item.amount;
    if (item.calculationType === 'percentage_of_basic' && item.rateOrPercentage) {
      itemAmt = Math.round((basicSalary * item.rateOrPercentage) / 100);
    }
    
    if (item.name.toLowerCase().includes('bonus') || item.name.toLowerCase().includes('incentive') || item.name.toLowerCase().includes('commission')) {
      totalBonuses += itemAmt;
    } else if (item.name.toLowerCase().includes('overtime') || item.name.toLowerCase().includes('holiday')) {
      totalOvertime += itemAmt;
    } else {
      totalAllowances += itemAmt;
    }

    if (item.isTaxable) {
      totalTaxableEarnings += itemAmt;
    } else {
      totalNonTaxableEarnings += itemAmt;
    }
  });

  // Gross Salary = Basic + Allowances + Bonuses + Overtime
  const grossSalary = basicSalary + totalAllowances + totalBonuses + totalOvertime;

  // Taxable Income calculation = Taxable Gross - Tax Exemption - Tax Relief
  const adjustedTaxableGross = Math.max(0, totalTaxableEarnings - unpaidAbsenceDeduction);
  const taxableIncome = Math.max(0, adjustedTaxableGross - taxConfig.taxExemption - taxConfig.taxRelief);

  // 3. Tax Calculation
  let calculatedTax = 0;

  if (taxConfig.useProgressiveSlabs && taxConfig.progressiveSlabs && taxConfig.progressiveSlabs.length > 0) {
    // Progressive Slabs
    taxConfig.progressiveSlabs.forEach((slab) => {
      if (taxableIncome > slab.minIncome) {
        const taxableAmountInSlab = slab.maxIncome 
          ? Math.min(taxableIncome - slab.minIncome, slab.maxIncome - slab.minIncome)
          : taxableIncome - slab.minIncome;
        if (taxableAmountInSlab > 0) {
          calculatedTax += (taxableAmountInSlab * slab.ratePercentage) / 100;
        }
      }
    });
  } else if (taxConfig.customTaxRate !== undefined) {
    calculatedTax = (taxableIncome * taxConfig.customTaxRate) / 100;
  } else {
    // Default slab rules based on region
    calculatedTax = calculateDefaultTaxByRegion(taxConfig.countryRegion, taxableIncome);
  }

  const taxAmount = Math.round(calculatedTax);

  // 4. Deductions Aggregation
  let employeeContributions = 0;
  let otherDeductions = unpaidAbsenceDeduction;

  deductions.forEach((ded) => {
    let dedAmt = ded.amount;
    if (ded.calculationMethod === 'percentage_of_basic' && ded.rateOrPercentage) {
      dedAmt = Math.round((basicSalary * ded.rateOrPercentage) / 100);
    } else if (ded.calculationMethod === 'percentage_of_gross' && ded.rateOrPercentage) {
      dedAmt = Math.round((grossSalary * ded.rateOrPercentage) / 100);
    }

    const nameLower = ded.name.toLowerCase();
    if (nameLower.includes('provident') || nameLower.includes('social security') || nameLower.includes('pf') || nameLower.includes('insurance') || nameLower.includes('pension')) {
      employeeContributions += dedAmt;
    } else if (nameLower.includes('tax') || nameLower.includes('income tax') || nameLower.includes('tds')) {
      // Handled in taxAmount, but if listed explicitly as deduction component, we sync it
    } else {
      otherDeductions += dedAmt;
    }
  });

  const totalDeductions = taxAmount + employeeContributions + otherDeductions;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  // 5. Employer Contributions (Separate side costs)
  const epfEmployer = Math.round(basicSalary * 0.12); // Standard 12% EPF
  const socialSecurityEmployer = Math.round(grossSalary * 0.05); // Standard 5% SS
  const healthInsuranceEmployer = 1500;
  const pensionEmployer = Math.round(basicSalary * 0.0833);
  const totalEmployerContrib = epfEmployer + socialSecurityEmployer + healthInsuranceEmployer + pensionEmployer;

  const employerContributions: EmployerContributions = {
    epf: epfEmployer,
    socialSecurity: socialSecurityEmployer,
    healthInsurance: healthInsuranceEmployer,
    pension: pensionEmployer,
    employerTax: 0,
    other: 0,
    total: totalEmployerContrib,
  };

  // 6. Updated YTD
  const prev = previousYtd || {
    ytdBasicSalary: 0,
    ytdAllowances: 0,
    ytdBonuses: 0,
    ytdOvertime: 0,
    ytdGrossEarnings: 0,
    ytdTaxableIncome: 0,
    ytdTaxPaid: 0,
    ytdEmployeeContributions: 0,
    ytdOtherDeductions: 0,
    ytdNetSalary: 0,
  };

  const updatedYtd: YtdSummary = {
    ytdBasicSalary: prev.ytdBasicSalary + basicSalary,
    ytdAllowances: prev.ytdAllowances + totalAllowances,
    ytdBonuses: prev.ytdBonuses + totalBonuses,
    ytdOvertime: prev.ytdOvertime + totalOvertime,
    ytdGrossEarnings: prev.ytdGrossEarnings + grossSalary,
    ytdTaxableIncome: prev.ytdTaxableIncome + taxableIncome,
    ytdTaxPaid: prev.ytdTaxPaid + taxAmount,
    ytdEmployeeContributions: prev.ytdEmployeeContributions + employeeContributions,
    ytdOtherDeductions: prev.ytdOtherDeductions + otherDeductions,
    ytdNetSalary: prev.ytdNetSalary + netSalary,
  };

  return {
    basicSalary,
    totalAllowances,
    totalBonuses,
    totalOvertime,
    unpaidAbsenceDeduction,
    grossSalary,
    taxableIncome,
    taxAmount,
    employeeContributions,
    otherDeductions,
    totalDeductions,
    netSalary,
    employerContributions,
    updatedYtd,
  };
}

function calculateDefaultTaxByRegion(region: string, taxableAnnualEquivalent: number): number {
  // Monthly tax estimation
  const annualIncome = taxableAnnualEquivalent * 12;
  let annualTax = 0;

  if (region === 'US') {
    // US Federal brackets approximation (Single 2026)
    if (annualIncome <= 11600) annualTax = annualIncome * 0.10;
    else if (annualIncome <= 47150) annualTax = 1160 + (annualIncome - 11600) * 0.12;
    else if (annualIncome <= 100525) annualTax = 5426 + (annualIncome - 47150) * 0.22;
    else annualTax = 17168.5 + (annualIncome - 100525) * 0.24;
  } else if (region === 'IN') {
    // India New Tax Regime approximation
    if (annualIncome <= 300000) annualTax = 0;
    else if (annualIncome <= 700000) annualTax = (annualIncome - 300000) * 0.05;
    else if (annualIncome <= 1000000) annualTax = 20000 + (annualIncome - 700000) * 0.10;
    else annualTax = 50000 + (annualIncome - 1000000) * 0.15;
  } else if (region === 'UK') {
    // UK PAYE approximation
    const personalAllowance = 12570;
    const taxable = Math.max(0, annualIncome - personalAllowance);
    if (taxable <= 37700) annualTax = taxable * 0.20;
    else annualTax = 37700 * 0.20 + (taxable - 37700) * 0.40;
  } else {
    // Standard flat 10%
    annualTax = annualIncome * 0.10;
  }

  return annualTax / 12;
}

export function formatCurrency(amount: number, currencySymbol: string = '$'): string {
  return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
