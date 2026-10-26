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

  const [agreedRate, setAgreedRate] = useState<number | string>(1650);
  const [discountAmount, setDiscountAmount] = useState<number | string>(0);
  const [advancePaid, setAdvancePaid] = useState<number | string>(500000);
  const [paymentPlan, setPaymentPlan] = useState<'FULL_PAYMENT' | 'INSTALLMENT'>('INSTALLMENT');
  const [installmentCount, setInstallmentCount] = useState<number>(3);
  const [advanceMethod, setAdvanceMethod] = useState<'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI'>('CHEQUE');
  const [advanceRef, setAdvanceRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape & Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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
  const numAgreedRate = typeof agreedRate === 'number' ? agreedRate : Number(agreedRate) || 0;
  const numDiscount = typeof discountAmount === 'number' ? discountAmount : Number(discountAmount) || 0;
  const numAdvance = typeof advancePaid === 'number' ? advancePaid : Number(advancePaid) || 0;

  const baseTotal = plotArea * numAgreedRate;
  const finalPayable = Math.max(0, baseTotal - numDiscount);
  const remainingAfterAdvance = Math.max(0, finalPayable - numAdvance);
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-sm overflow-y-auto"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto sm:my-8 relative">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
              +
            </div>
            <h2 id="booking-modal-title" className="font-semibold text-sm tracking-tight text-white">New Plot Booking Contract</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 cursor-pointer transition-colors"
          >
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
              <label htmlFor="booking-project-select" className="font-semibold text-slate-700 block mb-1">
                Select Project *
              </label>
              <select
                id="booking-project-select"
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
              <label htmlFor="booking-plot-select" className="font-semibold text-slate-700 block mb-1">
                Available Plot * {plots.length === 0 && '(No open plots)'}
              </label>
              <select
                id="booking-plot-select"
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
              <label htmlFor="booking-customer-select" className="font-semibold text-slate-700 block mb-1">
                Customer *
              </label>
              <select
                id="booking-customer-select"
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
              <label htmlFor="booking-broker-select" className="font-semibold text-slate-700 block mb-1">
                Referring Broker (Optional)
              </label>
              <select
                id="booking-broker-select"
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
              <label htmlFor="booking-agreed-rate" className="font-semibold text-slate-700 block mb-1">
                Agreed Rate / Sq.Ft. (₹) *
              </label>
              <input
                id="booking-agreed-rate"
                type="number"
                min="1"
                value={agreedRate}
                onChange={(e) => setAgreedRate(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="booking-discount-amount" className="font-semibold text-slate-700 block mb-1">
                Special Discount (₹)
              </label>
              <input
                id="booking-discount-amount"
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value === '' ? '' : Number(e.target.value))}
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
              <label htmlFor="booking-payment-plan" className="font-semibold text-slate-700 block mb-1">
                Payment Plan *
              </label>
              <select
                id="booking-payment-plan"
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
                <label htmlFor="booking-installment-count" className="font-semibold text-slate-700 block mb-1">
                  Number of Installments *
                </label>
                <select
                  id="booking-installment-count"
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
                <label htmlFor="booking-advance-amount" className="font-semibold text-slate-700 block mb-1">
                  Advance Amount (₹)
                </label>
                <input
                  id="booking-advance-amount"
                  type="number"
                  min="0"
                  max={finalPayable}
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="booking-advance-method" className="font-semibold text-slate-700 block mb-1">
                  Payment Method
                </label>
                <select
                  id="booking-advance-method"
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
                <label htmlFor="booking-advance-ref" className="font-semibold text-slate-700 block mb-1">
                  Ref / Cheque No.
                </label>
                <input
                  id="booking-advance-ref"
                  type="text"
                  placeholder="e.g. CHQ-109281"
                  value={advanceRef}
                  onChange={(e) => setAdvanceRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {paymentPlan === 'INSTALLMENT' && (
              <p className="text-xs text-emerald-800">
                Pending balance of <strong>{formatINR(remainingAfterAdvance)}</strong> will be scheduled into{' '}
                <strong>{installmentCount} equal monthly installments</strong> (~{formatINR(installmentAmount)}/mo).
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || plots.length === 0}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              {loading ? 'Confirming Booking...' : 'Confirm Plot Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
