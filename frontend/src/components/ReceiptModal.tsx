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
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
      {/* Modal Card */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto sm:my-8 relative">
        {/* Top Control Bar (Hidden during print - Sticky) */}
        <div className="no-print sticky top-0 z-20 bg-slate-900 text-white px-5 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shadow-md">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-bold text-xs sm:text-sm">Payment Recorded Successfully</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="receipt-container p-6 sm:p-10 bg-white text-slate-800 font-sans">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-5 mb-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <Landmark className="w-7 h-7 text-emerald-700 shrink-0" />
              <h1 className="text-xl sm:text-2xl font-black tracking-wider text-slate-900 uppercase">
                MSP PROPERTIES
              </h1>
            </div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
              Land Developers & Promoters
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              NH-44 Bypass Road, Salem / Perundurai Road, Erode, Tamil Nadu | Phone: +91 98420 12345
            </p>
            <div className="mt-3 inline-block px-4 py-1 bg-slate-100 border border-slate-300 rounded-full text-xs font-bold text-slate-800 tracking-wider uppercase">
              PAYMENT ACKNOWLEDGEMENT RECEIPT
            </div>
          </div>

          {/* Receipt Meta info */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-slate-500 text-[11px]">Receipt No:</p>
              <p className="font-mono font-bold text-sm text-slate-900">{payment.receiptNumber}</p>
              <p className="text-slate-500 text-[11px] mt-2">Booking ID:</p>
              <p className="font-mono font-bold text-slate-800">{booking.bookingCode || '-'}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-[11px]">Payment Date:</p>
              <p className="font-semibold text-slate-900">{formatDate(payment.paymentDate)}</p>
              <p className="text-slate-500 text-[11px] mt-2">Payment Method:</p>
              <p className="font-semibold text-emerald-700 uppercase">
                {payment.paymentMethod ? payment.paymentMethod.replace('_', ' ') : 'CASH'}
                {payment.transactionReference ? ` (${payment.transactionReference})` : ''}
              </p>
            </div>
          </div>

          {/* Customer & Plot Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-6">
            <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Customer Details
              </span>
              <p className="font-bold text-sm text-slate-900">{customer.fullName || 'Valued Customer'}</p>
              <p className="text-slate-600 mt-0.5 font-medium">Phone: {customer.phone || '-'}</p>
              {customer.address && <p className="text-slate-500 text-[11px] mt-1">{customer.address}</p>}
            </div>

            <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Property Details
              </span>
              <p className="font-bold text-sm text-slate-900">{project.name || 'MSP Plotted Scheme'}</p>
              <p className="text-slate-700 mt-0.5 font-medium">
                Plot No: <span className="font-bold text-emerald-700">{plot.plotNumber || '-'}</span>
                {plot.dimension && ` | Extent: ${plot.dimension}`}
              </p>
              <p className="text-slate-500 text-[11px] mt-1">
                Area: {plot.areaSqFt ? `${Number(plot.areaSqFt).toLocaleString('en-IN')} Sq.Ft.` : '-'}
              </p>
            </div>
          </div>

          {/* Amount Box */}
          <div className="border-2 border-emerald-600 bg-emerald-50/50 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
                  Amount Received in this Receipt
                </span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono">
                  {formatINR(payment.amount)}
                </span>
              </div>
              <ShieldCheck className="w-10 h-10 text-emerald-600 opacity-60 shrink-0" />
            </div>

            {payment.notes && (
              <p className="text-xs text-slate-600 mt-2 italic border-t border-emerald-200/60 pt-2">
                Remarks: {payment.notes}
              </p>
            )}
          </div>

          {/* Financial Ledger Summary */}
          {booking.finalPayableAmount && (
            <div className="border border-slate-200 rounded-xl p-3 text-xs mb-8 bg-slate-50/50">
              <div className="grid grid-cols-3 text-center divide-x divide-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Agreed Sale Price</span>
                  <span className="font-semibold text-slate-800">{formatINR(booking.finalPayableAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total Paid Till Date</span>
                  <span className="font-bold text-emerald-700">{formatINR(payment.totalPaidOnBooking || payment.amount)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Pending Balance</span>
                  <span className="font-bold text-amber-700">{formatINR(payment.pendingBalance ?? 0)}</span>
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
              <p className="text-[10px] text-slate-400 font-mono">
                Staff ID: {recordedBy.employeeId || 'STAFF'}
              </p>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            This is a computer-generated official receipt by MSP Properties Real Estate System. Subject to realization of cheque / online fund transfer.
          </div>
        </div>
      </div>
    </div>
  );
}
