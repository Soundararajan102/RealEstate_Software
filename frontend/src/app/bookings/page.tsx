'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck2,
  PlusCircle,
  Receipt,
  Download,
} from 'lucide-react';
import { apiRequest, formatINR, formatDate } from '@/lib/api';
import { useDebounce } from '@/lib/useDebounce';
import { Booking, Payment } from '@/types';
import BookingModal from '@/components/BookingModal';
import PaymentModal from '@/components/PaymentModal';
import ReceiptModal from '@/components/ReceiptModal';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { TruncatedCell } from '@/components/ui/Tooltip';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const debouncedSearch = useDebounce(search, 300);

  // Modals
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<string | undefined>(undefined);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  const loadBookings = async (query = debouncedSearch) => {
    try {
      setLoading(true);
      const res = await apiRequest<Booking[]>(`/bookings?search=${encodeURIComponent(query)}`);
      setBookings(res);
    } catch (err: unknown) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings(debouncedSearch);
  }, [debouncedSearch]);

  const handlePayForBooking = (bookingId: string) => {
    setSelectedBookingForPayment(bookingId);
    setIsPaymentOpen(true);
  };

  const columns = useMemo<ColumnDef<Booking>[]>(
    () => [
      {
        key: 'bookingCode',
        header: 'Booking ID',
        sortable: true,
        width: '140px',
        render: (b) => (
          <span className="font-mono font-bold text-slate-900 tracking-tight">
            {b.bookingCode}
          </span>
        ),
      },
      {
        key: 'bookingDate',
        header: 'Date',
        sortable: true,
        width: '110px',
        render: (b) => (
          <span className="text-slate-500 font-mono text-[11px]">
            {formatDate(b.bookingDate)}
          </span>
        ),
      },
      {
        key: 'customer',
        header: 'Customer Details',
        sortable: true,
        render: (b) => (
          <div>
            <p className="font-semibold text-slate-900 leading-tight">
              {b.customer?.fullName ?? '—'}
            </p>
            <p className="text-[11px] font-mono text-slate-500">
              {b.customer?.phone ?? ''}
            </p>
          </div>
        ),
      },
      {
        key: 'plot',
        header: 'Project & Plot',
        render: (b) => (
          <div>
            <p className="font-semibold text-slate-800 leading-tight">
              Plot #{b.plot?.plotNumber ?? '—'}
            </p>
            <TruncatedCell
              content={b.plot?.project?.name}
              maxWidth="max-w-[150px]"
              className="text-slate-500"
            />
          </div>
        ),
      },
      {
        key: 'finalPayableAmount',
        header: 'Agreed Value',
        sortable: true,
        align: 'right',
        render: (b) => (
          <span className="font-mono font-bold text-slate-900 tracking-tight">
            {formatINR(b.finalPayableAmount)}
          </span>
        ),
      },
      {
        key: 'totalPaid',
        header: 'Realized Paid',
        sortable: true,
        align: 'right',
        render: (b) => (
          <span className="font-mono font-bold text-emerald-700 tracking-tight">
            {formatINR(b.totalPaid ?? 0)}
          </span>
        ),
      },
      {
        key: 'pendingBalance',
        header: 'Outstanding',
        sortable: true,
        align: 'right',
        render: (b) => {
          const balance = b.pendingBalance ?? 0;
          return balance > 0 ? (
            <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {formatINR(balance)}
            </span>
          ) : (
            <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Settled
            </span>
          );
        },
      },
      {
        key: 'status',
        header: 'Plan / Status',
        sortable: true,
        align: 'center',
        render: (b) => {
          const isCompleted = b.status === 'COMPLETED' || (b.pendingBalance ?? 0) <= 0;
          return (
            <span
              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isCompleted
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {isCompleted ? 'COMPLETED' : b.paymentPlan}
            </span>
          );
        },
      },
      {
        key: 'actions',
        header: 'Action',
        align: 'center',
        render: (b) => {
          const isCompleted = b.status === 'COMPLETED' || (b.pendingBalance ?? 0) <= 0;
          return !isCompleted ? (
            <button
              type="button"
              onClick={() => handlePayForBooking(b.id)}
              aria-label={`Record collection for booking ${b.bookingCode}`}
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Collect</span>
            </button>
          ) : (
            <span className="text-slate-400 text-xs italic font-medium">Fully Settled</span>
          );
        },
      },
    ],
    [],
  );

  return (
    <ErrorBoundary componentName="BookingsView">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <FileCheck2 className="w-5 h-5 text-emerald-700" />
              <span>Plot Sales & Booking Contracts</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enterprise ledger for sales contracts, agreed values, payments realization, and installment schedules.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsBookingOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Booking Contract</span>
          </button>
        </div>

        {/* Enterprise Data Grid */}
        <DataTable<Booking>
          data={bookings}
          columns={columns}
          keyExtractor={(item) => item.id}
          loading={loading}
          searchPlaceholder="Search by booking code, customer name, phone, or plot..."
          externalSearchValue={search}
          onSearchChange={setSearch}
          emptyTitle="No booking contracts found"
          emptyDescription="No plot booking contracts have been issued yet."
          ariaLabel="Sales and booking contracts ledger"
        />

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
    </ErrorBoundary>
  );
}
