import jsPDF from 'jspdf';

export interface PdfTextItem {
  id: string;
  pageIndex: number;
  str: string;
  x: number; // In PDF page coordinate percentage (0-100)
  y: number; // In PDF page coordinate percentage (0-100)
  width: number; // percentage of page width
  height: number; // percentage of page height
  fontSize: number;
  fontName: string;
  category?: 'amount' | 'date' | 'id' | 'name' | 'general';
}

export interface PdfOverlayElement {
  id: string;
  pageIndex: number;
  type: 'text' | 'whiteout' | 'image' | 'stamp';
  x: number; // percentage of page width (0 to 100)
  y: number; // percentage of page height (0 to 100)
  width: number; // percentage of page width
  height: number; // percentage of page height
  // Text properties
  text?: string;
  fontSize?: number; // relative pt size (e.g. 12-24)
  fontFamily?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  hasWhiteoutBg?: boolean;
  originalTextId?: string;
  // Whiteout properties
  fillColor?: string;
  // Image / Stamp properties
  dataUrl?: string;
  stampType?: string;
  stampColor?: string;
  opacity?: number;
}

export interface PdfPageData {
  pageIndex: number;
  width: number;
  height: number;
  aspectRatio: number;
  isLandscape: boolean;
  textItems: PdfTextItem[];
}

/**
 * Robust Category Matcher for any extracted PDF string
 */
