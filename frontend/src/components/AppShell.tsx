'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If on login route, isolate and render plain children without sidebar/navbar overhead
  if (pathname === '/login') {
    return (
      <main className="min-h-screen bg-slate-950">
        <ErrorBoundary componentName="LoginPortal">{children}</ErrorBoundary>
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar onOpenMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-7">
          <ErrorBoundary componentName="MainWorkspace">{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
