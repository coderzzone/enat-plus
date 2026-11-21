'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Heart, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { SAFETY_DISCLAIMER } from '@/lib/pregnancy';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Query profile role to perform correct redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      const userRole = profile?.role || 'mother';
      if (userRole === 'super_admin') {
        router.push('/admin');
      } else if (userRole === 'clinic_staff') {
        router.push('/clinic');
      } else {
        router.push('/app');
      }
      router.refresh();
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-8 max-w-md mx-auto w-full">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-enat-100 text-enat-700 mb-2">
          <Heart className="w-6 h-6 fill-enat-600 text-enat-700" />
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">Sign in to Enat Plus</h1>
        <p className="text-xs text-stone-500 mt-1">Maternal Health Companion for Ethiopia</p>
      </div>

      {/* Safety Notice */}
      <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 mb-6">
        <p className="text-[11px] leading-snug">{SAFETY_DISCLAIMER}</p>
      </div>

      {error && (
        <div className="w-full bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 mb-4 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. mother@example.com"
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-enat-700 hover:bg-enat-800 text-white font-medium text-sm py-3 px-4 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="mt-6 text-center text-xs text-stone-600">
        New mother or independent user?{' '}
        <Link href="/register" className="font-semibold text-enat-700 hover:underline">
          Create an account
        </Link>
      </div>

      {/* Quick Demo Credentials shortcut */}
      <div className="mt-8 pt-4 border-t border-stone-200 text-center text-[11px] text-stone-500 w-full space-y-1.5">
        <div className="font-medium text-stone-700">Quick Test Credentials:</div>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => { setEmail('mother.chaltu@example.com'); setPassword('EnatDemo123!'); }}
            className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 rounded text-stone-800"
          >
            Mother Chaltu
          </button>
          <button
            type="button"
            onClick={() => { setEmail('nurse.tigist@stpaulclinic.et'); setPassword('EnatDemo123!'); }}
            className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 rounded text-stone-800"
          >
            Nurse Tigist
          </button>
          <button
            type="button"
            onClick={() => { setEmail('admin@stpaulclinic.et'); setPassword('EnatDemo123!'); }}
            className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 rounded text-stone-800"
          >
            Clinic Admin
          </button>
          <button
            type="button"
            onClick={() => { setEmail('superadmin@enatplus.et'); setPassword('EnatDemo123!'); }}
            className="px-2.5 py-1 bg-stone-800 hover:bg-stone-900 rounded text-white font-medium"
          >
            Super Admin
          </button>
        </div>
      </div>
    </div>
  );
}
