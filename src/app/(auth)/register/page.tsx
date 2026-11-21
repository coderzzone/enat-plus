'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Heart, Calendar, User, Phone, Lock, Mail, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { SAFETY_DISCLAIMER, CLINICAL_ESTIMATE_NOTE } from '@/lib/pregnancy';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState<'en' | 'am'>('en');
  
  // Pregnancy onboarding details
  const [lmpDate, setLmpDate] = useState('');
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [clinicianConfirmedEdd, setClinicianConfirmedEdd] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!lmpDate) {
      setError('Please select your Last Menstrual Period (LMP) date to track your pregnancy.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // 1. Sign up user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'mother',
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // 2. Create or upsert profile
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          role: 'mother',
          full_name: fullName,
          phone: phone || null,
          language,
        });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        // 3. Create pregnancy record
        const { error: pregError } = await supabase.from('pregnancies').insert({
          mother_id: authData.user.id,
          lmp_date: lmpDate,
          cycle_length: Number(cycleLength) || 28,
          clinician_confirmed_edd: clinicianConfirmedEdd ? clinicianConfirmedEdd : null,
          is_active: true,
        });

        if (pregError) {
          console.error('Pregnancy record error:', pregError);
        }

        // Redirect to Mother App Dashboard
        router.push('/app');
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-8 max-w-lg mx-auto w-full">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-enat-100 text-enat-700 mb-2">
          <Heart className="w-6 h-6 fill-enat-600 text-enat-700" />
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">Create Mother Account</h1>
        <p className="text-xs text-stone-500 mt-1">Start tracking your maternal journey safely</p>
      </div>

      {/* Safety Notice */}
      <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 mb-6">
        <p className="font-semibold text-amber-950 mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" /> General Health Information
        </p>
        <p className="text-[11px] leading-relaxed">{SAFETY_DISCLAIMER}</p>
      </div>

      {error && (
        <div className="w-full bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 mb-4 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleRegister} className="w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-5">
        <h2 className="text-sm font-bold text-stone-800 border-b border-stone-100 pb-2">
          1. Your Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Almaz Bekele"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+251 91 123 4567"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mother@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Preferred Language
          </label>
          <div className="flex gap-4">
            <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
              <input
                type="radio"
                name="lang"
                value="en"
                checked={language === 'en'}
                onChange={() => setLanguage('en')}
                className="text-enat-700 focus:ring-enat-600"
              />
              <span>English</span>
            </label>
            <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
              <input
                type="radio"
                name="lang"
                value="am"
                checked={language === 'am'}
                onChange={() => setLanguage('am')}
                className="text-enat-700 focus:ring-enat-600"
              />
              <span>አማርኛ (Amharic)</span>
            </label>
          </div>
        </div>

        <h2 className="text-sm font-bold text-stone-800 border-b border-stone-100 pt-3 pb-2">
          2. Pregnancy Onboarding
        </h2>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            First Day of Last Menstrual Period (LMP) *
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
            <input
              type="date"
              required
              value={lmpDate}
              onChange={(e) => setLmpDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
            />
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Used to calculate your current pregnancy week and estimated due date.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Cycle Length (Days)
            </label>
            <input
              type="number"
              min={20}
              max={45}
              value={cycleLength}
              onChange={(e) => setCycleLength(Number(e.target.value))}
              placeholder="28"
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
            />
            <p className="text-[10px] text-stone-400 mt-1">Default is 28 days.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Clinician-Confirmed EDD (Optional)
            </label>
            <input
              type="date"
              value={clinicianConfirmedEdd}
              onChange={(e) => setClinicianConfirmedEdd(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
            />
            <p className="text-[10px] text-stone-400 mt-1">From ultrasound or doctor.</p>
          </div>
        </div>

        <p className="text-[11px] text-stone-500 italic bg-stone-50 p-2.5 rounded-lg border border-stone-200">
          Note: {CLINICAL_ESTIMATE_NOTE}
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-enat-700 hover:bg-enat-800 text-white font-medium text-sm py-3 px-4 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            'Complete Registration & Open App'
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-6 text-center text-xs text-stone-600">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-enat-700 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
