'use client';

import React, { useState, useEffect } from 'react';
import { Handshake, Search, PlusCircle, X, AlertCircle, Phone, Award } from 'lucide-react';
import { apiRequest, formatINR } from '@/lib/api';
import { Broker } from '@/types';

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Add Broker Modal
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [agencyName, setAgencyName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [commissionType, setCommissionType] = useState<'PERCENTAGE' | 'FIXED_PER_SQFT'>('PERCENTAGE');
  const [commissionValue, setCommissionValue] = useState<number>(1.5);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadBrokers = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<Broker[]>(`/brokers?search=${encodeURIComponent(search)}`);
      setBrokers(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBrokers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreateBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setSubmitting(true);
      await apiRequest('/brokers', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          phone,
          agencyName: agencyName || undefined,
          email: email || undefined,
          address: address || undefined,
          commissionType,
          defaultCommissionValue: Number(commissionValue),
        }),
      });

      setIsAddOpen(false);
      setFullName('');
      setPhone('');
      setAgencyName('');
      setEmail('');
      setAddress('');
      loadBrokers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Handshake className="w-6 h-6 text-emerald-600" />
            <span>Broker Directory & Commission Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track referring agents, commission agreements, client referrals, and payout status.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/20 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Broker</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by broker name, phone, agency, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Registered Brokers: {brokers.length}
        </span>
      </div>

      {/* Brokers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {brokers.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-xs text-slate-600 px-2 py-0.5 rounded bg-slate-100">
                  {b.brokerCode}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {b.commissionType === 'PERCENTAGE'
                    ? `${b.defaultCommissionValue}% Commission`
                    : `₹${b.defaultCommissionValue}/Sqft`}
                </span>
              </div>

              <h3 className="font-black text-slate-900 text-base">{b.fullName}</h3>
              <p className="text-xs text-emerald-700 font-medium">{b.agencyName || 'Independent Real Estate Agent'}</p>

              <div className="mt-3 space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <p className="flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{b.phone}</span>
                </p>
                {b.address && <p className="text-[11px] text-slate-400">{b.address}</p>}
              </div>
            </div>

            {/* Performance Stats */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-2.5 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Referrals</span>
                <span className="font-bold text-slate-900">{b.referralCount || 0} Deals</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sales Volume</span>
                <span className="font-bold text-slate-900 font-mono text-[11px]">
                  {formatINR(b.totalSalesVolume)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Earned Comm</span>
                <span className="font-bold text-emerald-700 font-mono text-[11px]">
                  {formatINR(b.totalCommission)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Broker Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto sm:my-8 relative">
            <div className="sticky top-0 z-20 bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shadow-sm">
              <h2 className="font-bold text-sm">Register New Broker / Advisor</h2>
              <button onClick={() => setIsAddOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBroker} className="p-6 space-y-3.5 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Broker Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9842100001"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Agency / Firm Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Realty"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="broker@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Office Address</label>
                <input
                  type="text"
                  placeholder="Office street, city"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Commission Model</label>
                  <select
                    value={commissionType}
                    onChange={(e) => setCommissionType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="PERCENTAGE">Percentage of Sale (%)</option>
                    <option value="FIXED_PER_SQFT">Fixed Rate per Sq.Ft (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {commissionType === 'PERCENTAGE' ? 'Default Rate (%)' : 'Rate / Sq.Ft. (₹)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
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
                  {submitting ? 'Registering...' : 'Register Broker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
