'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  CreditCard, 
  ShieldAlert, 
  UserCheck, 
  Image as ImageIcon, 
  Save, 
  Check, 
  Plus, 
  Trash2,
  FileBadge
} from 'lucide-react';
import { Company } from '../types/payslip';

interface CompanySettingsProps {
  company: Company;
  onSave: (updated: Company) => void;
}

export const CompanySettings: React.FC<CompanySettingsProps> = ({ company, onSave }) => {
  const [formData, setFormData] = useState<Company>({ ...company });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');

  const handleChange = (field: keyof Company, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddCustomField = () => {
    if (!customFieldName.trim()) return;
    setFormData((prev) => ({
      ...prev,
      customFields: {
        ...(prev.customFields || {}),
        [customFieldName.trim()]: customFieldValue.trim(),
      },
    }));
    setCustomFieldName('');
    setCustomFieldValue('');
  };

  const handleRemoveCustomField = (key: string) => {
    setFormData((prev) => {
      const updated = { ...(prev.customFields || {}) };
      delete updated[key];
      return { ...prev, customFields: updated };
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-600" />
            <span>Company Profile & Branding</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure company credentials, logos, tax IDs, bank info, and authorized digital signatures for payslips.
          </p>
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-95"
        >
          {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? 'Saved Changes!' : 'Save Company Info'}</span>
        </button>
      </div>

      {/* Section 1: Basic & Branding */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-indigo-600 flex items-center gap-2">
          <FileBadge className="w-4 h-4" />
          <span>1. General Company & Branding</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Logo Upload/URL */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">Company Logo URL / Preview</label>
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center bg-slate-50">
              {formData.logoUrl ? (
                <img src={formData.logoUrl} alt="Logo Preview" className="h-16 max-w-full object-contain mb-2" />
              ) : (
                <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
              )}
              <input
                type="text"
                value={formData.logoUrl || ''}
                onChange={(e) => handleChange('logoUrl', e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full text-xs p-2 rounded border border-slate-300 bg-white text-slate-800"
              />
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Company Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Company Website</label>
              <div className="relative mt-1">
                <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="w-full text-xs p-2.5 pl-9 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Official Email</label>
              <div className="relative mt-1">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full text-xs p-2.5 pl-9 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Phone Number</label>
              <div className="relative mt-1">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full text-xs p-2.5 pl-9 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Address */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700">Street Address</label>
            <div className="relative mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full text-xs p-2.5 pl-9 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">City / State</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Country & Postal</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Statutory Registration & Tax IDs */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-indigo-600 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span>2. Statutory & Tax Registration Numbers</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">Company Registration No.</label>
            <input
              type="text"
              value={formData.registrationNumber}
              onChange={(e) => handleChange('registrationNumber', e.target.value)}
              placeholder="e.g. REG-2024-998877"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Tax / PAN / VAT ID</label>
            <input
              type="text"
              value={formData.taxPanVatNumber}
              onChange={(e) => handleChange('taxPanVatNumber', e.target.value)}
              placeholder="e.g. TAX-9988110"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Employer ID Number (EIN)</label>
            <input
              type="text"
              value={formData.employerIdNumber}
              onChange={(e) => handleChange('employerIdNumber', e.target.value)}
              placeholder="e.g. EIN-12-3456789"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Bank Details & Authorized Signatories */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-indigo-600 flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          <span>3. Bank & Signatory Credentials</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">Company Bank Name</label>
            <input
              type="text"
              value={formData.bankName}
              onChange={(e) => handleChange('bankName', e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Disbursement Account No.</label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => handleChange('accountNumber', e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Authorized Signatory Name</label>
            <div className="relative mt-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={formData.authorizedPersonName}
                onChange={(e) => handleChange('authorizedPersonName', e.target.value)}
                className="w-full text-xs p-2.5 pl-9 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Designation</label>
            <input
              type="text"
              value={formData.authorizedPersonDesignation}
              onChange={(e) => handleChange('authorizedPersonDesignation', e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Custom Fields */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-indigo-600 flex items-center justify-between">
          <span>4. Custom Company Metadata Fields</span>
        </h2>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Field Label (e.g. Cost Center)"
            value={customFieldName}
            onChange={(e) => setCustomFieldName(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-300 flex-1 outline-none"
          />
          <input
            type="text"
            placeholder="Field Value (e.g. CC-TECH-90)"
            value={customFieldValue}
            onChange={(e) => setCustomFieldValue(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-300 flex-1 outline-none"
          />
          <button
            type="button"
            onClick={handleAddCustomField}
            className="px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {formData.customFields && Object.keys(formData.customFields).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            {Object.entries(formData.customFields).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="font-bold text-slate-700">{key}:</span> <span className="text-slate-600">{val}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCustomField(key)}
                  className="text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </form>
  );
};
