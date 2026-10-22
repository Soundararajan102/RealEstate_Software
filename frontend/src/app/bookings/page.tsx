'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Search,
  PlusCircle,
  Receipt,
  CheckCircle,
  Clock,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { apiRequest, formatINR, formatDate } from '@/lib/api';
import { Booking } from '@/types';
import BookingModal from '@/components/BookingModal';
import PaymentModal from '@/components/PaymentModal';
import ReceiptModal from '@/components/ReceiptModal';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<string | undefined>(undefined);
  const [receiptPayment, setReceiptPayment] = useState<any | null>(null);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<Booking[]>(`/bookings?search=${encodeURIComponent(search)}`);
      setBookings(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBookings();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handlePayForBooking = (bookingId: string) => {
    setSelectedBookingForPayment(bookingId);
    setIsPaymentOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <FileCheck2 className="w-6 h-6 text-emerald-600" />
            <span>Plot Sales & Booking Contracts</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage sales contracts, agreed pricing, advance payments, and installment schedules.
          </p>
        </div>

        <button
          onClick={() => setIsBookingOpen(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/20 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Booking Contract</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by booking code (e.g. BK-2026-0001), customer, or plot..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Total Bookings: {bookings.length}
        </span>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Project & Plot</th>
                <th className="py-3 px-4 text-right">Agreed Value</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Remaining Balance</th>
                <th className="py-3 px-4 text-center">Plan & Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No sales booking contracts found.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  const isCompleted = b.status === 'COMPLETED' || (b.pendingBalance ?? 0) <= 0;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {b.bookingCode}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(b.bookingDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{b.customer?.fullName}</p>
                        <p className="text-[11px] text-slate-400">{b.customer?.phone}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">Plot {b.plot?.plotNumber}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[160px]">
                          {b.plot?.project?.name}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatINR(b.finalPayableAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatINR(b.totalPaid)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        {(b.pendingBalance ?? 0) > 0 ? (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {formatINR(b.pendingBalance)}
                          </span>
                        ) : (
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            Settled
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isCompleted ? 'COMPLETED' : b.paymentPlan}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {!isCompleted ? (
                          <button
                            onClick={() => handlePayForBooking(b.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Collect</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Fully Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={() => loadBookings()}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        preselectedBookingId={selectedBookingForPayment}
        onSuccess={(payment) => {
          loadBookings();
          setReceiptPayment(payment);
        }}
      />

      <ReceiptModal
        payment={receiptPayment}
        isOpen={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
      />
    </div>
  );
}
