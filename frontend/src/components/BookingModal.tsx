'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Calculator, Building, User, Handshake, AlertCircle } from 'lucide-react';
import { apiRequest, formatINR } from '@/lib/api';
import { Project, Plot, Customer, Broker } from '@/types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (booking: any) => void;
  preselectedPlotId?: string;
}

export default function BookingModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedPlotId,
}: BookingModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string>(preselectedPlotId || '');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>('');

  const [agreedRate, setAgreedRate] = useState<number>(1650);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [advancePaid, setAdvancePaid] = useState<number>(500000);
  const [paymentPlan, setPaymentPlan] = useState<'FULL_PAYMENT' | 'INSTALLMENT'>('INSTALLMENT');
  const [installmentCount, setInstallmentCount] = useState<number>(3);
  const [advanceMethod, setAdvanceMethod] = useState<'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI'>('CHEQUE');
  const [advanceRef, setAdvanceRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial dropdown data
  useEffect(() => {
    if (!isOpen) return;

    async function fetchData() {
      try {
        const [projRes, custRes, brokRes] = await Promise.all([
          apiRequest<Project[]>('/projects'),
          apiRequest<Customer[]>('/customers'),
          apiRequest<Broker[]>('/brokers'),
        ]);

        setProjects(projRes);
        setCustomers(custRes);
        setBrokers(brokRes);

        if (projRes.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projRes[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      }
    }
    fetchData();
  }, [isOpen]);

  // Load plots when selected project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    async function loadPlots() {
      try {
        const plotRes = await apiRequest<Plot[]>(`/projects/${selectedProjectId}/plots?status=AVAILABLE`);
        setPlots(plotRes);
        if (preselectedPlotId) {
          setSelectedPlotId(preselectedPlotId);
        } else if (plotRes.length > 0) {
          setSelectedPlotId(plotRes[0].id);
        }
      } catch (err: any) {
        console.error(err);
      }
    }
    loadPlots();
  }, [selectedProjectId, preselectedPlotId]);

  // When plot changes, update default rate
  const selectedPlot = plots.find((p) => p.id === selectedPlotId);
  useEffect(() => {
    if (selectedPlot) {
      setAgreedRate(Number(selectedPlot.ratePerSqFt));
    }
  }, [selectedPlot]);

  // Financial calculations
  const plotArea = selectedPlot ? Number(selectedPlot.areaSqFt) : 1200;
  const baseTotal = plotArea * agreedRate;
  const finalPayable = Math.max(0, baseTotal - Number(discountAmount || 0));
  const remainingAfterAdvance = Math.max(0, finalPayable - Number(advancePaid || 0));
  const installmentAmount =
    paymentPlan === 'INSTALLMENT' && installmentCount > 0
      ? Math.round(remainingAfterAdvance / installmentCount)
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPlotId) {
      setError('Please select an available plot');
      return;
    }
    if (!selectedCustomerId) {
      setError('Please select a customer');
      return;
    }

    try {
      setLoading(true);
      const res = await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          plotId: selectedPlotId,
          brokerId: selectedBrokerId || undefined,
          agreedRatePerSqFt: Number(agreedRate),
          discountAmount: Number(discountAmount) || 0,
          bookingAdvancePaid: Number(advancePaid) || 0,
          paymentPlan,
          installmentCount: paymentPlan === 'INSTALLMENT' ? Number(installmentCount) : 1,
          advancePaymentMethod: advanceMethod,
          advancePaymentReference: advanceRef || 'Booking Advance',
          notes,
        }),
      });

      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto sm:my-8 relative">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base">New Plot Booking Contract</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Project & Plot Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Select Project *</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Available Plot * {plots.length === 0 && '(No open plots)'}
              </label>
              <select
                value={selectedPlotId}
                onChange={(e) => setSelectedPlotId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {plots.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    Plot {pl.plotNumber} ({Number(pl.areaSqFt).toLocaleString('en-IN')} sqft - {pl.facing} Facing)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer & Broker Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Customer *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.phone}) [{c.customerCode}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Referring Broker (Optional)</label>
              <select
                value={selectedBrokerId}
                onChange={(e) => setSelectedBrokerId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="">-- Direct Sale (No Broker) --</option>
                {brokers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.fullName} - {b.agencyName || 'Independent'} [{b.brokerCode}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rate & Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Agreed Rate / Sq.Ft. (₹) *</label>
              <input
                type="number"
                min="1"
                value={agreedRate}
                onChange={(e) => setAgreedRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Special Discount (₹)</label>
              <input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Pricing Calculator Summary Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Plot Extent:</span>
              <span className="font-semibold text-slate-900">{plotArea.toLocaleString('en-IN')} Sq.Ft.</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Base Plot Value:</span>
              <span className="font-semibold text-slate-900">{formatINR(baseTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold border-t border-slate-200 pt-1 text-sm">
              <span>Net Final Payable:</span>
              <span className="text-emerald-700">{formatINR(finalPayable)}</span>
            </div>
          </div>

          {/* Payment Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Payment Plan *</label>
              <select
                value={paymentPlan}
                onChange={(e) => setPaymentPlan(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="INSTALLMENT">Advance + Installments</option>
                <option value="FULL_PAYMENT">Full Down Payment</option>
              </select>
            </div>

            {paymentPlan === 'INSTALLMENT' && (
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Number of Installments *</label>
                <select
                  value={installmentCount}
                  onChange={(e) => setInstallmentCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value={2}>2 Monthly Installments</option>
                  <option value={3}>3 Monthly Installments</option>
                  <option value={4}>4 Monthly Installments</option>
                  <option value={6}>6 Monthly Installments</option>
                </select>
              </div>
            )}
          </div>

          {/* Advance Collection Details */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-emerald-50/30 space-y-3">
            <span className="font-bold text-emerald-900 block text-xs">
              Booking Token / Advance Payment
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Advance Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  max={finalPayable}
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={advanceMethod}
                  onChange={(e) => setAdvanceMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="CHEQUE">Cheque</option>
                  <option value="UPI">UPI / GPay</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ref / Cheque No.</label>
                <input
                  type="text"
                  placeholder="e.g. CHQ-109281"
                  value={advanceRef}
                  onChange={(e) => setAdvanceRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {paymentPlan === 'INSTALLMENT' && (
              <p className="text-[11px] text-emerald-800">
                Pending balance of <strong>{formatINR(remainingAfterAdvance)}</strong> will be scheduled into{' '}
                <strong>{installmentCount} equal monthly installments</strong> (~{formatINR(installmentAmount)}/mo).
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || plots.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold shadow-md shadow-emerald-900/20 cursor-pointer"
            >
              {loading ? 'Confirming Booking...' : 'Confirm Plot Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
