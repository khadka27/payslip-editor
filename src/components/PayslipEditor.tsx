'use client';

import React, { useState } from 'react';
import { 
  Layers, 
  Palette, 
  Type, 
  Sliders, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Check, 
  Plus, 
  Save, 
  Sparkles,
  Layout,
  Code2,
  Copy
} from 'lucide-react';
import { PayslipTemplate, SectionType } from '../types/payslip';

interface PayslipEditorProps {
  templates: PayslipTemplate[];
  activeTemplate: PayslipTemplate;
  onSaveTemplate: (template: PayslipTemplate) => void;
  onSelectTemplate: (template: PayslipTemplate) => void;
}

export const PayslipEditor: React.FC<PayslipEditorProps> = ({
  templates,
  activeTemplate,
  onSaveTemplate,
  onSelectTemplate,
}) => {
  const [template, setTemplate] = useState<PayslipTemplate>({ ...activeTemplate });
  const [activeTab, setActiveTab] = useState<'sections' | 'styles' | 'placeholders'>('sections');
  const [savedMessage, setSavedMessage] = useState(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const availableSections: { id: SectionType; label: string; desc: string }[] = [
    { id: 'header', label: '1. Document Header', desc: 'Title banner, confidential mark & payslip #' },
    { id: 'company_info', label: '2. Company Details', desc: 'Logo, registration, EIN, address & contact' },
    { id: 'employee_info', label: '3. Employee Profile', desc: 'Photo, ID, designation, bank details & SSN' },
    { id: 'attendance_summary', label: '4. Attendance Grid', desc: 'Working days, leaves, absent & overtime' },
    { id: 'earnings_deductions_table', label: '5. Earnings & Deductions Table', desc: 'Itemized allowances, bonuses & deductions' },
    { id: 'net_salary_callout', label: '6. Net Salary Callout', desc: 'Highlighted net payable amount banner' },
    { id: 'ytd_summary', label: '7. Year-to-Date (YTD)', desc: 'Historical earnings, tax paid & contributions' },
    { id: 'employer_contributions', label: '8. Employer Contributions', desc: 'EPF, Social Security & Pension side costs' },
    { id: 'payment_details', label: '9. Payment Details', desc: 'Bank transfer ref, date & masked account' },
    { id: 'signatures_stamps', label: '10. Signatures & Stamp', desc: 'Authorized HR signature & company seal' },
    { id: 'qr_verification', label: '11. QR Verification', desc: 'Authenticity QR code & verification key' },
    { id: 'notes_footer', label: '12. Footer Notes', desc: 'Custom disclaimer text & page numbering' },
  ];

  const placeholders = [
    { tag: '{{company_name}}', desc: 'Company Full Name' },
    { tag: '{{company_address}}', desc: 'Company Street & City' },
    { tag: '{{employee_name}}', desc: 'Employee Full Name' },
    { tag: '{{employee_id}}', desc: 'Employee Registration Code' },
    { tag: '{{designation}}', desc: 'Employee Job Title' },
    { tag: '{{department}}', desc: 'Department Name' },
    { tag: '{{salary_month}}', desc: 'Month (e.g. August)' },
    { tag: '{{basic_salary}}', desc: 'Base Salary Amount' },
    { tag: '{{gross_salary}}', desc: 'Calculated Gross Salary' },
    { tag: '{{total_deductions}}', desc: 'Sum of Deductions' },
    { tag: '{{net_salary}}', desc: 'Final Net Payable' },
    { tag: '{{payment_date}}', desc: 'Disbursement Date' },
    { tag: '{{verification_code}}', desc: 'Unique QR Code Key' },
  ];

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const updated = [...template.sectionOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setTemplate({ ...template, sectionOrder: updated });
  };

  const handleToggleSection = (sectionId: SectionType) => {
    let updated = [...template.sectionOrder];
    if (updated.includes(sectionId)) {
      updated = updated.filter((s) => s !== sectionId);
    } else {
      updated.push(sectionId);
    }
    setTemplate({ ...template, sectionOrder: updated });
  };

  const handleSave = () => {
    onSaveTemplate(template);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const copyToClipboard = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-600" />
            <span>Payslip Template Studio</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Drag, reorder, customize styling, toggle components, and insert dynamic placeholder fields into templates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Template Preset Selector */}
          <select
            value={template.id}
            onChange={(e) => {
              const selected = templates.find((t) => t.id === e.target.value);
              if (selected) {
                setTemplate(selected);
                onSelectTemplate(selected);
              }
            }}
            className="text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white outline-none"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
          >
            {savedMessage ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{savedMessage ? 'Template Saved!' : 'Save Template'}</span>
          </button>
        </div>
      </div>

      {/* Editor Layout: Left Toolbar (30%) & Right Live Canvas (70%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Toolbar Controls (4 Cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          
          {/* Toolbar Sub-Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('sections')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'sections' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Sections</span>
            </button>
            <button
              onClick={() => setActiveTab('styles')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'styles' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Style</span>
            </button>
            <button
              onClick={() => setActiveTab('placeholders')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'placeholders' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Tags</span>
            </button>
          </div>

          {/* TAB 1: Sections & Order */}
          {activeTab === 'sections' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Canvas Section Structure</h3>
                <span className="text-[11px] text-slate-500 font-semibold">{template.sectionOrder.length} Visible</span>
              </div>

              <div className="space-y-2">
                {template.sectionOrder.map((secId, idx) => {
                  const secDef = availableSections.find((s) => s.id === secId);
                  if (!secDef) return null;

                  return (
                    <div
                      key={secId}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-all text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-800">{secDef.label}</div>
                          <div className="text-[10px] text-slate-500">{secDef.desc}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveSection(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveSection(idx, 'down')}
                          disabled={idx === template.sectionOrder.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleSection(secId)}
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hidden Sections to Add Back */}
              {availableSections.filter((s) => !template.sectionOrder.includes(s.id)).length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hidden Sections</div>
                  {availableSections
                    .filter((s) => !template.sectionOrder.includes(s.id))
                    .map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg border border-dashed border-slate-300 text-xs bg-white">
                        <span className="text-slate-600 font-medium">{s.label}</span>
                        <button
                          onClick={() => handleToggleSection(s.id)}
                          className="px-2 py-1 rounded bg-indigo-50 text-indigo-600 text-[10px] font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Show</span>
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Style Customization */}
          {activeTab === 'styles' && (
            <div className="space-y-4 animate-fade-in text-xs">
              
              <div>
                <label className="font-semibold text-slate-700 block">Template Title</label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 mt-1 font-semibold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block">Primary Accent Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={template.primaryColor}
                      onChange={(e) => setTemplate({ ...template, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={template.primaryColor}
                      onChange={(e) => setTemplate({ ...template, primaryColor: e.target.value })}
                      className="w-full p-2 rounded border border-slate-300 font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block">Font Family</label>
                  <select
                    value={template.fontFamily}
                    onChange={(e) => setTemplate({ ...template, fontFamily: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 mt-1 bg-white"
                  >
                    <option value="Inter">Inter (Modern Clean)</option>
                    <option value="Outfit">Outfit (Tech Bold)</option>
                    <option value="Roboto">Roboto (Standard)</option>
                    <option value="Courier Prime">Courier (Contractor)</option>
                    <option value="Georgia">Georgia (Serif Classic)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block">Page Size</label>
                  <select
                    value={template.pageSize}
                    onChange={(e) => setTemplate({ ...template, pageSize: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 mt-1 bg-white"
                  >
                    <option value="a4">A4 (Standard 210 x 297 mm)</option>
                    <option value="letter">US Letter (8.5 x 11 in)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block">Border Style</label>
                  <select
                    value={template.borderStyle}
                    onChange={(e) => setTemplate({ ...template, borderStyle: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 mt-1 bg-white"
                  >
                    <option value="solid">Solid Crisp</option>
                    <option value="dashed">Dashed Modern</option>
                    <option value="double">Double Border</option>
                    <option value="none">No Outer Border</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Visibility Elements</div>
                
                {[
                  { key: 'showCompanyLogo', label: 'Company Logo' },
                  { key: 'showEmployeePhoto', label: 'Employee Profile Photo' },
                  { key: 'showQrCode', label: 'QR Verification Badge' },
                  { key: 'showSignatures', label: 'Signatures & Stamps' },
                  { key: 'showYtd', label: 'Year-to-Date (YTD) Summary' },
                  { key: 'showEmployerContrib', label: 'Employer Side Contributions' },
                  { key: 'showAttendance', label: 'Attendance Breakdown' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={(template as any)[item.key]}
                      onChange={(e) => setTemplate({ ...template, [item.key]: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                  </label>
                ))}
              </div>

              <div>
                <label className="font-semibold text-slate-700 block">Custom Header Banner Text</label>
                <input
                  type="text"
                  value={template.customHeaderText || ''}
                  onChange={(e) => setTemplate({ ...template, customHeaderText: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block">Custom Footer Disclaimer</label>
                <textarea
                  rows={2}
                  value={template.customFooterText || ''}
                  onChange={(e) => setTemplate({ ...template, customFooterText: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 mt-1 text-xs"
                />
              </div>

            </div>
          )}

          {/* TAB 3: Placeholders / Tags */}
          {activeTab === 'placeholders' && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-xs text-slate-500">
                Click any dynamic field placeholder to copy it into your custom headers, notes, or template texts:
              </div>

              <div className="space-y-2">
                {placeholders.map((p) => (
                  <div
                    key={p.tag}
                    onClick={() => copyToClipboard(p.tag)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/60 hover:border-indigo-200 transition-all cursor-pointer group text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-indigo-600">{p.tag}</div>
                      <div className="text-[10px] text-slate-500">{p.desc}</div>
                    </div>
                    <button className="p-1 text-slate-400 group-hover:text-indigo-600">
                      {copiedTag === p.tag ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Canvas Mock Preview (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-100 p-6 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-start overflow-auto min-h-[600px]">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            <span>Interactive Template Canvas View</span>
          </div>

          {/* Mock Document Sheet */}
          <div 
            style={{ 
              fontFamily: template.fontFamily === 'Courier Prime' ? 'monospace' : template.fontFamily,
              borderColor: template.primaryColor 
            }}
            className={`w-full max-w-xl bg-white p-8 rounded-lg shadow-xl border-t-8 space-y-6 text-slate-800 text-xs transition-all`}
          >
            
            {template.sectionOrder.map((secId) => {
              switch (secId) {
                case 'header':
                  return (
                    <div key={secId} className="flex justify-between items-center border-b pb-3" style={{ borderColor: `${template.primaryColor}30` }}>
                      <div>
                        <h2 className="text-lg font-bold" style={{ color: template.primaryColor }}>
                          {template.customHeaderText || 'CONFIDENTIAL PAYSLIP STATEMENT'}
                        </h2>
                        <p className="text-[10px] text-slate-500 font-mono">Payslip #: PS-2026-XXXXX</p>
                      </div>
                      {template.showQrCode && (
                        <div className="w-10 h-10 bg-slate-900 text-white rounded flex items-center justify-center text-[9px] font-mono">
                          QR
                        </div>
                      )}
                    </div>
                  );
                case 'company_info':
                  return (
                    <div key={secId} className="flex justify-between items-center text-xs">
                      <div>
                        <div className="font-extrabold text-sm text-slate-900">Acme Global Technologies Inc.</div>
                        <div className="text-[11px] text-slate-500">100 Innovation Way, San Francisco, CA</div>
                        <div className="text-[10px] text-slate-400 font-mono">EIN: 12-3456789 • Reg: REG-9988</div>
                      </div>
                      {template.showCompanyLogo && (
                        <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded flex items-center justify-center font-bold text-indigo-600 text-xs">
                          LOGO
                        </div>
                      )}
                    </div>
                  );
                case 'employee_info':
                  return (
                    <div key={secId} className="p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="font-semibold text-slate-500">Employee:</span> <strong className="text-slate-900">Alexander Wright</strong>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">ID:</span> <strong className="font-mono">EMP-101</strong>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Designation:</span> Senior Engineer
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Department:</span> Engineering
                      </div>
                    </div>
                  );
                case 'attendance_summary':
                  return template.showAttendance ? (
                    <div key={secId} className="grid grid-cols-4 gap-2 text-center text-[10px]">
                      <div className="p-2 rounded bg-slate-50 border"><div className="font-bold">22</div>Working</div>
                      <div className="p-2 rounded bg-slate-50 border"><div className="font-bold">22</div>Present</div>
                      <div className="p-2 rounded bg-slate-50 border"><div className="font-bold text-emerald-600">8 hrs</div>Overtime</div>
                      <div className="p-2 rounded bg-slate-50 border"><div className="font-bold text-slate-500">0</div>Absent</div>
                    </div>
                  ) : null;
                case 'earnings_deductions_table':
                  return (
                    <div key={secId} className="border rounded overflow-hidden text-[11px]">
                      <div className="bg-slate-100 font-bold p-2 grid grid-cols-2">
                        <span>Earnings</span>
                        <span>Deductions</span>
                      </div>
                      <div className="p-2 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex justify-between"><span>Basic Salary</span><span>$8,500</span></div>
                          <div className="flex justify-between"><span>HRA</span><span>$2,500</span></div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between"><span>Tax</span><span className="text-rose-600">-$1,850</span></div>
                          <div className="flex justify-between"><span>EPF (12%)</span><span className="text-rose-600">-$1,020</span></div>
                        </div>
                      </div>
                    </div>
                  );
                case 'net_salary_callout':
                  return (
                    <div key={secId} className="p-4 rounded-lg text-white flex justify-between items-center" style={{ backgroundColor: template.primaryColor }}>
                      <span className="font-bold uppercase tracking-wider text-xs">NET SALARY PAYABLE</span>
                      <span className="text-xl font-extrabold font-mono">$11,810.00</span>
                    </div>
                  );
                case 'ytd_summary':
                  return template.showYtd ? (
                    <div key={secId} className="p-2.5 rounded bg-slate-50 border text-[10px] space-y-1">
                      <div className="font-bold text-slate-700">YEAR-TO-DATE (YTD) SUMMARY</div>
                      <div className="flex justify-between"><span>YTD Gross Earnings: $92,000</span><span>YTD Tax Paid: $14,800</span></div>
                    </div>
                  ) : null;
                case 'signatures_stamps':
                  return template.showSignatures ? (
                    <div key={secId} className="pt-4 border-t flex justify-between text-[10px] text-slate-500">
                      <div>
                        <div className="font-bold text-slate-800">Sarah Jenkins</div>
                        <div>Head of HR</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">Verified & Approved</div>
                        <div>System Generated</div>
                      </div>
                    </div>
                  ) : null;
                default:
                  return null;
              }
            })}

          </div>
        </div>

      </div>

    </div>
  );
};
