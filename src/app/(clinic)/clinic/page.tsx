'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { calculatePregnancy } from '@/lib/pregnancy';
import { 
  Users, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Calendar, 
  ArrowRight, 
  UserPlus, 
  AlertCircle, 
  Loader2,
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function ClinicPatientsListPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEnrolledPatients();
  }, []);

  async function loadEnrolledPatients() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get staff's organization ID
      const { data: orgStaff } = await supabase
        .from('organization_staff')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!orgStaff) {
        setError('No organization linked to this staff account.');
        setLoading(false);
        return;
      }

      const orgId = orgStaff.organization_id;

      // 2. Fetch active enrollments for this clinic
      const { data: enrollments, error: enrollErr } = await supabase
        .from('patient_enrollments')
        .select(`
          id,
          mother_id,
          status,
          joined_at,
          profiles:mother_id (id, full_name, phone, language)
        `)
        .eq('organization_id', orgId)
        .eq('status', 'active');

      if (enrollErr) throw enrollErr;

      if (!enrollments || enrollments.length === 0) {
        setPatients([]);
        setLoading(false);
        return;
      }

      // 3. For each mother, load consented data under RLS:
      // Note: RLS automatically returns rows ONLY if consent is unrevoked!
      const motherIds = enrollments.map((e) => e.mother_id);

      // Fetch consent records so we know which scopes are granted
      const { data: consents } = await supabase
        .from('consent_records')
        .select('mother_id, scope, revoked_at')
        .eq('organization_id', orgId)
        .in('mother_id', motherIds);

      // Fetch pregnancies (RLS will filter out any unconsented rows!)
      const { data: pregnancies } = await supabase
        .from('pregnancies')
        .select('*')
        .in('mother_id', motherIds)
        .eq('is_active', true);

      // Fetch upcoming appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .in('mother_id', motherIds)
        .eq('organization_id', orgId)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });

      // Build composite patient objects
      const patientList = enrollments.map((enrollment: any) => {
        const motherProfile = enrollment.profiles || {};
        const motherId = enrollment.mother_id;

        // Check active consent scopes
        const motherConsents = consents?.filter(
          (c) => c.mother_id === motherId && !c.revoked_at
        ) || [];

        const hasSummaryConsent = motherConsents.some((c) => c.scope === 'pregnancy_summary');
        const hasAppointmentsConsent = motherConsents.some((c) => c.scope === 'appointments');
        const hasHealthRecordsConsent = motherConsents.some((c) => c.scope === 'health_records');

        // Look up pregnancy data (guarded by RLS)
        const preg = pregnancies?.find((p) => p.mother_id === motherId);
        let calc = null;
        if (preg && preg.lmp_date) {
          calc = calculatePregnancy(preg.lmp_date, preg.cycle_length, preg.clinician_confirmed_edd);
        }

        // Look up next appointment (guarded by RLS)
        const nextAppt = appointments?.find((a) => a.mother_id === motherId);

        return {
          id: motherId,
          enrollmentId: enrollment.id,
          name: motherProfile.full_name || 'Enrolled Patient',
          phone: motherProfile.phone || 'No phone provided',
          language: motherProfile.language || 'en',
          joinedAt: enrollment.joined_at,
          consents: {
            pregnancy_summary: hasSummaryConsent,
            appointments: hasAppointmentsConsent,
            health_records: hasHealthRecordsConsent,
          },
          pregnancyCalc: calc,
          nextAppointment: nextAppt,
        };
      });

      setPatients(patientList);
    } catch (err: any) {
      setError(err?.message || 'Failed to load patients.');
    } finally {
      setLoading(false);
    }
  }

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-enat-700 mb-2" />
        <p className="text-xs">Loading patient registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-enat-700" />
            Enrolled Patients Registry
          </h1>
          <p className="text-xs text-stone-500">
            Mothers actively enrolled with your clinic. Data visibility is strictly governed by patient consent.
          </p>
        </div>

        <Link
          href="/clinic/invite"
          className="inline-flex items-center justify-center bg-enat-700 hover:bg-enat-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          <UserPlus className="w-4 h-4 mr-1.5" /> Enrol New Patient
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by mother's name or phone number..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-enat-600"
          />
        </div>
      </div>

      {/* Patient Table / Cards */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Patient Roster ({filteredPatients.length})
          </h2>
          <span className="text-[11px] text-stone-400">
            RLS Enforcement Active
          </span>
        </div>

        {filteredPatients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 font-semibold">
                  <th className="py-3 px-6">Patient Name & Phone</th>
                  <th className="py-3 px-6">Gestational Week</th>
                  <th className="py-3 px-6">Estimated Due Date</th>
                  <th className="py-3 px-6">Next Appointment</th>
                  <th className="py-3 px-6">Consent Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredPatients.map((patient) => {
                  const hasSummary = patient.consents.pregnancy_summary;
                  const hasAppt = patient.consents.appointments;

                  return (
                    <tr key={patient.id} className="hover:bg-stone-50/60 transition-colors">
                      {/* Name & Phone */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-stone-900 text-sm">{patient.name}</div>
                        <div className="text-[11px] text-stone-500 font-mono">{patient.phone}</div>
                      </td>

                      {/* Gestational Week (only if consented) */}
                      <td className="py-4 px-6">
                        {hasSummary && patient.pregnancyCalc ? (
                          <div>
                            <span className="font-semibold text-stone-800">
                              Week {patient.pregnancyCalc.weeks} + {patient.pregnancyCalc.days}d
                            </span>
                            <span className="text-[10px] text-stone-400 block">
                              Trimester {patient.pregnancyCalc.trimester}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-medium">
                            <Lock className="w-3 h-3" /> Not sharing
                          </span>
                        )}
                      </td>

                      {/* EDD (only if consented) */}
                      <td className="py-4 px-6">
                        {hasSummary && patient.pregnancyCalc ? (
                          <div>
                            <span className="font-medium text-stone-800">
                              {patient.pregnancyCalc.formattedEdd}
                            </span>
                            {patient.pregnancyCalc.isClinicianConfirmed && (
                              <span className="text-[10px] text-emerald-600 block">
                                Confirmed
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-medium">
                            <Lock className="w-3 h-3" /> Not sharing
                          </span>
                        )}
                      </td>

                      {/* Next Appointment (only if consented) */}
                      <td className="py-4 px-6">
                        {hasAppt ? (
                          patient.nextAppointment ? (
                            <div>
                              <span className="font-medium text-stone-800">
                                {new Date(patient.nextAppointment.scheduled_at).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              <span className="text-[10px] text-stone-500 block truncate max-w-[140px]">
                                {patient.nextAppointment.title}
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-400 italic">None scheduled</span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-medium">
                            <Lock className="w-3 h-3" /> Not sharing
                          </span>
                        )}
                      </td>

                      {/* Consented Badges */}
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {patient.consents.pregnancy_summary && (
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                              Summary
                            </span>
                          )}
                          {patient.consents.appointments && (
                            <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-medium">
                              Appts
                            </span>
                          )}
                          {patient.consents.health_records && (
                            <span className="text-[9px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-medium">
                              Health
                            </span>
                          )}
                          {!patient.consents.pregnancy_summary &&
                            !patient.consents.appointments &&
                            !patient.consents.health_records && (
                              <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                                No active sharing
                              </span>
                            )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/clinic/patient/${patient.id}`}
                          className="inline-flex items-center text-enat-700 hover:text-enat-900 font-bold hover:underline"
                        >
                          View Detail <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-stone-400 space-y-3">
            <Users className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-semibold text-stone-700">No enrolled patients found.</p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Enrol mothers by sending them an invitation link or having them scan a clinic QR code.
            </p>
            <Link
              href="/clinic/invite"
              className="inline-block bg-enat-700 hover:bg-enat-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition mt-2"
            >
              Generate Patient Invitation
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
