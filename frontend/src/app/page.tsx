'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  AlertCircle,
  Receipt,
  PlusCircle,
  CreditCard,
  Send,
  ArrowRight,
  Users,
  Handshake,
  FileCheck2,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { apiRequest, formatINR, formatDate, getStoredUser } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { DashboardSummary } from '@/types';
import ReceiptModal from '@/components/ReceiptModal';
import BookingModal from '@/components/BookingModal';
import PaymentModal from '@/components/PaymentModal';
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [preselectedBookingId, setPreselectedBookingId] = useState<string | undefined>(undefined);
  const [receiptPayment, setReceiptPayment] = useState<any | null>(null);
  const [sendingSmsId, setSendingSmsId] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<DashboardSummary>('/reports/dashboard');
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.push('/login');
      return;
    }
    setUser(stored);
    fetchDashboard();
  }, [router]);

  const handleSendReminder = async (item: any) => {
    try {
      setSendingSmsId(item.id);
      await apiRequest('/sms/remind-installment', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: item.bookingId || item.id,
          customerId: item.booking?.customer?.id,
          customerPhone: item.booking?.customer?.phone,
          customerName: item.booking?.customer?.fullName,
          installmentNumber: item.installmentNumber,
          amount: Number(item.expectedAmount) - Number(item.paidAmount),
          dueDate: item.dueDate,
          plotNumber: item.booking?.plot?.plotNumber,
        }),
      });

      toast.success(`Reminder SMS sent to ${item.booking?.customer?.fullName}!`);
    } catch (err: any) {
      toast.error(`Failed to send SMS: ${err.message}`);
    } finally {
      setSendingSmsId(null);
    }
  };

  const handleQuickPay = (bookingId: string) => {
    setPreselectedBookingId(bookingId);
    setIsPaymentOpen(true);
  };

  if (loading && !data) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading executive dashboard metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonTable rows={4} columns={6} />
      </div>
    );
  }

  const inv = data?.inventory || { totalProjects: 0, totalPlots: 0, availablePlots: 0, bookedPlots: 0, soldPlots: 0 };
  const fin = data?.financials || { totalSalesValue: 0, totalCollected: 0, totalOutstanding: 0, totalBrokerCommission: 0 };
  const counts = data?.counts || { totalCustomers: 0, totalBrokers: 0 };
  const upcomingDues = data?.upcomingInstallments || [];
  const recentBookings = data?.recentBookings || [];
  const recentPayments = data?.recentPayments || [];
  const collectionPct = fin.totalSalesValue > 0 ? Math.round((Number(fin.totalCollected) / Number(fin.totalSalesValue)) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Enterprise Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time portfolio revenue realization, collection ledger, and layout plot velocity.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setPreselectedBookingId(undefined);
              setIsPaymentOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-600" />
            <span>Record Payment</span>
          </button>

          <button
            onClick={() => setIsBookingOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* KPI Financial & Inventory Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Contract Pipeline */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Contract Pipeline
              </span>
              <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {formatINR(fin.totalSalesValue)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{inv.totalProjects} Active {inv.totalProjects === 1 ? 'Layout' : 'Layouts'}</span>
            <span className="font-semibold text-slate-800">{inv.bookedPlots + inv.soldPlots} Contracts</span>
          </div>
        </div>

        {/* Metric 2: Realized Collections */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Realized Revenue
              </span>
              <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-emerald-700 tabular-nums">
              {formatINR(fin.totalCollected)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Realization Rate</span>
              <span className="font-bold text-emerald-700">{collectionPct}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, collectionPct))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 3: Pending Receivables */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Pending Receivables
              </span>
              <div className="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-amber-700 tabular-nums">
              {formatINR(fin.totalOutstanding)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Scheduled Dues</span>
            <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 text-[11px]">
              {upcomingDues.length} in next 30 days
            </span>
          </div>
        </div>

        {/* Metric 4: Plot Inventory Velocity */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Plot Inventory
              </span>
              <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {inv.totalPlots} <span className="text-xs font-normal text-slate-500">Total Plots</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs">
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
              {inv.availablePlots} Available
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[11px]">
              {inv.bookedPlots} Booked
            </span>
            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[11px]">
              {inv.soldPlots} Sold
            </span>
          </div>
        </div>
      </div>

      {/* Scheduled Collections Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Upcoming Collection Milestones
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700">
              {upcomingDues.length}
            </span>
          </div>
          <Link
            href="/payments"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center space-x-1"
          >
            <span>Payments Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingDues.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
            <p className="text-xs font-semibold text-slate-800">All scheduled installments are fully collected</p>
            <p className="text-[11px] text-slate-500 mt-0.5">No pending customer milestone payments due in the next 30 days.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Layout & Plot</th>
                  <th className="py-2.5 px-4">Installment</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4 text-right">Amount Due</th>
                  <th className="py-2.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingDues.map((item) => {
                  const pendingAmount = Number(item.expectedAmount) - Number(item.paidAmount);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">
                          {item.booking?.customer?.fullName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {item.booking?.customer?.phone}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">
                          Plot #{item.booking?.plot?.plotNumber}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {item.booking?.plot?.project?.name}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          Installment #{item.installmentNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {formatDate(item.dueDate)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-700 tabular-nums">
                        {formatINR(pendingAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => handleSendReminder(item)}
                            disabled={sendingSmsId === item.id}
                            title="Dispatch SMS Reminder"
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Send className="w-3 h-3 text-slate-500" />
                            <span>Remind</span>
                          </button>
                          <button
                            onClick={() => handleQuickPay(item.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            <span>Collect</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two-Column Activity & Operational Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Contracts & Sales Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recent Sales Bookings
                </h3>
              </div>
              <Link
                href="/bookings"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center space-x-1"
              >
                <span>All Bookings</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No recent booking contracts registered yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentBookings.slice(0, 5).map((b) => (
                  <div key={b.id} className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900">{b.customer?.fullName}</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                          {b.bookingCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Plot #{b.plot?.plotNumber} • {b.plot?.project?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block tabular-nums">
                        {formatINR(b.finalPayableAmount)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(b.bookingDate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-right">
            <Link href="/bookings" className="text-xs font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center space-x-1">
              <span>View full contract registry</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Recent Payment Receipts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recent Collection Receipts
                </h3>
              </div>
              <Link
                href="/payments"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center space-x-1"
              >
                <span>Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentPayments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No recent payment transactions recorded.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentPayments.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900">{p.customer?.fullName}</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {p.receiptNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Method: <span className="font-medium text-slate-700">{p.paymentMethod?.replace('_', ' ')}</span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="font-bold text-emerald-700 block tabular-nums">
                          +{formatINR(p.amount)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(p.paymentDate)}
                        </span>
                      </div>
                      <button
                        onClick={() => setReceiptPayment(p)}
                        title="Print Official Voucher"
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-right">
            <Link href="/payments" className="text-xs font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center space-x-1">
              <span>View complete transactions ledger</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Directory & Commission Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Customer Directory Ledger */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Buyer Profiles
              </span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {counts.totalCustomers} <span className="text-xs font-normal text-slate-500">Registered Buyers</span>
              </p>
            </div>
          </div>
          <Link
            href="/customers"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 px-3 py-1.5 rounded-md hover:bg-emerald-50 transition-colors inline-flex items-center space-x-1"
          >
            <span>Directory</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Broker Network & Commission */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Partner Commissions
              </span>
              <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
                {formatINR(fin.totalBrokerCommission)}
                <span className="text-xs font-normal text-slate-500 ml-1.5">across {counts.totalBrokers} Brokers</span>
              </p>
            </div>
          </div>
          <Link
            href="/brokers"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 px-3 py-1.5 rounded-md hover:bg-emerald-50 transition-colors inline-flex items-center space-x-1"
          >
            <span>Network</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Modals */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={() => fetchDashboard()}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        preselectedBookingId={preselectedBookingId}
        onClose={() => {
          setIsPaymentOpen(false);
          setPreselectedBookingId(undefined);
        }}
        onSuccess={(newPayment) => {
          fetchDashboard();
          setReceiptPayment(newPayment);
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
