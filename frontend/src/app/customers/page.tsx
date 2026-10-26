'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Users, PlusCircle, Eye, X, AlertCircle } from 'lucide-react';
import { apiRequest, formatINR, formatDate } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { useDebounce } from '@/lib/useDebounce';
import { Customer } from '@/types';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { TruncatedCell } from '@/components/ui/Tooltip';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function CustomersPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const debouncedSearch = useDebounce(search, 300);

  // Add Customer Modal
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [alternatePhone, setAlternatePhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [idProofType, setIdProofType] = useState<string>('Aadhaar');
  const [idProofNumber, setIdProofNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // View Customer Drawer
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const loadCustomers = async (query = debouncedSearch) => {
    try {
      setLoading(true);
      const res = await apiRequest<Customer[]>(`/customers?search=${encodeURIComponent(query)}`);
      setCustomers(res);
    } catch (err: unknown) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers(debouncedSearch);
  }, [debouncedSearch]);

  // Esc key closes modal or drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddOpen(false);
        setSelectedCustomer(null);
      }
    };
    if (isAddOpen || selectedCustomer) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAddOpen, selectedCustomer]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setSubmitting(true);
      await apiRequest('/customers', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          phone,
          alternatePhone: alternatePhone || undefined,
          email: email || undefined,
          address: address || undefined,
          idProofType,
          idProofNumber: idProofNumber || undefined,
          notes: notes || undefined,
        }),
      });

      setIsAddOpen(false);
      setFullName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setIdProofNumber('');
      setNotes('');
      toast.success('Customer record added successfully!');
      loadCustomers(debouncedSearch);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save customer';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewCustomer = async (id: string) => {
    try {
      const details = await apiRequest(`/customers/${id}`);
      setSelectedCustomer(details);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Could not load customer details: ${msg}`);
    }
  };

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        key: 'customerCode',
        header: 'Customer ID',
        sortable: true,
        width: '120px',
        render: (c) => (
          <span className="font-mono font-bold text-slate-800 tracking-tight">
            {c.customerCode}
          </span>
        ),
      },
      {
        key: 'fullName',
        header: 'Customer Name',
        sortable: true,
        render: (c) => (
          <div>
            <p className="font-semibold text-slate-900 leading-tight">{c.fullName}</p>
            {c.address && (
              <TruncatedCell
                content={c.address}
                maxWidth="max-w-[180px]"
                className="text-slate-500 font-normal"
              />
            )}
          </div>
        ),
      },
      {
        key: 'phone',
        header: 'Phone / Email',
        sortable: true,
        render: (c) => (
          <div>
            <p className="font-mono font-medium text-slate-800 leading-tight">{c.phone}</p>
            {c.email && (
              <TruncatedCell
                content={c.email}
                maxWidth="max-w-[140px]"
                className="text-slate-500 text-[11px]"
              />
            )}
          </div>
        ),
      },
      {
        key: 'totalBookings',
        header: 'Bookings',
        sortable: true,
        align: 'center',
        render: (c) => (
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800 font-mono">
            {c.totalBookings || 0}
          </span>
        ),
      },
      {
        key: 'totalCommitted',
        header: 'Committed Value',
        sortable: true,
        align: 'right',
        render: (c) => (
          <span className="font-mono font-semibold text-slate-900 tracking-tight">
            {formatINR(c.totalCommitted)}
          </span>
        ),
      },
      {
        key: 'totalPaid',
        header: 'Total Realized',
        sortable: true,
        align: 'right',
        render: (c) => (
          <span className="font-mono font-bold text-emerald-700 tracking-tight">
            {formatINR(c.totalPaid)}
          </span>
        ),
      },
      {
        key: 'pendingBalance',
        header: 'Outstanding Balance',
        sortable: true,
        align: 'right',
        render: (c) => {
          const balance = c.pendingBalance || 0;
          return balance > 0 ? (
            <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {formatINR(balance)}
            </span>
          ) : (
            <span className="font-mono text-xs text-slate-400 font-medium">₹0 (Clear)</span>
          );
        },
      },
      {
        key: 'actions',
        header: 'Profile',
        align: 'center',
        render: (c) => (
          <button
            type="button"
            onClick={() => handleViewCustomer(c.id)}
            className="p-1 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
            title="View Full Profile & Bookings"
            aria-label={`View profile for ${c.fullName}`}
          >
            <Eye className="w-4 h-4 text-slate-700" />
          </button>
        ),
      },
    ],
    [],
  );

  return (
    <ErrorBoundary componentName="CustomerDirectory">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <Users className="w-5 h-5 text-emerald-700" />
              <span>Customer Directory & Financial Ledgers</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Maintain centralized contact profiles, booking history, verified KYC, and collection balances.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add New Customer</span>
          </button>
        </div>

        {/* Enterprise Data Grid */}
        <DataTable<Customer>
          data={customers}
          columns={columns}
          keyExtractor={(item) => item.id}
          loading={loading}
          searchPlaceholder="Search by customer name, phone, code (e.g. CUST-1001)..."
          externalSearchValue={search}
          onSearchChange={setSearch}
          emptyTitle="No customers found"
          emptyDescription="No customer records exist matching your search criteria."
          ariaLabel="Customer directory ledger"
        />

        {/* Add Customer Modal */}
        {isAddOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-xs overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-cust-title"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 my-auto relative">
              <div className="sticky top-0 z-20 bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shadow-xs">
                <h2 id="add-cust-title" className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  Add New Customer Record
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

              <form onSubmit={handleCreateCustomer} className="p-5 space-y-3 text-xs">
                {error && (
                  <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="cust-name" className="font-semibold text-slate-700 block mb-1">
                    Customer Full Name *
                  </label>
                  <input
                    id="cust-name"
                    type="text"
                    required
                    placeholder="e.g. S. Murugesan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cust-phone" className="font-semibold text-slate-700 block mb-1">
                      Primary Phone *
                    </label>
                    <input
                      id="cust-phone"
                      type="tel"
                      required
                      placeholder="9842100000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-300 font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label htmlFor="cust-alt-phone" className="font-semibold text-slate-700 block mb-1">
                      Alternate Phone
                    </label>
                    <input
                      id="cust-alt-phone"
                      type="tel"
                      placeholder="Optional"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-300 font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cust-email" className="font-semibold text-slate-700 block mb-1">Email Address</label>
                  <input
                    id="cust-email"
                    type="email"
                    placeholder="name@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="cust-address" className="font-semibold text-slate-700 block mb-1">Postal Address</label>
                  <input
                    id="cust-address"
                    type="text"
                    placeholder="Door No, Street, City, Pincode"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cust-id-type" className="font-semibold text-slate-700 block mb-1">ID Proof Type</label>
                    <select
                      id="cust-id-type"
                      value={idProofType}
                      onChange={(e) => setIdProofType(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                    >
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Driving License">Driving License</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="cust-id-num" className="font-semibold text-slate-700 block mb-1">ID Proof Number</label>
                    <input
                      id="cust-id-num"
                      type="text"
                      placeholder="e.g. 1234-5678-9012"
                      value={idProofNumber}
                      onChange={(e) => setIdProofNumber(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-300 font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cust-notes" className="font-semibold text-slate-700 block mb-1">Notes / Preferences</label>
                  <textarea
                    id="cust-notes"
                    rows={2}
                    placeholder="Plot interest, budget, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
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
                    {submitting ? 'Saving...' : 'Save Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Customer Details Drawer / Modal */}
        {selectedCustomer && (
          <div
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-xs overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-cust-title"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-auto relative">
              <div className="sticky top-0 z-20 bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shadow-xs">
                <div>
                  <h2 id="view-cust-title" className="font-bold text-sm text-slate-100">{selectedCustomer.fullName}</h2>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ID: {selectedCustomer.customerCode} • Phone: {selectedCustomer.phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  aria-label="Close dialog"
                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
                {/* Profile Box */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Address</span>
                    <p className="text-slate-800 font-medium mt-0.5">{selectedCustomer.address || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">KYC Verification</span>
                    <p className="text-slate-800 font-medium mt-0.5">
                      {selectedCustomer.idProofType}: {selectedCustomer.idProofNumber || 'Pending'}
                    </p>
                  </div>
                </div>

                {/* Booking Contracts */}
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">Plot Contracts</h3>
                  {(!selectedCustomer.bookings || selectedCustomer.bookings.length === 0) ? (
                    <p className="text-slate-400 italic">No bookings recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCustomer.bookings.map((bk: any) => (
                        <div key={bk.id} className="p-3 border border-slate-200 rounded-lg bg-white space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">
                              Plot #{bk.plot?.plotNumber} in {bk.plot?.project?.name}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {bk.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-slate-600 font-mono text-[11px]">
                            <div>
                              <span className="text-slate-400">Payable: </span>
                              <span className="font-semibold text-slate-900">{formatINR(bk.finalPayableAmount)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Advance: </span>
                              <span className="font-semibold text-emerald-700">{formatINR(bk.bookingAdvancePaid)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Plan: </span>
                              <span className="font-semibold text-slate-800">{bk.paymentPlan}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payments History */}
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">Receipt History</h3>
                  {(!selectedCustomer.payments || selectedCustomer.payments.length === 0) ? (
                    <p className="text-slate-400 italic">No payments recorded yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                      {selectedCustomer.payments.map((pm: any) => (
                        <div key={pm.id} className="p-2.5 flex items-center justify-between bg-white text-xs">
                          <div>
                            <p className="font-mono font-bold text-slate-800">{pm.receiptNumber}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {formatDate(pm.paymentDate)} • {pm.paymentMethod}
                            </p>
                          </div>
                          <span className="font-mono font-bold tracking-tight text-emerald-700 text-xs">
                            {formatINR(pm.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
