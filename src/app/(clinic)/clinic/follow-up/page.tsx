'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AlertTriangle, Phone, CheckCircle2, Calendar, ArrowRight, Loader2 } from 'lucide-react';

export default function ClinicFollowUpPage() {
  const [missedAppointments, setMissedAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMissedAppointments();
  }, []);

  async function loadMissedAppointments() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: orgStaff } = await supabase
        .from('organization_staff')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!orgStaff) return;

      // Query missed appointments
      const { data: rows, error: err } = await supabase
        .from('appointments')
        .select(`
          *,
          profiles:mother_id (id, full_name, phone, language)
        `)
        .eq('organization_id', orgStaff.organization_id)
        .eq('status', 'missed')
        .order('scheduled_at', { ascending: false });

      if (err) throw err;
      setMissedAppointments(rows || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load missed visits.');
    } finally {
      setLoading(false);
    }
  }

  const handleResolveMissed = async (apptId: string) => {
    try {
      const supabase = createClient();
      setMissedAppointments((prev) => prev.filter((a) => a.id !== apptId));
      await supabase.from('appointments').update({ status: 'attended' }).eq('id', apptId);
    } catch (err) {
      console.error('Error resolving missed appointment:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-enat-700 mb-2" />
        <p className="text-xs">Loading follow-up priority list...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
          Follow-Up Needed (Missed Appointments)
        </h1>
        <p className="text-xs text-stone-500">
          Patients who missed their antenatal care visits and require outreach or rescheduling.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Priority Outreach List ({missedAppointments.length})
          </h2>
          <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            Action Required
          </span>
        </div>

        {missedAppointments.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {missedAppointments.map((appt) => (
              <div key={appt.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/50">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-stone-900">
                      {appt.profiles?.full_name || 'Enrolled Patient'}
                    </span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-semibold px-2 py-0.5 rounded-full">
                      Missed Checkup
                    </span>
                  </div>

                  <p className="text-xs text-stone-700 font-medium">{appt.title}</p>

                  <div className="flex items-center space-x-3 text-[11px] text-stone-500">
                    <span className="flex items-center gap-1 font-mono text-stone-800">
                      <Phone className="w-3 h-3 text-stone-400" />
                      {appt.profiles?.phone || 'No phone recorded'}
                    </span>
                    <span>•</span>
                    <span>
                      Scheduled for:{' '}
                      {new Date(appt.scheduled_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleResolveMissed(appt.id)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                  <Link
                    href={`/clinic/patient/${appt.mother_id}`}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center gap-1"
                  >
                    Patient Chart <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-stone-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-stone-700">All set! No missed appointments.</p>
            <p className="text-xs text-stone-400">All registered patients have attended their scheduled visits.</p>
          </div>
        )}
      </div>
    </div>
  );
}
