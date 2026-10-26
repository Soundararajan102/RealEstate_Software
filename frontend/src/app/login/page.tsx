'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldAlert } from 'lucide-react';
import { apiRequest, setAuthSession } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest<{ accessToken: string; user: any }>('/auth/login', {
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-10 shadow-2xl text-slate-100">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md mx-auto mb-3">
            <span className="font-bold text-lg tracking-tight">MSP</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            MSP Properties
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Real Estate Management & Operations Suite
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium text-slate-300 mb-1.5">
              Authorized Email ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@mspproperties.com"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
            Quick Role Select (Dev Mode)
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDemoUser('admin@mspproperties.com')}
              className={`p-2 rounded-lg border text-center transition-colors cursor-pointer text-xs font-medium ${
                email === 'admin@mspproperties.com'
                  ? 'bg-slate-800 border-emerald-500 text-emerald-400'
                  : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('vignesh@mspproperties.com')}
              className={`p-2 rounded-lg border text-center transition-colors cursor-pointer text-xs font-medium ${
                email === 'vignesh@mspproperties.com'
                  ? 'bg-slate-800 border-emerald-500 text-emerald-400'
                  : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Executive
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('anitha@mspproperties.com')}
              className={`p-2 rounded-lg border text-center transition-colors cursor-pointer text-xs font-medium ${
                email === 'anitha@mspproperties.com'
                  ? 'bg-slate-800 border-emerald-500 text-emerald-400'
                  : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Accountant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
