'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { logAuditEvent } from '@/lib/audit';
import { Calendar, CheckCircle2, XCircle, Clock, Plus, Loader2, AlertCircle, User } from 'lucide-react';

export default function ClinicAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'attended' | 'missed'>('upcoming');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedMotherId, setSelectedMotherId] = useState('');
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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
      const orgId = orgStaff.organization_id;

      // 1. Fetch appointments for this clinic
      const { data: apptRows, error: apptErr } = await supabase
        .from('appointments')
        .select(`
          *,
          profiles:mother_id (id, full_name, phone)
        `)
        .eq('organization_id', orgId)
        .order('scheduled_at', { ascending: true });

      if (apptErr) throw apptErr;
      setAppointments(apptRows || []);

      // 2. Fetch enrolled mothers for dropdown
      const { data: enrollments } = await supabase
        .from('patient_enrollments')
        .select(`
          mother_id,
          profiles:mother_id (id, full_name)
        `)
        .eq('organization_id', orgId)
        .eq('status', 'active');

      if (enrollments) {
        setPatients(enrollments.map((e: any) => ({
          id: e.mother_id,
          name: e.profiles?.full_name || 'Patient',
        })));
        if (enrollments.length > 0) {
          setSelectedMotherId(enrollments[0].mother_id);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (apptId: string, status: 'attended' | 'missed') => {
    try {
      const supabase = createClient();
      setAppointments((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, status } : a))
      );

      await supabase.from('appointments').update({ status }).eq('id', apptId);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!selectedMotherId || !title || !scheduledAt) {
      setError('Please fill in all appointment fields.');
      setSaving(false);
      return;
    }

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

      const { data: newAppt, error: insertErr } = await supabase
        .from('appointments')
        .insert({
          mother_id: selectedMotherId,
          organization_id: orgStaff.organization_id,
          title,
          scheduled_at: new Date(scheduledAt).toISOString(),
          status: 'scheduled',
          created_by: user.id,
        })
        .select(`*, profiles:mother_id (id, full_name, phone)`)
        .single();

      if (insertErr) throw insertErr;

      setAppointments((prev) => [...prev, newAppt].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()));
      setShowModal(false);
      setTitle('');
      setScheduledAt('');
    } catch (err: any) {
      setError(err?.message || 'Failed to book appointment.');
    } finally {
      setSaving(false);
    }
  };

  const now = new Date();
  const filteredAppointments = appointments.filter((a) => {
    if (filter === 'upcoming') return a.status === 'scheduled' && new Date(a.scheduled_at) >= now;
    if (filter === 'attended') return a.status === 'attended';
    if (filter === 'missed') return a.status === 'missed';
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-enat-700 mb-2" />
        <p className="text-xs">Loading appointments schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-enat-700" />
            Clinic Appointments Schedule
          </h1>
          <p className="text-xs text-stone-500">
            Manage antenatal checkups and track attended visits.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center bg-enat-700 hover:bg-enat-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Book Appointment
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-stone-200 pb-3">
        {(['upcoming', 'attended', 'missed', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
              filter === tab
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {filteredAppointments.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {filteredAppointments.map((appt) => (
              <div key={appt.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-stone-50/50">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-stone-900">{appt.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      appt.status === 'attended'
                        ? 'bg-emerald-100 text-emerald-800'
                        : appt.status === 'missed'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {appt.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-stone-500 text-[11px]">
                    <span className="font-semibold text-stone-700">
                      Patient: {appt.profiles?.full_name || 'Enrolled Patient'}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(appt.scheduled_at).toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      at {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {appt.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'attended')}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Attended
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'missed')}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Mark Missed
                      </button>
                    </>
                  )}
                  <Link
                    href={`/clinic/patient/${appt.mother_id}`}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold"
                  >
                    View Chart
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-stone-400 text-xs">
            No {filter} appointments found.
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">Book Antenatal Visit</h3>

            <form onSubmit={handleCreateAppointment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Select Enrolled Patient *
                </label>
                <select
                  value={selectedMotherId}
                  onChange={(e) => setSelectedMotherId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600 bg-white"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Appointment Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 20-Week Anomaly Ultrasound"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold bg-enat-700 hover:bg-enat-800 text-white rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {saving ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
