'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  PlusCircle,
  Printer,
  CreditCard,
  Landmark,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest, formatINR, formatDate } from '@/lib/api';
import { Payment } from '@/types';
import PaymentModal from '@/components/PaymentModal';
import ReceiptModal from '@/components/ReceiptModal';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<Payment[]>(`/payments?search=${encodeURIComponent(search)}`);
      setPayments(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPayments();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handlePrintReceipt = async (paymentId: string) => {
    try {
      const p = await apiRequest(`/payments/${paymentId}`);
      setSelectedReceipt(p);
    } catch (err: any) {
      alert(`Could not load receipt: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            <span>Collection Tracking & Official Receipts</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Record customer plot payments, generate sequential receipt vouchers, and print branded receipts.
          </p>
        </div>

        <button
          onClick={() => setIsPaymentOpen(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/20 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record New Collection</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by receipt number (e.g. RCP-2026-0001), customer, or ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Total Payment Receipts: {payments.length}
        </span>
      </div>

      {/* Collections Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Receipt No.</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Property Extent</th>
                <th className="py-3 px-4">Method & Reference</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
                <th className="py-3 px-4">Collected By</th>
                <th className="py-3 px-4 text-center">Receipt Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No payment collections recorded matching criteria.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{p.customer?.fullName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{p.customer?.customerCode}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">
                        Plot {p.booking?.plot?.plotNumber}
                      </span>
                      <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                        {p.booking?.plot?.project?.name}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {p.paymentMethod.replace('_', ' ')}
                      </span>
                      {p.transactionReference && (
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {p.transactionReference}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                      {formatINR(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <p className="font-medium text-slate-800">{p.recordedBy?.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.recordedBy?.employeeId}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handlePrintReceipt(p.id)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={(newPayment) => {
          loadPayments();
          setSelectedReceipt(newPayment);
        }}
      />

      <ReceiptModal
        payment={selectedReceipt}
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}
