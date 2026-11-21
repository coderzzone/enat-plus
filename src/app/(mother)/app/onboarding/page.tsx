'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Calendar, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { CLINICAL_ESTIMATE_NOTE, SAFETY_DISCLAIMER } from '@/lib/pregnancy';

export default function MotherOnboardingPage() {
  const router = useRouter();
  const [lmpDate, setLmpDate] = useState('');
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [clinicianConfirmedEdd, setClinicianConfirmedEdd] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCurrentPregnancy() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: preg } = await supabase
        .from('pregnancies')
        .select('*')
        .eq('mother_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (preg) {
        setLmpDate(preg.lmp_date || '');
        setCycleLength(preg.cycle_length || 28);
        setClinicianConfirmedEdd(preg.clinician_confirmed_edd || '');
      }
      setLoading(false);
    }
    loadCurrentPregnancy();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!lmpDate) {
      setError('Please select your Last Menstrual Period date.');
      setSaving(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Upsert or insert pregnancy record
      const { error: saveError } = await supabase
        .from('pregnancies')
        .insert({
          mother_id: user.id,
          lmp_date: lmpDate,
          cycle_length: Number(cycleLength) || 28,
          clinician_confirmed_edd: clinicianConfirmedEdd ? clinicianConfirmedEdd : null,
          is_active: true,
        });

      if (saveError) throw saveError;

      setSuccess(true);
      setTimeout(() => {
        router.push('/app');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save pregnancy details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-500">
        <Loader2 className="w-6 h-6 animate-spin text-enat-700 mb-2" />
        <p className="text-xs">Loading pregnancy settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-bold text-stone-900">Pregnancy Dates & Estimates</h1>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
        <p className="text-[11px] leading-relaxed">{SAFETY_DISCLAIMER}</p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Pregnancy dates saved! Returning to your dashboard...</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-sm">
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
          <p className="text-[10px] text-stone-400 mt-1">
            Calculation: LMP + 280 days (adjusted by menstrual cycle length - 28 days).
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Average Menstrual Cycle Length (Days)
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
          <p className="text-[10px] text-stone-400 mt-1">
            Standard clinical assumption is 28 days.
          </p>
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
          <p className="text-[10px] text-stone-400 mt-1">
            If provided by an ultrasound dating scan or antenatal assessment.
          </p>
        </div>

        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-[11px] text-stone-500 italic">
          {CLINICAL_ESTIMATE_NOTE}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-enat-700 hover:bg-enat-800 text-white font-medium text-sm py-2.5 px-4 rounded-xl flex items-center justify-center transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Save Pregnancy Information'}
        </button>
      </form>
    </div>
  );
}
