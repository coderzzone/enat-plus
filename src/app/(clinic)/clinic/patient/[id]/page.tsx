'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { calculatePregnancy } from '@/lib/pregnancy';
import { logAuditEvent } from '@/lib/audit';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Activity, 
  Lock, 
  ShieldCheck, 
  Plus, 
  Heart, 
  Scale, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2 
} from 'lucide-react';

export default function ClinicPatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = typeof params.id === 'string' ? params.id : '';

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [enrollment, setEnrollment] = useState<any | null>(null);
  const [consents, setConsents] = useState<Record<string, boolean>>({
    pregnancy_summary: false,
    appointments: false,
    health_records: false,
  });
  const [pregnancyCalc, setPregnancyCalc] = useState<any | null>(null);
  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showAddApptModal, setShowAddApptModal] = useState(false);
  const [newApptTitle, setNewApptTitle] = useState('');
  const [newApptTime, setNewApptTime] = useState('');
  const [savingAppt, setSavingAppt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) {
      loadPatientDetails();
    }
  }, [patientId]);

  async function loadPatientDetails() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get staff's organization ID
      const { data: orgStaff } = await supabase
        .from('organization_staff')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!orgStaff) {
        setError('No organization linked to this staff account.');
        setLoading(false);
        return;
      }

      const orgId = orgStaff.organization_id;

      // 2. Fetch enrollment to confirm patient is enrolled in this clinic
      const { data: enrollData, error: enrollErr } = await supabase
        .from('patient_enrollments')
        .select('*')
        .eq('mother_id', patientId)
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .maybeSingle();

      if (enrollErr || !enrollData) {
        setError('Patient is not actively enrolled with your clinic.');
        setLoading(false);
        return;
      }

      setEnrollment(enrollData);

      // 3. Fetch patient profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single();

      setProfile(profileData);

      // 4. Fetch consent records to see granted scopes
      const { data: consentRows } = await supabase
        .from('consent_records')
        .select('scope, revoked_at')
        .eq('mother_id', patientId)
        .eq('organization_id', orgId);

      const activeConsents: Record<string, boolean> = {
        pregnancy_summary: false,
        appointments: false,
        health_records: false,
      };

      if (consentRows) {
        consentRows.forEach((c) => {
          if (!c.revoked_at) {
            activeConsents[c.scope] = true;
          }
        });
      }
      setConsents(activeConsents);

      // 5. Query data strictly under Supabase RLS!
      // If active consent for pregnancy_summary exists, RLS will allow selecting pregnancy row
      const { data: pregData } = await supabase
        .from('pregnancies')
        .select('*')
        .eq('mother_id', patientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pregData && pregData.lmp_date) {
        const calc = calculatePregnancy(pregData.lmp_date, pregData.cycle_length, pregData.clinician_confirmed_edd);
        setPregnancyCalc(calc);
      }

      // If active consent for health_records exists, RLS allows selecting rows
      const { data: healthData } = await supabase
        .from('health_records')
        .select('*')
        .eq('mother_id', patientId)
        .order('recorded_at', { ascending: false });

      setHealthRecords(healthData || []);

      // If active consent for appointments exists, RLS allows selecting appointments
      const { data: apptData } = await supabase
        .from('appointments')
        .select('*')
        .eq('mother_id', patientId)
        .eq('organization_id', orgId)
        .order('scheduled_at', { ascending: true });

      setAppointments(apptData || []);

      // 6. Log audit event (non-negotiable safety & audit rule)
      await logAuditEvent({
        action: 'view_patient_detail',
        targetUserId: patientId,
        organizationId: orgId,
        details: { activeConsents },
      });

    } catch (err: any) {
      setError(err?.message || 'Failed to load patient detail.');
    } finally {
      setLoading(false);
    }
  }

  // Create appointment for this enrolled mother
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAppt(true);
    setError(null);

    if (!newApptTitle || !newApptTime) {
      setError('Please provide appointment title and schedule time.');
      setSavingAppt(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !enrollment) return;

      const { data: newAppt, error: apptErr } = await supabase
        .from('appointments')
        .insert({
          mother_id: patientId,
          organization_id: enrollment.organization_id,
          title: newApptTitle.trim(),
          scheduled_at: new Date(newApptTime).toISOString(),
          status: 'scheduled',
          created_by: user.id,
        })
        .select()
        .single();

      if (apptErr) throw apptErr;

      await logAuditEvent({
        action: 'create_appointment',
        targetUserId: patientId,
        organizationId: enrollment.organization_id,
        details: { title: newApptTitle, scheduled_at: newApptTime },
      });

      setAppointments((prev) => [...prev, newAppt].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()));
      setShowAddApptModal(false);
      setNewApptTitle('');
      setNewApptTime('');
    } catch (err: any) {
      setError(err?.message || 'Failed to schedule appointment.');
    } finally {
      setSavingAppt(false);
    }
  };

  // Update appointment status (attended / missed)
  const handleUpdateApptStatus = async (apptId: string, status: 'attended' | 'missed') => {
    try {
      const supabase = createClient();
      setAppointments((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, status } : a))
      );

      await supabase.from('appointments').update({ status }).eq('id', apptId);

      await logAuditEvent({
        action: 'update_appointment',
        targetUserId: patientId,
        organizationId: enrollment?.organization_id,
        details: { apptId, status },
      });
    } catch (err) {
      console.error('Failed to update appointment status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-enat-700 mb-2" />
        <p className="text-xs">Loading patient medical chart...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="text-base font-bold text-stone-900">Access Restricted</h2>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">{error || 'Unable to view patient chart.'}</p>
        <Link
          href="/clinic"
          className="inline-block bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold px-4 py-2 rounded-xl transition"
        >
          Return to Patient Registry
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Patient Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/clinic"
            className="p-2 rounded-xl hover:bg-stone-200 text-stone-600 transition bg-white border border-stone-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-stone-900">{profile.full_name}</h1>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                Active Patient
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Phone: {profile.phone || 'None'} • Preferred Language: {profile.language === 'am' ? 'Amharic' : 'English'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddApptModal(true)}
          className="inline-flex items-center justify-center bg-enat-700 hover:bg-enat-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Schedule Appointment
        </button>
      </div>

      {/* Consent Status Strip */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
        <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-enat-700" />
          Granted Patient Sharing Scopes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-3 rounded-xl border text-xs ${consents.pregnancy_summary ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold">Pregnancy Summary</span>
              {consents.pregnancy_summary ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-stone-400" />}
            </div>
            <p className="text-[10px] mt-1 text-stone-500">Week, trimester, EDD</p>
          </div>

          <div className={`p-3 rounded-xl border text-xs ${consents.appointments ? 'bg-blue-50/70 border-blue-200 text-blue-900' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold">Appointments</span>
              {consents.appointments ? <CheckCircle2 className="w-4 h-4 text-blue-600" /> : <Lock className="w-4 h-4 text-stone-400" />}
            </div>
            <p className="text-[10px] mt-1 text-stone-500">Clinic visit tracking</p>
          </div>

          <div className={`p-3 rounded-xl border text-xs ${consents.health_records ? 'bg-purple-50/70 border-purple-200 text-purple-900' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold">Health Records</span>
              {consents.health_records ? <CheckCircle2 className="w-4 h-4 text-purple-600" /> : <Lock className="w-4 h-4 text-stone-400" />}
            </div>
            <p className="text-[10px] mt-1 text-stone-500">BP, weight, symptoms</p>
          </div>
        </div>
      </div>

      {/* Grid: Consented Pregnancy Summary & Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pregnancy Summary */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-stone-900 flex items-center justify-between border-b border-stone-100 pb-2">
            <span>Pregnancy Overview</span>
            {!consents.pregnancy_summary && (
              <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Lock className="w-3 h-3" /> Not sharing
              </span>
            )}
          </h2>

          {consents.pregnancy_summary && pregnancyCalc ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-[10px] text-stone-500 block uppercase font-medium">Gestational Age</span>
                  <span className="text-lg font-black text-stone-900">
                    Week {pregnancyCalc.weeks} + {pregnancyCalc.days}d
                  </span>
                  <span className="text-[10px] text-stone-400 block">Trimester {pregnancyCalc.trimester}</span>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-[10px] text-stone-500 block uppercase font-medium">Estimated Due Date</span>
                  <span className="text-base font-bold text-stone-900">
                    {pregnancyCalc.formattedEdd}
                  </span>
                  {pregnancyCalc.isClinicianConfirmed && (
                    <span className="text-[10px] text-emerald-600 block">Clinician Confirmed</span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-stone-600 mb-1">
                  <span>Gestational Progress (40 weeks)</span>
                  <span className="font-semibold">{pregnancyCalc.progressPercent}%</span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-enat-700 h-full rounded-full"
                    style={{ width: `${Math.max(4, pregnancyCalc.progressPercent)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-stone-400 space-y-1">
              <Lock className="w-6 h-6 mx-auto text-stone-300" />
              <p className="text-xs font-medium text-stone-600">Pregnancy summary is not shared.</p>
              <p className="text-[10px] text-stone-400">The patient has not granted the 'pregnancy_summary' consent scope.</p>
            </div>
          )}
        </div>

        {/* Appointments Section */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-stone-600" />
              Scheduled Visits ({appointments.length})
            </h2>
            <button
              onClick={() => setShowAddApptModal(true)}
              className="text-xs font-semibold text-enat-700 hover:underline"
            >
              + Add
            </button>
          </div>

          {appointments.length > 0 ? (
            <div className="space-y-2.5">
              {appointments.map((appt) => (
                <div key={appt.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-stone-900">{appt.title}</p>
                    <p className="text-[11px] text-stone-500">
                      {new Date(appt.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                      at {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      appt.status === 'attended'
                        ? 'bg-emerald-100 text-emerald-800'
                        : appt.status === 'missed'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {appt.status}
                    </span>

                    {appt.status === 'scheduled' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleUpdateApptStatus(appt.id, 'attended')}
                          className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-stone-200 rounded text-[10px] font-semibold"
                        >
                          Attended
                        </button>
                        <button
                          onClick={() => handleUpdateApptStatus(appt.id, 'missed')}
                          className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-stone-200 rounded text-[10px] font-semibold"
                        >
                          Missed
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-stone-400 text-xs">
              No appointments on record for this patient.
            </div>
          )}
        </div>
      </div>

      {/* Consented Health Records Section */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-stone-900 flex items-center justify-between border-b border-stone-100 pb-2">
          <span className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-enat-700" />
            Consented Health Records & Observations
          </span>
          {!consents.health_records && (
            <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Lock className="w-3 h-3" /> Not sharing
            </span>
          )}
        </h2>

        {consents.health_records ? (
          healthRecords.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {healthRecords.map((rec) => (
                <div key={rec.id} className="py-3 flex items-start space-x-3 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0 text-stone-700 mt-0.5">
                    {rec.type === 'blood_pressure' && <Heart className="w-4 h-4 text-rose-600" />}
                    {rec.type === 'weight' && <Scale className="w-4 h-4 text-enat-700" />}
                    {rec.type === 'symptom' && <FileText className="w-4 h-4 text-amber-600" />}
                    {rec.type === 'note' && <FileText className="w-4 h-4 text-stone-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-stone-800 uppercase text-[10px]">
                        {rec.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(rec.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {rec.type === 'blood_pressure' && (
                      <p className="font-semibold text-stone-900">
                        {rec.systolic} / {rec.diastolic} mmHg
                      </p>
                    )}

                    {rec.type === 'weight' && (
                      <p className="font-semibold text-stone-900">
                        {rec.weight_kg} kg
                      </p>
                    )}

                    {rec.text && (
                      <p className="text-stone-600 mt-0.5 leading-normal bg-stone-50 p-2 rounded-lg border border-stone-100">
                        {rec.text}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-stone-400 text-xs">
              Patient has granted access, but no health records have been logged yet.
            </div>
          )
        ) : (
          <div className="p-8 text-center text-stone-400 space-y-1">
            <Lock className="w-6 h-6 mx-auto text-stone-300" />
            <p className="text-xs font-medium text-stone-600">Health records are hidden by patient privacy settings.</p>
            <p className="text-[10px] text-stone-400">The patient has not enabled the 'health_records' scope.</p>
          </div>
        )}
      </div>

      {/* Modal: Schedule Appointment */}
      {showAddApptModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">Schedule Clinical Visit</h3>

            <form onSubmit={handleCreateAppointment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Visit Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 28-Week Routine Checkup"
                  value={newApptTitle}
                  onChange={(e) => setNewApptTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Scheduled Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newApptTime}
                  onChange={(e) => setNewApptTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddApptModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAppt}
                  className="px-4 py-2 text-xs font-semibold bg-enat-700 hover:bg-enat-800 text-white rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {savingAppt ? 'Saving...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
