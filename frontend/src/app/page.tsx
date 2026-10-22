'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Landmark,
  Building2,
  Calendar,
  AlertTriangle,
  Receipt,
  PlusCircle,
  FileCheck2,
  CreditCard,
  Send,
  Printer,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { apiRequest, formatINR, formatDate, getStoredUser } from '@/lib/api';
import { DashboardSummary } from '@/types';
import ReceiptModal from '@/components/ReceiptModal';
import BookingModal from '@/components/BookingModal';
import PaymentModal from '@/components/PaymentModal';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [receiptPayment, setReceiptPayment] = useState<any | null>(null);
  const [smsFeedback, setSmsFeedback] = useState<string | null>(null);

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

      setSmsFeedback(`Reminder SMS sent to ${item.booking?.customer?.fullName}!`);
      setTimeout(() => setSmsFeedback(null), 4000);
    } catch (err: any) {
      alert(`Failed to send SMS: ${err.message}`);
    }
  };

  const handleOpenReceipt = async (paymentId: string) => {
    try {
      const p = await apiRequest(`/payments/${paymentId}`);
      setReceiptPayment(p);
    } catch (err: any) {
      alert(`Could not load receipt: ${err.message}`);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading Real Estate Analytics...</p>
        </div>
      </div>
    );
  }

  const inv = data?.inventory || { totalProjects: 0, totalPlots: 0, availablePlots: 0, bookedPlots: 0, soldPlots: 0 };
  const fin = data?.financials || { totalSalesValue: 0, totalCollected: 0, totalOutstanding: 0, totalBrokerCommission: 0 };

  return (
    <div className="space-y-6">
      {/* Toast Notification for SMS */}
      {smsFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-emerald-400 border border-emerald-500/30 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in slide-in-from-bottom-5">
          <Send className="w-4 h-4 text-emerald-400" />
          <span>{smsFeedback}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              Executive Overview
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">MSP Properties</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Welcome back, {user?.fullName || 'Director'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Centralized monitoring for plotting projects, live plot availability, customer bookings, collections, and SMS alerts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => setIsBookingOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Booking</span>
          </button>

          <button
            onClick={() => setIsPaymentOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Record Collection</span>
          </button>
        </div>
      </div>

      {/* 7 KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Plots */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Inventory</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900">{inv.totalPlots}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across {inv.totalProjects || 2} active layouts</p>
        </div>

        {/* Available Plots */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold mb-1">
            <span>Available Plots</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{inv.availablePlots}</p>
          <p className="text-[11px] text-emerald-800 font-medium mt-0.5">Ready for booking</p>
        </div>

        {/* Booked Plots */}
        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold mb-1">
            <span>Booked (Installments)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700">{inv.bookedPlots}</p>
          <p className="text-[11px] text-amber-800 font-medium mt-0.5">Active payment plans</p>
        </div>

        {/* Sold Plots */}
        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs bg-blue-50/20">
          <div className="flex items-center justify-between text-blue-800 text-xs font-semibold mb-1">
            <span>Sold & Settled</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-700">{inv.soldPlots}</p>
          <p className="text-[11px] text-blue-800 font-medium mt-0.5">100% paid & closed</p>
        </div>
      </div>

      {/* Financial Ledger Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
            <TrendingUp className="w-6 h-6 text-slate-800" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Agreed Sales
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {formatINR(fin.totalSalesValue)}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center space-x-4 bg-emerald-50/10">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
            <CreditCard className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
              Collections Received
            </span>
            <span className="text-xl font-black text-emerald-700 font-mono">
              {formatINR(fin.totalCollected)}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex items-center space-x-4 bg-amber-50/10">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
              Pending Receivables
            </span>
            <span className="text-xl font-black text-amber-700 font-mono">
              {formatINR(fin.totalOutstanding)}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Upcoming Dues & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upcoming Installments */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Upcoming Installments (Next 30 Days)</span>
              </h2>
              <p className="text-[11px] text-slate-500">Scheduled collections & payment reminders</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {(!data?.upcomingInstallments || data.upcomingInstallments.length === 0) ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No installments pending in the next 30 days.
              </div>
            ) : (
              data.upcomingInstallments.map((item) => {
                const pendingAmt = Number(item.expectedAmount) - Number(item.paidAmount);
                return (
                  <div key={item.id} className="p-4 hover:bg-slate-50 flex items-center justify-between text-xs gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">
                        {item.booking?.customer?.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Plot {item.booking?.plot?.plotNumber} • Due: {formatDate(item.dueDate)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block font-mono">
                          {formatINR(pendingAmt)}
                        </span>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                          Inst #{item.installmentNumber}
                        </span>
                      </div>

                      <button
                        onClick={() => handleSendReminder(item)}
                        title="Send SMS reminder to customer"
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Recent Collections & Print Receipt */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Recent Payment Collections</span>
              </h2>
              <p className="text-[11px] text-slate-500">Official receipt logs with print option</p>
            </div>
            <button
              onClick={() => router.push('/payments')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {(!data?.recentPayments || data.recentPayments.length === 0) ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No recent payment transactions found.
              </div>
            ) : (
              data.recentPayments.map((p) => (
                <div key={p.id} className="p-4 hover:bg-slate-50 flex items-center justify-between text-xs gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {p.customer?.fullName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Receipt: <span className="font-mono font-medium text-slate-700">{p.receiptNumber}</span> • {formatDate(p.paymentDate)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <span className="font-bold text-emerald-700 block font-mono">
                        {formatINR(p.amount)}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase">{p.paymentMethod}</span>
                    </div>

                    <button
                      onClick={() => handleOpenReceipt(p.id)}
                      title="Print Official Receipt"
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
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
        onClose={() => setIsPaymentOpen(false)}
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
