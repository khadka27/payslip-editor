'use client';

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  FileUp, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Building2, 
  DollarSign, 
  Briefcase, 
  CreditCard,
  Phone,
  Mail,
  ShieldCheck
} from 'lucide-react';
import Papa from 'papaparse';
import { Employee, EmploymentType } from '../types/payslip';
import { formatCurrency } from '../lib/calculator';

interface EmployeeManagerProps {
  employees: Employee[];
  onSaveEmployees: (updated: Employee[]) => void;
}

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({ employees, onSaveEmployees }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const departments = Array.from(new Set(employees.map((e) => e.department))).filter(Boolean);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
    const matchesType = selectedType === 'all' || emp.employmentType === selectedType;

    return matchesSearch && matchesDept && matchesType;
  });

  const handleOpenAdd = () => {
    const newEmp: Employee = {
      id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      fullName: '',
      photoUrl: '',
      dob: '1995-01-01',
      gender: 'Male',
      nationality: 'American',
      address: '',
      phone: '',
      email: '',
      department: 'Engineering',
      designation: 'Software Engineer',
      employmentType: 'full_time',
      joiningDate: new Date().toISOString().split('T')[0],
      workLocation: 'Main HQ',
      bankName: 'Standard Chartered',
      bankAccountNumber: '1234567890',
      branch: 'Main Branch',
      taxPanNumber: 'PAN-REG-001',
      socialSecurityNumber: 'SSN-990-11',
      basicSalary: 5000,
    };
    setEditingEmployee(newEmp);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee({ ...emp });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      const updated = employees.filter((e) => e.id !== id);
      onSaveEmployees(updated);
    }
  };

  const handleFormSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const exists = employees.some((e) => e.id === editingEmployee.id);
    let updated: Employee[];
    if (exists) {
      updated = employees.map((e) => (e.id === editingEmployee.id ? editingEmployee : e));
    } else {
      updated = [editingEmployee, ...employees];
    }

    onSaveEmployees(updated);
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: { data: any[]; }) => {
        const imported: Employee[] = [];
        results.data.forEach((row: any) => {
          if (row.fullName || row.name) {
            imported.push({
              id: row.id || `EMP-${Math.floor(100 + Math.random() * 900)}`,
              fullName: row.fullName || row.name || 'Unnamed',
              email: row.email || 'employee@company.com',
              phone: row.phone || '',
              department: row.department || 'General',
              designation: row.designation || 'Staff',
              employmentType: (row.employmentType as EmploymentType) || 'full_time',
              joiningDate: row.joiningDate || new Date().toISOString().split('T')[0],
              address: row.address || '',
              workLocation: row.workLocation || 'HQ',
              bankName: row.bankName || 'Bank',
              bankAccountNumber: row.bankAccountNumber || '000000000',
              branch: row.branch || 'Main',
              taxPanNumber: row.taxPanNumber || 'PAN-0000',
              basicSalary: parseFloat(row.basicSalary) || 4000,
              nationality: row.nationality || 'Standard',
              dob: row.dob || '1995-01-01',
            });
          }
        });

        if (imported.length > 0) {
          onSaveEmployees([...imported, ...employees]);
          alert(`Successfully imported ${imported.length} employees from CSV!`);
        }
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Employee Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage employee profiles, designations, bank accounts, SSN/PAN numbers, and base salaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* CSV Import */}
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs cursor-pointer transition-all shadow-xs">
            <FileUp className="w-4 h-4 text-slate-500" />
            <span>Import CSV</span>
            <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
          </label>

          {/* Add Employee */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, ID, email or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs p-2.5 pl-9 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 outline-none custom-select shadow-2xs hover:bg-slate-50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 outline-none custom-select shadow-2xs hover:bg-slate-50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="temporary">Temporary</option>
          </select>

          <span className="text-xs font-semibold text-slate-500 pl-2">
            Showing {filteredEmployees.length} of {employees.length}
          </span>
        </div>

      </div>

      {/* Employee List - Mobile Cards (< md) & Desktop Table (>= md) */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
        
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredEmployees.map((emp) => (
            <div key={emp.id} className="p-4 space-y-3 hover:bg-slate-50/80 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-xs">
                    {emp.photoUrl ? (
                      <img src={emp.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      emp.fullName.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{emp.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono font-bold text-indigo-600">{emp.id} • {emp.designation}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(emp)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600"
                    title="Edit Employee"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(emp.id)}
                    className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                    title="Delete Employee"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 text-slate-600">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                  <span className="font-semibold text-slate-800">{emp.department}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Base Salary</span>
                  <span className="font-bold font-mono text-emerald-700">{formatCurrency(emp.basicSalary)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank Info</span>
                  <span className="font-mono text-[11px]">{emp.bankName} (•••• {emp.bankAccountNumber.slice(-4)})</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact</span>
                  <span className="truncate block text-[11px]">{emp.email}</span>
                </div>
              </div>
            </div>
          ))}
          {filteredEmployees.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No employees matched your filter criteria.
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Employee ID</th>
                <th className="py-3.5 px-4">Full Name & Role</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Bank & Tax ID</th>
                <th className="py-3.5 px-4">Basic Salary</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                    {emp.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-xs shadow-xs">
                        {emp.photoUrl ? (
                          <img src={emp.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          emp.fullName.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{emp.fullName}</div>
                        <div className="text-[11px] text-slate-500 capitalize">{emp.designation} ({emp.employmentType.replace('_', ' ')})</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                      <Building2 className="w-3 h-3 text-slate-500" />
                      {emp.department}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{emp.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{emp.phone || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                    <div>{emp.bankName}</div>
                    <div className="text-slate-400">Acc: •••• {emp.bankAccountNumber.slice(-4)}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {formatCurrency(emp.basicSalary)}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition-colors"
                      title="Edit Employee"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete Employee"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No employees matched your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && editingEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-scale-up">
            
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <span>{editingEmployee.id ? `Edit Employee (${editingEmployee.id})` : 'New Employee Profile'}</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSave} className="p-6 space-y-6">
              
              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">1. Personal Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Employee ID *</label>
                    <input
                      type="text"
                      required
                      value={editingEmployee.id}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, id: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editingEmployee.fullName}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, fullName: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={editingEmployee.email}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Phone</label>
                    <input
                      type="text"
                      value={editingEmployee.phone}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Profile Photo URL</label>
                    <input
                      type="text"
                      value={editingEmployee.photoUrl || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, photoUrl: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">2. Designation & Compensation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Department</label>
                    <input
                      type="text"
                      value={editingEmployee.department}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Designation / Title</label>
                    <input
                      type="text"
                      value={editingEmployee.designation}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, designation: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Employment Type</label>
                    <select
                      value={editingEmployee.employmentType}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, employmentType: e.target.value as EmploymentType })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1 bg-white"
                    >
                      <option value="full_time">Full-time</option>
                      <option value="part_time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="temporary">Temporary</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Base Salary ($ / month) *</label>
                    <input
                      type="number"
                      required
                      value={editingEmployee.basicSalary}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, basicSalary: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Date of Joining</label>
                    <input
                      type="date"
                      value={editingEmployee.joiningDate}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, joiningDate: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Work Location</label>
                    <input
                      type="text"
                      value={editingEmployee.workLocation}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, workLocation: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Bank & Statutory */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">3. Bank & Statutory IDs</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Bank Name</label>
                    <input
                      type="text"
                      value={editingEmployee.bankName}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, bankName: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Bank Account Number</label>
                    <input
                      type="text"
                      value={editingEmployee.bankAccountNumber}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, bankAccountNumber: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Tax / PAN Number</label>
                    <input
                      type="text"
                      value={editingEmployee.taxPanNumber}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, taxPanNumber: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md"
                >
                  Save Employee Profile
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
