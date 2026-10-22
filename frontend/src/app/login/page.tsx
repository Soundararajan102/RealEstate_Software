'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, Lock, Mail, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import { apiRequest, setAuthSession } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('admin@mspproperties.com');
  const [password, setPassword] = useState<string>('Password@123');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setAuthSession(res.accessToken, res.user);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('Password@123');
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-50 overflow-y-auto">
      {/* Background Decorative Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950 -z-10" />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-white relative">
        {/* Brand Crest */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 mx-auto flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 mb-3">
            <Landmark className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black tracking-wide text-white">
            MSP Properties
          </h1>
          <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mt-0.5">
            Real Estate Management ERP
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            Developed by Durozen Technologies Pvt. Ltd.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Authorized Email ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@mspproperties.com"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
            Quick Demo Accounts
          </p>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <button
              type="button"
              onClick={() => setDemoUser('admin@mspproperties.com')}
              className={`p-2 rounded-lg border text-center transition-colors cursor-pointer ${
                email === 'admin@mspproperties.com'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 mx-auto mb-1 text-amber-400" />
              <span className="font-bold block">Admin</span>
              <span className="text-[9px] text-slate-400">Full Access</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoUser('sales@mspproperties.com')}
              className={`p-2 rounded-lg border text-center transition-colors cursor-pointer ${
                email === 'sales@mspproperties.com'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-400" />
              <span className="font-bold block">Sales Mgr</span>
              <span className="text-[9px] text-slate-400">Bookings</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoUser('accounts@mspproperties.com')}
              className={`p-2 rounded-lg border text-center transition-colors cursor-pointer ${
                email === 'accounts@mspproperties.com'
                  ? 'bg-blue-500/10 border-blue-500 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 mx-auto mb-1 text-blue-400" />
              <span className="font-bold block">Accounts</span>
              <span className="text-[9px] text-slate-400">Collections</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
