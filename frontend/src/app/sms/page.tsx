'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Send, PlusCircle, CheckCircle, Clock, X, AlertCircle } from 'lucide-react';
import { apiRequest, formatDate } from '@/lib/api';
import { SmsLog } from '@/types';

export default function SmsPage() {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Send Custom SMS Modal
  const [isSendOpen, setIsSendOpen] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<SmsLog[]>(`/sms?search=${encodeURIComponent(search)}`);
      setLogs(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSendCustomSms = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiRequest('/sms/send-custom', {
        method: 'POST',
        body: JSON.stringify({
          recipientPhone: phone,
          recipientName: name || undefined,
          messageBody: message,
        }),
      });

      setIsSendOpen(false);
      setPhone('');
      setName('');
      setMessage('');
      setFeedback('SMS dispatched successfully!');
      setTimeout(() => setFeedback(null), 4000);
      loadLogs();
    } catch (err: any) {
      alert(`Error sending SMS: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            <span>Customer & Project SMS Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated event-based SMS alerts (Welcome, Payments, Reminders) and transactional audit logs.
          </p>
        </div>

        <button
          onClick={() => setIsSendOpen(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/20 cursor-pointer self-start sm:self-auto"
        >
          <Send className="w-4 h-4" />
          <span>Compose Custom SMS</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by phone number, customer name, or message text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Total Dispatched SMS: {logs.length}
        </span>
      </div>

      {/* SMS Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Event Trigger</th>
                <th className="py-3 px-4">Message Content</th>
                <th className="py-3 px-4 text-center">Gateway Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No SMS transmission logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.sentAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-bold text-slate-900">{log.recipientName || 'Customer'}</p>
                      <p className="font-mono text-emerald-700 text-[11px] font-semibold">
                        {log.recipientPhone}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {log.eventType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-lg">
                      <p className="line-clamp-2">{log.messageBody}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          log.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.status === 'SIMULATED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compose Custom SMS Modal */}
      {isSendOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto sm:my-8 relative">
            <div className="sticky top-0 z-20 bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shadow-sm">
              <h2 className="font-bold text-sm">Send Direct SMS Broadcast</h2>
              <button onClick={() => setIsSendOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendCustomSms} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Recipient Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="9842100000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Recipient Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Rajesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Message Body *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type your message here (MSP Properties branding included automatically)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1 text-right">
                  {message.length} characters (1 SMS credit)
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSendOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-md shadow-emerald-900/20 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Transmitting...' : 'Dispatch SMS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
