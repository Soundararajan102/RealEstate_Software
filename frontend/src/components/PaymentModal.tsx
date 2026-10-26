'use client';

import React, { useState, useEffect } from 'react';
import { X, Receipt, AlertCircle } from 'lucide-react';
import { apiRequest, formatINR } from '@/lib/api';
import { Booking } from '@/types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payment: any) => void;
  preselectedBookingId?: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedBookingId,
}: PaymentModalProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>(preselectedBookingId || '');
  const [amount, setAmount] = useState<number | string>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI'>('UPI');
  const [reference, setReference] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
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

  useEffect(() => {
    if (!isOpen) return;
    async function loadActiveBookings() {
      try {
        const res = await apiRequest<Booking[]>('/bookings?status=ACTIVE');
        setBookings(res);

        if (preselectedBookingId) {
          setSelectedBookingId(preselectedBookingId);
        } else if (res.length > 0) {
          setSelectedBookingId(res[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      }
    }
    loadActiveBookings();
  }, [isOpen, preselectedBookingId]);

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId);
  const pendingBalance = selectedBooking ? selectedBooking.pendingBalance || 0 : 0;

  // Prefill next installment amount if available
  useEffect(() => {
    if (selectedBooking && selectedBooking.installments) {
      const nextPending = selectedBooking.installments.find(
        (i) => i.status === 'PENDING' || i.status === 'PARTIALLY_PAID',
      );
      if (nextPending) {
        const remainingOnInst = Number(nextPending.expectedAmount) - Number(nextPending.paidAmount);
        setAmount(remainingOnInst > 0 ? remainingOnInst : pendingBalance);
      } else {
        setAmount(pendingBalance);
      }
    }
  }, [selectedBooking, pendingBalance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = typeof amount === 'number' ? amount : Number(amount) || 0;

    if (!selectedBookingId) {
      setError('Please select an active booking contract');
      return;
    }
    if (numAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }
    if (numAmount > pendingBalance) {
      setError(`Amount cannot exceed the pending balance of ${formatINR(pendingBalance)}`);
      return;
    }

    try {
      setLoading(true);
      const paymentRes = await apiRequest('/payments', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: selectedBookingId,
          amount: numAmount,
          paymentMethod,
          transactionReference: reference || undefined,
          bankName: bankName || undefined,
          notes: notes || undefined,
        }),
      });

      onSuccess(paymentRes);
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
      aria-labelledby="payment-modal-title"
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-sm overflow-y-auto"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto sm:my-8 relative">
        <div className="sticky top-0 z-20 bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
              ₹
            </div>
            <h2 id="payment-modal-title" className="font-semibold text-sm tracking-tight text-white">Record Payment Collection</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="payment-booking-select" className="font-semibold text-slate-700 block mb-1">
              Select Customer / Booking Contract *
            </label>
            <select
              id="payment-booking-select"
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.customer?.fullName} — Plot {b.plot?.plotNumber} ({b.bookingCode}) — Bal: {formatINR(b.pendingBalance)}
                </option>
              ))}
            </select>
          </div>

          {selectedBooking && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold">Customer</span>
                <p className="font-bold text-slate-800">{selectedBooking.customer?.fullName}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 uppercase font-semibold">Remaining Balance</span>
                <p className="font-black text-amber-700 text-sm">{formatINR(pendingBalance)}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="payment-collection-amount" className="font-semibold text-slate-700 block mb-1">
                Collection Amount (₹) *
              </label>
              <input
                id="payment-collection-amount"
                type="number"
                min="1"
                max={pendingBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-sm text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="payment-method-select" className="font-semibold text-slate-700 block mb-1">
                Payment Method *
              </label>
              <select
                id="payment-method-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="CHEQUE">Cheque</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT / RTGS</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="payment-ref-input" className="font-semibold text-slate-700 block mb-1">
                Transaction Ref / Cheque No.
              </label>
              <input
                id="payment-ref-input"
                type="text"
                placeholder="e.g. UPI-982173 / CHQ-10291"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="payment-bank-input" className="font-semibold text-slate-700 block mb-1">
                Bank Name (if applicable)
              </label>
              <input
                id="payment-bank-input"
                type="text"
                placeholder="e.g. HDFC / SBI"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label htmlFor="payment-notes-input" className="font-semibold text-slate-700 block mb-1">
              Notes / Remarks
            </label>
            <input
              id="payment-notes-input"
              type="text"
              placeholder="e.g. Installment #2 received"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

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
              disabled={loading || !selectedBookingId || (typeof amount === 'number' ? amount <= 0 : !amount)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              {loading ? 'Recording Collection...' : 'Record & Generate Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
