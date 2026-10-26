'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Menu } from 'lucide-react';
import { getStoredUser } from '@/lib/api';

interface NavbarProps {
  onOpenMenu?: () => void;
}

export default function Navbar({ onOpenMenu }: NavbarProps) {
  const [user, setUser] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
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
  }, []);

  return (
    <header className="no-print h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenMenu}
          className="lg:hidden p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-slate-900">MSP Properties</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 font-medium">Layout Management ERP</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Live System Indicator */}
        <div className="hidden md:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200/80 text-[11px] font-medium text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Live Operations</span>
        </div>

        {currentDate && (
          <div className="hidden sm:flex items-center text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            <span>{currentDate}</span>
          </div>
        )}

        {user && (
          <div className="flex items-center space-x-2.5 pl-3 sm:border-l sm:border-slate-200 text-right">
            <div className="hidden sm:block">
              <span className="text-xs font-semibold text-slate-800 block leading-tight">
                {user.fullName}
              </span>
              <span className="text-[10px] font-medium text-slate-500">
                {user.employeeId} · {user.role?.replace('_', ' ')}
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
