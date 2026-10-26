'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, PlusCircle, X } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { useDebounce } from '@/lib/useDebounce';
import { SmsLog } from '@/types';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { TruncatedCell } from '@/components/ui/Tooltip';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function SmsPage() {
  const toast = useToast();
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const debouncedSearch = useDebounce(search, 300);

  // Send Custom SMS Modal
  const [isSendOpen, setIsSendOpen] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadLogs = async (query = debouncedSearch) => {
    try {
      setLoading(true);
      const res = await apiRequest<SmsLog[]>(`/sms?search=${encodeURIComponent(query)}`);
      setLogs(res);
    } catch (err: unknown) {
      console.error('Failed to load SMS logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(debouncedSearch);
  }, [debouncedSearch]);

  // Esc key closes modal
  useEffect(() => {
    if (!isSendOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSendOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSendOpen]);

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
      toast.success('SMS dispatched successfully');
      loadLogs(debouncedSearch);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending SMS';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo<ColumnDef<SmsLog>[]>(
    () => [
      {
        key: 'sentAt',
        header: 'Dispatched At',
        sortable: true,
        width: '150px',
        render: (log) => (
          <span className="text-slate-600 font-mono text-[11px] whitespace-nowrap">
            {new Date(log.sentAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        ),
      },
      {
        key: 'recipient',
        header: 'Recipient',
        sortable: true,
        render: (log) => (
          <div>
            <p className="font-semibold text-slate-900 leading-tight">
              {log.recipientName || 'Customer'}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              {log.recipientPhone}
            </p>
          </div>
        ),
      },
      {
        key: 'eventType',
        header: 'Trigger Type',
        sortable: true,
        align: 'center',
        render: (log) => (
          <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[10px] uppercase tracking-wider">
            {log.eventType.replace('_', ' ')}
          </span>
        ),
      },
      {
        key: 'messageBody',
        header: 'Message Payload',
        render: (log) => (
          <TruncatedCell
            content={log.messageBody}
            maxWidth="max-w-[420px]"
            className="text-slate-700 leading-relaxed"
          />
        ),
      },
      {
        key: 'status',
        header: 'Gateway Status',
        sortable: true,
        align: 'center',
        render: (log) => (
          <span
            className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              log.status === 'DELIVERED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : log.status === 'SIMULATED'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {log.status}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <ErrorBoundary componentName="SmsCommunications">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-emerald-700" />
              <span>SMS Communications & Dispatch Telemetry</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated event-based SMS alerts (Welcome, Receipts, Installment Reminders) and transactional audit logs.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSendOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Compose Direct SMS</span>
          </button>
        </div>

        {/* Enterprise Data Grid */}
        <DataTable<SmsLog>
          data={logs}
          columns={columns}
          keyExtractor={(item) => item.id}
          loading={loading}
          searchPlaceholder="Search by recipient phone, name, or message snippet..."
          externalSearchValue={search}
          onSearchChange={setSearch}
          emptyTitle="No SMS dispatch logs found"
          emptyDescription="No automated or manual SMS dispatches match your search query."
          ariaLabel="SMS communication audit ledger"
        />

        {/* Compose Custom SMS Modal */}
        {isSendOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-xs overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="compose-sms-title"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 my-auto relative">
              <div className="sticky top-0 z-20 bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shadow-xs">
                <h2 id="compose-sms-title" className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  Send Direct SMS Broadcast
                </h2>
                <button
                  type="button"
                  onClick={() => setIsSendOpen(false)}
                  aria-label="Close dialog"
                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendCustomSms} className="p-5 space-y-3 text-xs">
                <div>
                  <label htmlFor="sms-phone" className="font-semibold text-slate-700 block mb-1">
                    Recipient Phone Number (10 digits) *
                  </label>
                  <input
                    id="sms-phone"
                    type="tel"
                    required
                    pattern="[6-9][0-9]{9}"
                    placeholder="e.g. 9840123456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 font-mono font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="sms-name" className="font-semibold text-slate-700 block mb-1">
                    Recipient Full Name
                  </label>
                  <input
                    id="sms-name"
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="sms-body" className="font-semibold text-slate-700">Message Body *</label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {message.length} chars (1 credit)
                    </span>
                  </div>
                  <textarea
                    id="sms-body"
                    required
                    rows={4}
                    maxLength={320}
                    placeholder="Enter transactional notification text..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 font-medium focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsSendOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Dispatching...' : 'Dispatch SMS'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