export function matchesCategory(str: string, category: 'all' | 'amount' | 'date' | 'id' | 'name'): boolean {
  if (category === 'all') return true;
  const trimmed = str.trim();
  if (!trimmed) return false;

  if (category === 'amount') {
    return (
      /[$€£¥₹]/.test(trimmed) ||
      /\b\d{1,3}(,\d{3})+(\.\d{2})?\b/.test(trimmed) ||
      /^-?\s*[$€£¥₹]?\s*\d+(\.\d{2})?%?$/.test(trimmed) ||
      /\b(USD|EUR|GBP|INR|AUD|CAD)\b/i.test(trimmed) ||
      (/\b(Salary|Gross|Net|Total|Deduction|Earning|Withheld|Allowance|Bonus|Overtime|Pay|Fund|Benefit|Rate)\b/i.test(trimmed) && /\d/.test(trimmed))
    );
  }

  if (category === 'date') {
    return (
      /\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/.test(trimmed) ||
      /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/.test(trimmed) ||
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{1,4}\b/i.test(trimmed) ||
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i.test(trimmed) ||
      (/\b20[1-3][0-9]\b/.test(trimmed) && /\b(Month|Date|Period|Year|Joining|Pay|Disbursed|Day|Days)\b/i.test(trimmed)) ||
      /\b(Pay Date|Payment Date|Joining Date|Salary Month|Period):/i.test(trimmed)
    );
  }

  if (category === 'id') {
    return (
      /\b(EMP|ID|REG|PAN|SSN|TAX|REF|PS|INV|ACC|CODE|VAT|PIN|NO|NUM)[-:#\s]*[A-Z0-9-]{1,}/i.test(trimmed) ||
      /\b[A-Z0-9]{2,}-[0-9A-Z-]{2,}\b/i.test(trimmed) ||
      /[•*xX]{2,}\s*\d{2,}/.test(trimmed) ||
      /\b(Employee ID|Emp ID|Account Number|Tax ID|Registration Number|PAN Number|PAN ID|SSN|Verification ID):?/i.test(trimmed)
    );
  }

  if (category === 'name') {
    return (
      /\b(Mr\.|Ms\.|Mrs\.|Dr\.)/i.test(trimmed) ||
      /\b(Inc\.|Ltd\.|LLC|Corp\.|Technologies|Company|Enterprise|Bank|Department|Engineer|Manager|Director|Lead|Officer|Staff|Employee|Software|Architecture|Specialist)\b/i.test(trimmed) ||
      (/^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/.test(trimmed) && !/\d/.test(trimmed))
    );
  }

  return false;
}

export function categorizeText(str: string): 'amount' | 'date' | 'id' | 'name' | 'general' {
  if (matchesCategory(str, 'id')) return 'id';
  if (matchesCategory(str, 'amount')) return 'amount';
  if (matchesCategory(str, 'date')) return 'date';
  if (matchesCategory(str, 'name')) return 'name';
  return 'general';
}

/**
 * Group raw PDF.js text content items into cohesive words / phrases
 */
export function processPdfTextItems(rawItems: any[], viewport: any, pageIndex: number): PdfTextItem[] {
  const rawList: PdfTextItem[] = [];
  const pageWidth = viewport.width;
  const pageHeight = viewport.height;

  for (let i = 0; i < rawItems.length; i++) {
    const item = rawItems[i];
    const str = item.str;
    if (!str || !str.trim()) continue;

    const transform = item.transform;
    const fontHeight = Math.sqrt((transform[2] * transform[2]) + (transform[3] * transform[3])) || Math.abs(transform[3]) || 12;
    const [vx, vy] = viewport.convertToViewportPoint(transform[4], transform[5]);

    const xPct = (vx / pageWidth) * 100;
    const actualTop = vy - (fontHeight * viewport.scale);
    const yPct = (actualTop / pageHeight) * 100;
    const widthPct = ((item.width * viewport.scale) / pageWidth) * 100;
    const heightPct = ((fontHeight * viewport.scale * 1.25) / pageHeight) * 100;

    rawList.push({
      id: `p${pageIndex}_txt_${i}_${Math.random().toString(36).substr(2, 6)}`,
      pageIndex,
      str: str.trim(),
      x: Math.max(0, Math.min(100, xPct)),
      y: Math.max(0, Math.min(100, yPct)),
      width: Math.max(1, Math.min(100, widthPct)),
      height: Math.max(1.2, Math.min(20, heightPct)),
      fontSize: fontHeight || 12,
      fontName: item.fontName || 'sans-serif',
      category: 'general',
    });
  }

  // Sort by vertical position (y), then horizontal (x)
  rawList.sort((a, b) => {
    if (Math.abs(a.y - b.y) > 0.8) return a.y - b.y;
    return a.x - b.x;
  });

  // Merge adjacent horizontal tokens on the same line
  const merged: PdfTextItem[] = [];
  let current: PdfTextItem | null = null;

  for (const item of rawList) {
    if (!current) {
      current = { ...item };
      continue;
    }

    const sameLine = Math.abs(current.y - item.y) <= 0.8;
    const rightEdge = current.x + current.width;
    const gap = item.x - rightEdge;

    // Merge if tokens are on the same line and close to each other
    if (sameLine && gap >= -0.5 && gap <= 3.5) {
      current.str = `${current.str} ${item.str}`.replace(/\s+/g, ' ');
      current.width = (item.x + item.width) - current.x;
      current.height = Math.max(current.height, item.height);
      current.fontSize = Math.max(current.fontSize, item.fontSize);
    } else {
      current.category = categorizeText(current.str);
      merged.push(current);
      current = { ...item };
    }
  }

  if (current) {
    current.category = categorizeText(current.str);
    merged.push(current);
  }

  return merged;
}

/**
 * Generates an authentic Corporate Payslip PDF in-memory as an ArrayBuffer
 * for instant testing without needing an external PDF file upload.
 */
export function generateSampleCorporatePdfBuffer(): ArrayBuffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // 1. Header Banner
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('ACME GLOBAL TECHNOLOGIES INC.', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(224, 231, 255);
  doc.text('100 Innovation Way, Silicon Valley, CA 94025 | www.acmeglobal.com | payroll@acmeglobal.com', 14, 20);

  // Payslip Title Callout
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(148, 6, 48, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 58, 138);
  doc.text('SALARY PAYSLIP', 153, 12);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Month: AUGUST 2026', 153, 18);

  // 2. Metadata Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 34, 182, 38, 2, 2, 'FD');

  // Column 1: Employee Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Employee Name:', 18, 42);
  doc.text('Employee ID:', 18, 49);
  doc.text('Designation:', 18, 56);
  doc.text('Department:', 18, 63);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Alexander Wright', 54, 42);
  doc.text('EMP-8492', 54, 49);
  doc.text('Senior Staff Software Engineer', 54, 56);
  doc.text('Engineering & Architecture', 54, 63);

  // Vertical Separator
  doc.setDrawColor(226, 232, 240);
  doc.line(105, 36, 105, 70);

  // Column 2: Payment & Bank Info
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Pay Date:', 110, 42);
  doc.text('Bank Name:', 110, 49);
  doc.text('Account No:', 110, 56);
  doc.text('Tax PAN / SSN:', 110, 63);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('2026-08-31', 145, 42);
  doc.text('JPMorgan Chase Bank', 145, 49);
  doc.text('•••• •••• •••• 1045', 145, 56);
  doc.text('TAX-US-9948201', 145, 63);

  // 3. Earnings & Deductions Table
  doc.setFillColor(30, 58, 138);
  doc.rect(14, 78, 90, 8, 'F');
  doc.rect(106, 78, 90, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('EARNINGS', 18, 83.5);
  doc.text('AMOUNT ($)', 82, 83.5);
  doc.text('DEDUCTIONS', 110, 83.5);
  doc.text('AMOUNT ($)', 174, 83.5);

  // Table Body Rows
  const earningsData = [
    ['Basic Salary', '8,500.00'],
    ['House Rent Allowance (HRA)', '2,550.00'],
    ['Special Project Allowance', '1,200.00'],
    ['Transport & Travel Benefit', '650.00'],
    ['Medical Insurance Coverage', '400.00'],
  ];

  const deductionsData = [
    ['Federal Income Tax (Withholding)', '1,850.00'],
    ['Social Security Contribution', '527.00'],
    ['Medicare Deduction', '123.25'],
    ['Employee 401(k) Retirement', '680.00'],
    ['Group Life Insurance Plan', '110.00'],
  ];

  let currentY = 92;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  for (let i = 0; i < 5; i++) {
    // Alternate row background
    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY - 4.5, 90, 7, 'F');
      doc.rect(106, currentY - 4.5, 90, 7, 'F');
    }

    doc.text(earningsData[i][0], 18, currentY);
    doc.text(earningsData[i][1], 96, currentY, { align: 'right' });

    doc.text(deductionsData[i][0], 110, currentY);
    doc.text(deductionsData[i][1], 188, currentY, { align: 'right' });

    currentY += 7;
  }

  // Table Subtotals
  doc.setDrawColor(203, 213, 225);
  doc.line(14, currentY, 104, currentY);
  doc.line(106, currentY, 196, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL GROSS EARNINGS:', 18, currentY);
  doc.setTextColor(16, 185, 129);
  doc.text('$13,300.00', 96, currentY, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL DEDUCTIONS:', 110, currentY);
  doc.setTextColor(225, 29, 72);
  doc.text('-$3,290.25', 188, currentY, { align: 'right' });

  // 4. Net Salary Callout Box
  currentY += 10;
  doc.setFillColor(30, 58, 138);
  doc.roundedRect(14, currentY, 182, 22, 2.5, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(224, 231, 255);
  doc.text('NET SALARY TRANSFERRED TO ACCOUNT:', 20, currentY + 9);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(199, 210, 254);
  doc.text('Disbursed via Electronic Direct ACH on August 31, 2026', 20, currentY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('$10,009.75', 188, currentY + 14, { align: 'right' });

  // 5. Attendance Summary
  currentY += 30;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Attendance & Leave Summary:', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Calendar Days: 31  |  Working Days: 22  |  Days Present: 22  |  Paid Leave: 0  |  Overtime: 8.5 Hrs', 18, currentY + 11);

  // 6. Signatures & Official Stamp
  currentY += 28;
  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([1.5, 1], 0);

  // Employee Signature line
  doc.line(20, currentY + 14, 75, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Employee Signature', 30, currentY + 19);

  // Employer Signature line
  doc.line(135, currentY + 14, 190, currentY + 14);
  doc.text('Authorized Finance Officer', 142, currentY + 19);

  // Stamp Badge
  doc.setDrawColor(16, 185, 129);
  doc.setLineDashPattern([], 0);
  doc.roundedRect(88, currentY, 34, 18, 1.5, 1.5, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129);
  doc.text('OFFICIALLY', 94, currentY + 7);
  doc.text('PROCESSED', 94, currentY + 13);

  // 7. Footer Notice
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer-generated confidential payroll document. Verification ID: PS-2026-8492-V', 105, 285, { align: 'center' });

  return doc.output('arraybuffer');
}
