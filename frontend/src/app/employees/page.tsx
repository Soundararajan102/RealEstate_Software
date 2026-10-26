'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { apiRequest, getStoredUser } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { useDebounce } from '@/lib/useDebounce';
import { User, Role } from '@/types';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function EmployeesPage() {
  const router = useRouter();
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const debouncedSearch = useDebounce(search, 300);

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
    } catch (err: unknown) {
      console.error('Failed to load employees:', err);
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
      toast.error('Access restricted to Administrators only.');
      router.push('/');
      return;
    }
    setCurrentUser(user);
    loadEmployees();
  }, [router]);

  // Esc key closes modal
  useEffect(() => {
    if (!isAddOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAddOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAddOpen]);

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
      toast.success('Employee credentials issued successfully!');
      loadEmployees();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user';
      setError(msg);
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
      toast.success(`Access status for ${empName} updated.`);
      loadEmployees();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(`Error changing status: ${msg}`);
    }
  };

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        key: 'employeeId',
        header: 'EMP ID',
        sortable: true,
        width: '120px',
        render: (emp) => (
          <span className="font-mono font-bold text-slate-900 tracking-tight">
            {emp.employeeId}
          </span>
        ),
      },
      {
        key: 'fullName',
        header: 'Full Name',
        sortable: true,
        render: (emp) => (
          <span className="font-semibold text-slate-900 leading-tight">
            {emp.fullName}
          </span>
        ),
      },
      {
        key: 'email',
        header: 'Official Email',
        sortable: true,
        render: (emp) => (
          <span className="text-slate-600 font-mono text-[11px]">
            {emp.email}
          </span>
        ),
      },
      {
        key: 'phone',
        header: 'Contact Phone',
        sortable: true,
        render: (emp) => (
          <span className="text-slate-500 font-mono text-[11px]">
            {emp.phone || '—'}
          </span>
        ),
      },
      {
        key: 'role',
        header: 'System Role',
        sortable: true,
        align: 'center',
        render: (emp) => (
          <span
            className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              emp.role === 'ADMIN'
                ? 'bg-slate-900 text-white'
                : emp.role === 'SALES_EXECUTIVE'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {emp.role.replace('_', ' ')}
          </span>
        ),
      },
      {
        key: 'isActive',
        header: 'Status',
        sortable: true,
        align: 'center',
        render: (emp) =>
          emp.isActive ? (
            <span className="inline-flex items-center text-emerald-700 font-semibold text-xs">
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center text-rose-700 font-semibold text-xs">
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Deactivated
            </span>
          ),
      },
      {
        key: 'actions',
        header: 'Access Control',
        align: 'center',
        render: (emp) =>
          emp.id === currentUser?.id ? (
            <span className="text-slate-400 text-xs italic font-medium">Current Session</span>
          ) : (
            <button
              type="button"
              onClick={() => handleToggleStatus(emp.id, emp.isActive, emp.fullName)}
              className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer border transition-colors shadow-2xs ${
                emp.isActive
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {emp.isActive ? 'Deactivate' : 'Activate'}
            </button>
          ),
      },
    ],
    [currentUser],
  );

  return (
    <ErrorBoundary componentName="EmployeesDirectory">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <span>Employee Access Control (RBAC)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Issue unique employee IDs, grant role-based authorizations, and manage active session statuses.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Employee ID</span>
          </button>
        </div>

        {/* Enterprise Data Grid */}
        <DataTable<User>
          data={employees}
          columns={columns}
          keyExtractor={(item) => item.id}
          loading={loading}
          searchPlaceholder="Search by employee name, email, EMP code..."
          externalSearchValue={search}
          onSearchChange={setSearch}
          emptyTitle="No employees found"
          emptyDescription="No employee records match the search query."
          ariaLabel="Employee user directory"
        />

        {/* Add Employee Modal */}
        {isAddOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-xs overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-emp-title"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 my-auto relative">
              <div className="sticky top-0 z-20 bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shadow-xs">
                <h2 id="add-emp-title" className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  Create New Employee ID & Login
                </h2>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  aria-label="Close dialog"
                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateEmployee} className="p-5 space-y-3 text-xs">
                {error && (
                  <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="emp-name" className="font-semibold text-slate-700 block mb-1">
                    Employee Full Name *
                  </label>
                  <input
                    id="emp-name"
                    type="text"
                    required
                    placeholder="e.g. S. Meenakshi"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="emp-email" className="font-semibold text-slate-700 block mb-1">
                    Official Email Address *
                  </label>
                  <input
                    id="emp-email"
                    type="email"
                    required
                    placeholder="staff@mspproperties.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="emp-phone" className="font-semibold text-slate-700 block mb-1">Contact Phone</label>
                  <input
                    id="emp-phone"
                    type="tel"
                    placeholder="9842012345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="emp-role" className="font-semibold text-slate-700 block mb-1">System Authorization Role *</label>
                  <select
                    id="emp-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  >
                    <option value="SALES_EXECUTIVE">Sales Executive (Plots, Bookings, Customers)</option>
                    <option value="ACCOUNTS_EXECUTIVE">Accounts Executive (Collections, Receipts, Installments)</option>
                    <option value="ADMIN">Super Administrator (Full System Control & Settings)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="emp-password" className="font-semibold text-slate-700 block mb-1">Initial Password *</label>
                  <input
                    id="emp-password"
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Creating ID...' : 'Generate Employee ID'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
