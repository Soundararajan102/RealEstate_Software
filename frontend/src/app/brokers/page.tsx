'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Handshake, PlusCircle, X, AlertCircle } from 'lucide-react';
import { apiRequest, formatINR } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { useDebounce } from '@/lib/useDebounce';
import { Broker } from '@/types';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { TruncatedCell } from '@/components/ui/Tooltip';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function BrokersPage() {
  const toast = useToast();
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const debouncedSearch = useDebounce(search, 300);

  // Add Broker Modal
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [agencyName, setAgencyName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [commissionType, setCommissionType] = useState<'PERCENTAGE' | 'FIXED_PER_SQFT'>('PERCENTAGE');
  const [commissionValue, setCommissionValue] = useState<number | string>(1.5);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadBrokers = async (query = debouncedSearch) => {
    try {
      setLoading(true);
      const res = await apiRequest<Broker[]>(`/brokers?search=${encodeURIComponent(query)}`);
      setBrokers(res);
    } catch (err: unknown) {
      console.error('Failed to load brokers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrokers(debouncedSearch);
  }, [debouncedSearch]);

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
          defaultCommissionValue: Number(commissionValue) || 0,
        }),
      });

      setIsAddOpen(false);
      setFullName('');
      setPhone('');
      setAgencyName('');
      setEmail('');
      setAddress('');
      toast.success('Broker registered successfully!');
      loadBrokers(debouncedSearch);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register broker';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo<ColumnDef<Broker>[]>(
    () => [
      {
        key: 'brokerCode',
        header: 'Broker ID',
        sortable: true,
        width: '120px',
        render: (b) => (
          <span className="font-mono font-bold text-slate-800 tracking-tight">
            {b.brokerCode}
          </span>
        ),
      },
      {
        key: 'fullName',
        header: 'Broker & Agency',
        sortable: true,
        render: (b) => (
          <div>
            <p className="font-semibold text-slate-900 leading-tight">{b.fullName}</p>
            <p className="text-[11px] text-emerald-700 font-medium leading-tight">
              {b.agencyName || 'Independent Real Estate Agent'}
            </p>
          </div>
        ),
      },
      {
        key: 'phone',
        header: 'Phone / Location',
        sortable: true,
        render: (b) => (
          <div>
            <p className="font-mono font-medium text-slate-800 leading-tight">{b.phone}</p>
            {b.address && (
              <TruncatedCell
                content={b.address}
                maxWidth="max-w-[160px]"
                className="text-slate-500 font-normal"
              />
            )}
          </div>
        ),
      },
      {
        key: 'defaultCommissionValue',
        header: 'Commission Term',
        sortable: true,
        align: 'center',
        render: (b) => (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {b.commissionType === 'PERCENTAGE'
              ? `${b.defaultCommissionValue}% Sales Val`
              : `₹${b.defaultCommissionValue}/Sq.Ft`}
          </span>
        ),
      },
      {
        key: 'referralCount',
        header: 'Deals Closed',
        sortable: true,
        align: 'center',
        render: (b) => (
          <span className="font-mono font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100">
            {b.referralCount || 0}
          </span>
        ),
      },
      {
        key: 'totalSalesVolume',
        header: 'Sales Volume',
        sortable: true,
        align: 'right',
        render: (b) => (
          <span className="font-mono font-semibold text-slate-900 tracking-tight">
            {formatINR(b.totalSalesVolume)}
          </span>
        ),
      },
      {
        key: 'totalCommission',
        header: 'Earned Commission',
        sortable: true,
        align: 'right',
        render: (b) => (
          <span className="font-mono font-bold text-emerald-700 tracking-tight">
            {formatINR(b.totalCommission)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <ErrorBoundary componentName="BrokersLedger">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <Handshake className="w-5 h-5 text-emerald-700" />
              <span>Broker Directory & Commission Ledger</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage channel partners, agreed commission schedules, client referrals, and payout volumes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Register New Broker</span>
          </button>
        </div>

        {/* Enterprise Data Grid */}
        <DataTable<Broker>
          data={brokers}
          columns={columns}
          keyExtractor={(item) => item.id}
          loading={loading}
          searchPlaceholder="Search brokers by name, phone, agency, or ID..."
          externalSearchValue={search}
          onSearchChange={setSearch}
          emptyTitle="No brokers found"
          emptyDescription="No registered channel partners or brokers match your criteria."
          ariaLabel="Broker and channel partner directory"
        />

        {/* Add Broker Modal */}
        {isAddOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-xs overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-broker-title"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 my-auto relative">
              <div className="sticky top-0 z-20 bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shadow-xs">
                <h2 id="add-broker-title" className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  Register New Broker / Advisor
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

              <form onSubmit={handleCreateBroker} className="p-5 space-y-3 text-xs">
                {error && (
                  <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="broker-name" className="font-semibold text-slate-700 block mb-1">
                    Broker Full Name *
                  </label>
                  <input
                    id="broker-name"
                    type="text"
                    required
                    placeholder="e.g. S. Ramesh Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="broker-phone" className="font-semibold text-slate-700 block mb-1">
                      Phone Number *
                    </label>
                    <input
                      id="broker-phone"
                      type="tel"
                      required
                      placeholder="9840000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-300 font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label htmlFor="broker-agency" className="font-semibold text-slate-700 block mb-1">
                      Agency Name
                    </label>
                    <input
                      id="broker-agency"
                      type="text"
                      placeholder="e.g. MSP Realtors"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-300 font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="broker-email" className="font-semibold text-slate-700 block mb-1">Email Address</label>
                  <input
                    id="broker-email"
                    type="email"
                    placeholder="broker@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="broker-address" className="font-semibold text-slate-700 block mb-1">Office / Base Location</label>
                  <input
                    id="broker-address"
                    type="text"
                    placeholder="Area, City"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="comm-type" className="font-semibold text-slate-700 block mb-1">Commission Type</label>
                    <select
                      id="comm-type"
                      value={commissionType}
                      onChange={(e) => setCommissionType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                    >
                      <option value="PERCENTAGE">Percentage of Value</option>
                      <option value="FIXED_PER_SQFT">Fixed per Sq. Ft.</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="comm-val" className="font-semibold text-slate-700 block mb-1">
                      {commissionType === 'PERCENTAGE' ? 'Default %' : 'Rate (₹/SqFt)'}
                    </label>
                    <input
                      id="comm-val"
                      type="number"
                      step="any"
                      required
                      value={commissionValue}
                      onChange={(e) => setCommissionValue(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-300 font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                    />
                  </div>
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
                    {submitting ? 'Registering...' : 'Save Broker'}
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
