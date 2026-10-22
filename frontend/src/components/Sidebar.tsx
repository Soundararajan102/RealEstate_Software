'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  Handshake,
  FileCheck2,
  Receipt,
  MessageSquare,
  ShieldCheck,
  LogOut,
  Landmark,
} from 'lucide-react';
import { clearAuthSession, getStoredUser } from '@/lib/api';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    setUser(getStoredUser());
  }, [pathname]);

  const handleLogout = () => {
    clearAuthSession();
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Projects & Plots', href: '/projects', icon: Building2 },
    { label: 'Customers', href: '/customers', icon: Users },
    { label: 'Brokers', href: '/brokers', icon: Handshake },
    { label: 'Bookings & Sales', href: '/bookings', icon: FileCheck2 },
    { label: 'Collections & Receipts', href: '/payments', icon: Receipt },
    { label: 'SMS Notifications', href: '/sms', icon: MessageSquare },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ label: 'Employee Access', href: '/employees', icon: ShieldCheck });
  }

  // Hide sidebar on login page
  if (pathname === '/login') return null;

  return (
    <aside className="no-print w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 shrink-0 border-r border-slate-800 shadow-xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
          <Landmark className="w-6 h-6 text-slate-900" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-wide text-white flex items-center gap-1.5">
            MSP Properties
          </h1>
          <p className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">
            Real Estate ERP
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
              {user?.fullName ? user.fullName[0] : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-100 truncate">
                {user?.fullName || 'MSP User'}
              </p>
              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase tracking-wider">
                {user?.role?.replace('_', ' ') || 'Staff'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
