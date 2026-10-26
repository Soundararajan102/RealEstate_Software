'use client';

import React, { useEffect } from 'react';
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
  X,
} from 'lucide-react';
import { clearAuthSession, getStoredUser } from '@/lib/api';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, [pathname]);

  // Close mobile drawer on Esc key
  useEffect(() => {
    if (!mobileOpen || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onClose]);

  const handleLogout = () => {
    clearAuthSession();
    router.push('/login');
  };

  const navGroups = [
    {
      title: 'Operations',
      items: [
        { label: 'Executive Desk', href: '/', icon: LayoutDashboard },
        { label: 'Bookings & Sales', href: '/bookings', icon: FileCheck2 },
        { label: 'Collections & Ledger', href: '/payments', icon: Receipt },
      ],
    },
    {
      title: 'Portfolio & Directory',
      items: [
        { label: 'Projects & Plots', href: '/projects', icon: Building2 },
        { label: 'Customers', href: '/customers', icon: Users },
        { label: 'Broker Network', href: '/brokers', icon: Handshake },
      ],
    },
    {
      title: 'Communications & HR',
      items: [
        { label: 'SMS Notifications', href: '/sms', icon: MessageSquare },
        ...(user?.role === 'ADMIN'
          ? [{ label: 'Employee Access', href: '/employees', icon: ShieldCheck }]
          : []),
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800 shadow-xs">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight text-white block">
              MSP Properties
            </span>
            <span className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase block">
              Real Estate ERP
            </span>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto" aria-label="Main Navigation">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <div className="px-3 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {group.title}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose?.()}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs transition-colors duration-150 ${
                    isActive
                      ? 'bg-slate-800 text-white font-medium border border-slate-700/60 shadow-xs'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 font-medium'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-semibold text-xs shrink-0">
            {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-slate-200 truncate">
              {user?.fullName || 'MSP User'}
            </p>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide block">
              {user?.role?.replace('_', ' ') || 'Staff'}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="no-print hidden lg:flex w-64 h-screen sticky top-0 shrink-0 flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Slide-over panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-10 animate-in slide-in-from-left duration-200 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
