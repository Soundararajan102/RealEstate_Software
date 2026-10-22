'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, PlusCircle, Phone, Mail, MapPin, Eye, X, AlertCircle } from 'lucide-react';
import { apiRequest, formatINR, formatDate } from '@/lib/api';
import { Customer } from '@/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

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

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<Customer[]>(`/customers?search=${encodeURIComponent(search)}`);
      setCustomers(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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
      loadCustomers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewCustomer = async (id: string) => {
    try {
      const details = await apiRequest(`/customers/${id}`);
      setSelectedCustomer(details);
    } catch (err: any) {
      alert(`Could not load customer details: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Customer Directory & Ledgers</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain centralized contact profiles, booking history, and collection balances.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/20 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, phone, code (e.g. CUST-1001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Total Customers: {customers.length}
        </span>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone / Email</th>
                <th className="py-3 px-4 text-center">Bookings</th>
                <th className="py-3 px-4 text-right">Committed</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Pending Balance</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {c.customerCode}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {c.fullName}
                      {c.address && (
                        <p className="text-[11px] font-normal text-slate-500 truncate max-w-xs">
                          {c.address}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{c.phone}</p>
                      {c.email && <p className="text-[11px] text-slate-400">{c.email}</p>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {c.totalBookings || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                      {formatINR(c.totalCommitted)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-700">
                      {formatINR(c.totalPaid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      {(c.pendingBalance || 0) > 0 ? (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {formatINR(c.pendingBalance)}
                        </span>
                      ) : (
                        <span className="text-slate-400">₹0 (Clear)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleViewCustomer(c.id)}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                        title="View Full Profile & Bookings"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto sm:my-8 relative">
            <div className="sticky top-0 z-20 bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shadow-sm">
              <h2 className="font-bold text-sm">Add New Customer Record</h2>
              <button onClick={() => setIsAddOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-3.5 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Murugesan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Primary Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9842100000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Alternate Phone</label>
                  <input
                    type="tel"
                    placeholder="Optional"
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Door No, Street, City, Pincode"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ID Proof Type</label>
                  <select
                    value={idProofType}
                    onChange={(e) => setIdProofType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Driving License">Driving License</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ID Proof Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 1234-5678-9012"
                    value={idProofNumber}
                    onChange={(e) => setIdProofNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notes / Preferences</label>
                <textarea
                  rows={2}
                  placeholder="Plot interest, budget, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  {submitting ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto sm:my-8 relative">
            <div className="sticky top-0 z-20 bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shadow-sm">
              <div>
                <h2 className="font-bold text-base">{selectedCustomer.fullName}</h2>
                <p className="text-[11px] text-emerald-400 font-mono">
                  ID: {selectedCustomer.customerCode} • Phone: {selectedCustomer.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {/* Profile Box */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Address</span>
                  <p className="text-slate-800 font-medium">{selectedCustomer.address || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">ID Proof</span>
                  <p className="text-slate-800 font-medium">
                    {selectedCustomer.idProofType}: {selectedCustomer.idProofNumber || '-'}
                  </p>
                </div>
              </div>

              {/* Booking Contracts */}
              <div>
                <h3 className="font-bold text-sm text-slate-900 mb-2">Plot Bookings & Contracts</h3>
                {(!selectedCustomer.bookings || selectedCustomer.bookings.length === 0) ? (
                  <p className="text-slate-400 italic">No bookings recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedCustomer.bookings.map((bk: any) => (
                      <div key={bk.id} className="p-3.5 border border-slate-200 rounded-xl bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            Plot {bk.plot?.plotNumber} in {bk.plot?.project?.name}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {bk.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
                          <div>
                            <span>Payable: </span>
                            <span className="font-semibold">{formatINR(bk.finalPayableAmount)}</span>
                          </div>
                          <div>
                            <span>Advance Paid: </span>
                            <span className="font-semibold text-emerald-700">{formatINR(bk.bookingAdvancePaid)}</span>
                          </div>
                          <div>
                            <span>Plan: </span>
                            <span className="font-semibold">{bk.paymentPlan}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payments History */}
              <div>
                <h3 className="font-bold text-sm text-slate-900 mb-2">Payment Receipts</h3>
                {(!selectedCustomer.payments || selectedCustomer.payments.length === 0) ? (
                  <p className="text-slate-400 italic">No payments recorded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedCustomer.payments.map((pm: any) => (
                      <div key={pm.id} className="p-3 flex items-center justify-between bg-white text-xs">
                        <div>
                          <p className="font-mono font-bold text-slate-800">{pm.receiptNumber}</p>
                          <p className="text-[11px] text-slate-400">{formatDate(pm.paymentDate)} • {pm.paymentMethod}</p>
                        </div>
                        <span className="font-mono font-bold text-emerald-700 text-sm">
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
  );
}
