'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Calendar, CheckCircle2, PhoneCall } from 'lucide-react';
import { getStoredUser } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = React.useState<any>(null);
  const [currentDate, setCurrentDate] = React.useState<string>('');

  React.useEffect(() => {
    setUser(getStoredUser());
    const now = new Date();
    setCurrentDate(
      now.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    );
  }, [pathname]);

  if (pathname === '/login') return null;

  return (
    <header className="no-print h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center space-x-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
          MSP System Active
        </span>
        <span className="text-xs text-slate-500 hidden sm:inline">
          Durozen Technologies Enterprise Suite
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
          <span>{currentDate || '21 Oct 2026'}</span>
        </div>

        <div className="hidden md:flex items-center text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <PhoneCall className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
          <span>SMS Gateway: Connected</span>
        </div>

        {user && (
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-800 block">
              {user.fullName}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ID: {user.employeeId}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
