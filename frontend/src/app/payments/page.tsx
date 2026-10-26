'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  PlusCircle,
  Printer,
} from 'lucide-react';
import { apiRequest, formatINR, formatDate } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { useDebounce } from '@/lib/useDebounce';
import { Payment } from '@/types';
import PaymentModal from '@/components/PaymentModal';
import ReceiptModal from '@/components/ReceiptModal';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { TruncatedCell } from '@/components/ui/Tooltip';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function PaymentsPage() {
  const toast = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const debouncedSearch = useDebounce(search, 300);

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  const loadPayments = async (query = debouncedSearch) => {
    try {
      setLoading(true);
      const res = await apiRequest<Payment[]>(`/payments?search=${encodeURIComponent(query)}`);
      setPayments(res);
    } catch (err: unknown) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments(debouncedSearch);
  }, [debouncedSearch]);

  const handlePrintReceipt = async (paymentId: string) => {
    try {
      const p = await apiRequest<Payment>(`/payments/${paymentId}`);
      setSelectedReceipt(p);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Could not load receipt: ${msg}`);
    }
  };

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        key: 'receiptNumber',
        header: 'Receipt No.',
        sortable: true,
        width: '140px',
        render: (p) => (
          <span className="font-mono font-bold text-slate-900 tracking-tight">
            {p.receiptNumber}
          </span>
        ),
      },
      {
        key: 'paymentDate',
        header: 'Date',
        sortable: true,
        width: '110px',
        render: (p) => (
          <span className="text-slate-500 font-mono text-[11px]">
            {formatDate(p.paymentDate)}
          </span>
        ),
      },
      {
        key: 'customer',
        header: 'Customer Details',
        render: (p) => (
          <div>
            <p className="font-semibold text-slate-900 leading-tight">
              {p.customer?.fullName ?? '—'}
            </p>
            <p className="text-[11px] font-mono text-slate-500">
              {p.customer?.customerCode ?? p.customer?.phone ?? ''}
            </p>
          </div>
        ),
      },
      {
        key: 'booking',
        header: 'Plot & Project',
        render: (p) => (
          <div>
            <span className="font-semibold text-slate-800 leading-tight">
              Plot #{p.booking?.plot?.plotNumber ?? '—'}
            </span>
            <TruncatedCell
              content={p.booking?.plot?.project?.name}
              maxWidth="max-w-[150px]"
              className="text-slate-500"
            />
          </div>
        ),
      },
      {
        key: 'paymentMethod',
        header: 'Method & Reference',
        sortable: true,
        render: (p) => (
          <div>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 uppercase tracking-wider">
              {p.paymentMethod.replace('_', ' ')}
            </span>
            {p.transactionReference && (
              <TruncatedCell
                content={p.transactionReference}
                maxWidth="max-w-[140px]"
                className="font-mono text-slate-500 text-[11px] block mt-0.5"
              />
            )}
          </div>
        ),
      },
      {
        key: 'amount',
        header: 'Amount Collected',
        sortable: true,
        align: 'right',
        render: (p) => (
          <span className="font-mono font-bold text-emerald-700 tracking-tight text-xs">
            {formatINR(p.amount)}
          </span>
        ),
      },
      {
        key: 'recordedBy',
        header: 'Collected By',
        render: (p) => (
          <div>
            <p className="font-medium text-slate-800 leading-tight">
              {p.recordedBy?.fullName ?? '—'}
            </p>
            <p className="text-[11px] font-mono text-slate-500">
              {p.recordedBy?.employeeId ?? ''}
            </p>
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Voucher',
        align: 'center',
        render: (p) => (
          <button
            type="button"
            onClick={() => handlePrintReceipt(p.id)}
            aria-label={`View and print receipt ${p.receiptNumber}`}
            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Print</span>
          </button>
        ),
      },
    ],
    [],
  );

  return (
    <ErrorBoundary componentName="PaymentsLedger">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-emerald-700" />
              <span>Collection Tracking & Official Receipts</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Record customer plot collections, manage sequential receipt vouchers, and generate branded print receipts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPaymentOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Record New Collection</span>
          </button>
        </div>

        {/* Enterprise Data Grid */}
        <DataTable<Payment>
          data={payments}
          columns={columns}
          keyExtractor={(item) => item.id}
          loading={loading}
          searchPlaceholder="Search by receipt number, customer, or transaction reference..."
          externalSearchValue={search}
          onSearchChange={setSearch}
          emptyTitle="No payment records found"
          emptyDescription="No collections have been recorded yet."
          ariaLabel="Payments and receipts ledger"
        />

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
    </ErrorBoundary>
  );
}
