'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  UserPlus,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Lock,
} from 'lucide-react';
import { apiRequest, formatDate, getStoredUser } from '@/lib/api';
import { User, Role } from '@/types';

export default function EmployeesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Add Employee Modal
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<Role>('SALES_EXECUTIVE');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<User[]>('/users');
      setEmployees(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'ADMIN') {
      alert('Access restricted to Administrators only.');
      router.push('/');
      return;
    }
    setCurrentUser(user);
    loadEmployees();
  }, [router]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setSubmitting(true);
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          phone: phone || undefined,
          password,
          role,
        }),
      });

      setIsAddOpen(false);
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      loadEmployees();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean, empName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to ${currentStatus ? 'DEACTIVATE' : 'ACTIVATE'} ${empName}?`,
    );
    if (!confirmed) return;

    try {
      await apiRequest(`/users/${id}/toggle-status`, { method: 'PATCH' });
      loadEmployees();
    } catch (err: any) {
      alert(`Error changing status: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <span>Employee ID Creation & Access Control (RBAC)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create unique EMP credentials, grant role-based authorizations, and manage user statuses.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/20 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Employee ID</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by employee name, email, EMP code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Total Employees: {employees.filter((emp) => {
            const q = search.toLowerCase();
            return (
              emp.fullName.toLowerCase().includes(q) ||
              emp.employeeId.toLowerCase().includes(q) ||
              emp.email.toLowerCase().includes(q) ||
              (emp.phone && emp.phone.includes(q))
            );
          }).length}
        </span>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">EMP Code</th>
                <th className="py-3 px-4">Employee Full Name</th>
                <th className="py-3 px-4">Official Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-center">System Role</th>
                <th className="py-3 px-4 text-center">Login Status</th>
                <th className="py-3 px-4 text-center">Access Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees
                .filter((emp) => {
                  const q = search.toLowerCase();
                  return (
                    emp.fullName.toLowerCase().includes(q) ||
                    emp.employeeId.toLowerCase().includes(q) ||
                    emp.email.toLowerCase().includes(q) ||
                    (emp.phone && emp.phone.includes(q))
                  );
                })
                .map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {emp.employeeId}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {emp.fullName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {emp.email}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">
                    {emp.phone || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        emp.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : emp.role === 'SALES_EXECUTIVE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {emp.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {emp.isActive ? (
                      <span className="inline-flex items-center text-emerald-700 font-semibold text-[11px]">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-rose-700 font-semibold text-[11px]">
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Deactivated
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {emp.id === currentUser?.id ? (
                      <span className="text-[10px] text-slate-400 italic">Current Session</span>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(emp.id, emp.isActive, emp.fullName)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                          emp.isActive
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {emp.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto sm:my-8 relative">
            <div className="sticky top-0 z-20 bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shadow-sm">
              <h2 className="font-bold text-sm">Create New Employee ID & Login</h2>
              <button onClick={() => setIsAddOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-3.5 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Employee Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Meenakshi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Official Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="staff@mspproperties.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="tel"
                  placeholder="9842012345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">System Authorization Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="SALES_EXECUTIVE">Sales Executive (Plots, Bookings, Customers)</option>
                  <option value="ACCOUNTS_EXECUTIVE">Accounts Executive (Collections, Receipts, Installments)</option>
                  <option value="ADMIN">Super Administrator (Full System Control & Settings)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-md shadow-emerald-900/20 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Creating ID...' : 'Generate Employee ID'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
