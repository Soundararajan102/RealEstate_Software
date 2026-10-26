'use client';

import React from 'react';
import { Printer, X, CheckCircle, Landmark, ShieldCheck } from 'lucide-react';
import { formatINR, formatDate } from '@/lib/api';

interface ReceiptModalProps {
  payment: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiptModal({ payment, isOpen, onClose }: ReceiptModalProps) {
  // Close on Escape & Lock body scroll
  React.useEffect(() => {
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

  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const booking = payment.booking || {};
  const plot = booking.plot || {};
  const project = plot.project || {};
  const customer = payment.customer || booking.customer || {};
  const recordedBy = payment.recordedBy || {};

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
    >
      {/* Modal Card */}
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto sm:my-8 relative">
        {/* Top Control Bar (Hidden during print - Sticky) */}
        <div className="no-print sticky top-0 z-20 bg-slate-900 text-white px-5 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <h2 id="receipt-modal-title" className="font-semibold text-xs sm:text-sm">Payment Recorded Successfully</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              aria-label="Print receipt"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close receipt dialog"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="receipt-container p-6 sm:p-10 bg-white text-slate-900 font-sans">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6 text-center">
            <div className="flex items-center justify-center space-x-2.5 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                MSP
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
                MSP PROPERTIES
              </h1>
            </div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest">
              Land Developers & Promoters
            </p>
            <p className="text-xs text-slate-500 mt-1">
              NH-44 Bypass Road, Salem / Perundurai Road, Erode, Tamil Nadu | Phone: +91 98420 12345
            </p>
            <div className="mt-3 inline-block px-3.5 py-1 bg-slate-100 border border-slate-300 rounded-md text-xs font-bold text-slate-800 tracking-wider uppercase">
              PAYMENT ACKNOWLEDGEMENT RECEIPT
            </div>
          </div>

          {/* Receipt Meta info */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <p className="text-slate-500 text-xs">Receipt No:</p>
              <p className="font-bold text-sm text-slate-900">{payment.receiptNumber}</p>
              <p className="text-slate-500 text-xs mt-2">Booking ID:</p>
              <p className="font-semibold text-slate-800">{booking.bookingCode || '-'}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-xs">Payment Date:</p>
              <p className="font-semibold text-slate-800">{formatDate(payment.paymentDate)}</p>
              <p className="text-slate-500 text-xs mt-2">Payment Method:</p>
              <p className="font-bold text-emerald-700 uppercase">
                {payment.paymentMethod ? payment.paymentMethod.replace('_', ' ') : 'CASH'}
                {payment.transactionReference ? ` (${payment.transactionReference})` : ''}
              </p>
            </div>
          </div>

          {/* Customer & Plot Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-6">
            <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Customer Details
              </span>
              <p className="font-bold text-sm text-slate-900">{customer.fullName || 'Valued Customer'}</p>
              <p className="text-slate-600 mt-0.5 font-medium">Phone: {customer.phone || '-'}</p>
              {customer.address && <p className="text-slate-500 text-xs mt-1">{customer.address}</p>}
            </div>

            <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Property Details
              </span>
              <p className="font-bold text-sm text-slate-900">{project.name || 'MSP Plotted Scheme'}</p>
              <p className="text-slate-700 mt-0.5 font-medium">
                Plot No: <span className="font-bold text-slate-900">{plot.plotNumber || '-'}</span>
                {plot.dimension && ` | Extent: ${plot.dimension}`}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Area: {plot.areaSqFt ? `${Number(plot.areaSqFt).toLocaleString('en-IN')} Sq.Ft.` : '-'}
              </p>
            </div>
          </div>

          {/* Amount Box */}
          <div className="border border-slate-800 bg-slate-900 text-white rounded-lg p-5 mb-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                  Amount Received in this Receipt
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
                  {formatINR(payment.amount)}
                </span>
              </div>
              <ShieldCheck className="w-9 h-9 text-emerald-400 opacity-90 shrink-0" />
            </div>

            {payment.notes && (
              <p className="text-xs text-slate-300 mt-2 italic border-t border-slate-800 pt-2">
                Remarks: {payment.notes}
              </p>
            )}
          </div>

          {/* Financial Ledger Summary */}
          {booking.finalPayableAmount && (
            <div className="border border-slate-200 rounded-lg p-3.5 text-xs mb-8 bg-slate-50">
              <div className="grid grid-cols-3 text-center divide-x divide-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase font-medium">Agreed Sale Price</span>
                  <span className="font-bold text-slate-900 tabular-nums">{formatINR(booking.finalPayableAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase font-medium">Total Paid Till Date</span>
                  <span className="font-bold text-emerald-700 tabular-nums">{formatINR(payment.totalPaidOnBooking || payment.amount)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase font-medium">Pending Balance</span>
                  <span className="font-bold text-amber-700 tabular-nums">{formatINR(payment.pendingBalance ?? 0)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="pt-8 mt-6 border-t border-slate-300 grid grid-cols-2 text-xs">
            <div>
              <p className="font-medium text-slate-600">Customer Signature:</p>
              <div className="h-10"></div>
              <p className="text-slate-400">________________________</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-slate-600">For MSP PROPERTIES</p>
              <div className="h-10"></div>
              <p className="font-semibold text-slate-900">
                {recordedBy.fullName || 'Authorized Signatory'}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                Staff ID: {recordedBy.employeeId || 'STAFF'}
              </p>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 text-center text-xs text-slate-500 border-t border-slate-100 pt-3">
            This is a computer-generated official receipt by MSP Properties Real Estate System. Subject to realization of cheque / online fund transfer.
          </div>
        </div>
      </div>
    </div>
  );
}
