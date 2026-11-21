'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logAuditEvent } from '@/lib/audit';
import { 
  ShieldCheck, 
  Building2, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  QrCode, 
  Loader2, 
  FileCheck, 
  Calendar, 
  Activity, 
  ArrowRight,
  Info
} from 'lucide-react';
import { SAFETY_DISCLAIMER } from '@/lib/pregnancy';

export default function ClinicConnectionPrivacyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enrolledClinic, setEnrolledClinic] = useState<any | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [invitationCode, setInvitationCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Consent states
  const [consents, setConsents] = useState<{
    pregnancy_summary: boolean;
    appointments: boolean;
    health_records: boolean;
  }>({
    pregnancy_summary: false,
    appointments: false,
    health_records: false,
  });

  const [togglingScope, setTogglingScope] = useState<string | null>(null);

  useEffect(() => {
    loadClinicAndConsent();
  }, []);

  async function loadClinicAndConsent() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // 1. Fetch active enrollment
      const { data: enrollData, error: enrollErr } = await supabase
        .from('patient_enrollments')
        .select('id, organization_id, status, organizations(id, name, city, phone)')
        .eq('mother_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (enrollErr) {
        console.error('Error fetching enrollment:', enrollErr);
      }

      if (enrollData && enrollData.organizations) {
        setEnrolledClinic(enrollData.organizations);
        setEnrollmentId(enrollData.id);

        // 2. Fetch existing consent records for this clinic
        const { data: consentRows } = await supabase
          .from('consent_records')
          .select('scope, revoked_at')
          .eq('mother_id', user.id)
          .eq('organization_id', enrollData.organization_id);

        const activeConsents = {
          pregnancy_summary: false,
          appointments: false,
          health_records: false,
        };

        if (consentRows) {
          consentRows.forEach((r) => {
            if (!r.revoked_at) {
              if (r.scope === 'pregnancy_summary') activeConsents.pregnancy_summary = true;
              if (r.scope === 'appointments') activeConsents.appointments = true;
              if (r.scope === 'health_records') activeConsents.health_records = true;
            }
          });
        }

        setConsents(activeConsents);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load clinic information.');
    } finally {
      setLoading(false);
    }
  }

  // Toggle individual scope
  const handleToggleConsent = async (scope: 'pregnancy_summary' | 'appointments' | 'health_records') => {
    if (!enrolledClinic) return;
    setTogglingScope(scope);
    setError(null);
    setSuccessMsg(null);

    const willBeActive = !consents[scope];
    const prevConsentState = { ...consents };

    // Optimistic UI update
    setConsents((prev) => ({ ...prev, [scope]: willBeActive }));

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (willBeActive) {
        // Grant consent
        const { error: upsertErr } = await supabase
          .from('consent_records')
          .upsert(
            {
              mother_id: user.id,
              organization_id: enrolledClinic.id,
              scope,
              granted_at: new Date().toISOString(),
              revoked_at: null,
            },
            { onConflict: 'mother_id,organization_id,scope' }
          );

        if (upsertErr) throw upsertErr;

        await logAuditEvent({
          action: 'grant_consent',
          organizationId: enrolledClinic.id,
          details: { scope, granted_at: new Date().toISOString() },
        });

        setSuccessMsg(`Sharing enabled for: ${scope.replace('_', ' ')}.`);
      } else {
        // Revoke immediately
        const { error: revokeErr } = await supabase
          .from('consent_records')
          .update({ revoked_at: new Date().toISOString() })
          .eq('mother_id', user.id)
          .eq('organization_id', enrolledClinic.id)
          .eq('scope', scope);

        if (revokeErr) throw revokeErr;

        await logAuditEvent({
          action: 'revoke_consent',
          organizationId: enrolledClinic.id,
          details: { scope, revoked_at: new Date().toISOString() },
        });

        setSuccessMsg(`Sharing revoked immediately for: ${scope.replace('_', ' ')}.`);
      }
    } catch (err: any) {
      // Rollback on failure
      setConsents(prevConsentState);
      setError(err?.message || 'Failed to update sharing preference.');
    } finally {
      setTogglingScope(null);
    }
  };

  // Join clinic via token code manually
  const handleJoinViaCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationCode.trim()) return;
    setConnecting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const trimmedToken = invitationCode.trim().toUpperCase();

      // Look up invitation
      const { data: invite, error: inviteErr } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', trimmedToken)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (inviteErr || !invite) {
        throw new Error('Invalid, expired, or already used invitation code.');
      }

      // Create enrollment
      const { error: enrollErr } = await supabase
        .from('patient_enrollments')
        .upsert(
          {
            mother_id: user.id,
            organization_id: invite.organization_id,
            status: 'active',
            invited_at: invite.created_at,
            joined_at: new Date().toISOString(),
          },
          { onConflict: 'mother_id,organization_id' }
        );

      if (enrollErr) throw enrollErr;

      // Mark invitation accepted
      await supabase
        .from('invitations')
        .update({ status: 'accepted', used_by: user.id })
        .eq('id', invite.id);

      await logAuditEvent({
        action: 'accept_invitation',
        organizationId: invite.organization_id,
        details: { token: trimmedToken },
      });

      setSuccessMsg('Successfully connected to clinic! You can now choose what to share below.');
      setInvitationCode('');
      await loadClinicAndConsent();
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to clinic.');
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect / Revoke clinic enrollment
  const handleDisconnectClinic = async () => {
    if (!confirm('Are you sure you want to disconnect from this clinic? All sharing will be immediately revoked.')) {
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !enrolledClinic) return;

      // Revoke all consents first
      await supabase
        .from('consent_records')
        .update({ revoked_at: new Date().toISOString() })
        .eq('mother_id', user.id)
        .eq('organization_id', enrolledClinic.id);

      // Set enrollment to revoked
      await supabase
        .from('patient_enrollments')
        .update({ status: 'revoked' })
        .eq('mother_id', user.id)
        .eq('organization_id', enrolledClinic.id);

      await logAuditEvent({
        action: 'revoke_consent',
        organizationId: enrolledClinic.id,
        details: { reason: 'mother_disconnected_clinic' },
      });

      setEnrolledClinic(null);
      setConsents({ pregnancy_summary: false, appointments: false, health_records: false });
      setSuccessMsg('Disconnected from clinic. Your data is now completely private.');
    } catch (err: any) {
      setError(err?.message || 'Failed to disconnect from clinic.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-500">
        <Loader2 className="w-6 h-6 animate-spin text-enat-700 mb-2" />
        <p className="text-xs">Loading clinic & privacy settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div>
        <h1 className="text-lg font-bold text-stone-900 flex items-center gap-1.5">
          <ShieldCheck className="w-5 h-5 text-enat-700" />
          Clinic Connection & Privacy Controls
        </h1>
        <p className="text-xs text-stone-500">
          You are always in control. Sharing is explicit, limited, and revocable at any second.
        </p>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Connected Clinic Card or Connect Input */}
      {enrolledClinic ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-enat-100 text-enat-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-1 border border-emerald-200">
                  Connected Clinic
                </span>
                <h2 className="text-base font-bold text-stone-900 leading-tight">
                  {enrolledClinic.name}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {enrolledClinic.city} {enrolledClinic.phone ? `• ${enrolledClinic.phone}` : ''}
                </p>
              </div>
            </div>

            <button
              onClick={handleDisconnectClinic}
              className="text-stone-400 hover:text-rose-600 text-xs font-medium p-1 hover:bg-stone-50 rounded"
              title="Disconnect from clinic"
            >
              Disconnect
            </button>
          </div>

          <div className="border-t border-stone-100 pt-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-enat-700" />
              Privacy & Data Sharing Toggles
            </h3>
            <p className="text-[11px] text-stone-500 mb-3">
              Default is OFF. Clinic staff can ONLY view the exact scopes you enable below.
            </p>

            {/* Scope 1: Pregnancy Summary */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 mb-2.5 flex items-start justify-between space-x-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <FileCheck className="w-4 h-4 text-stone-600" />
                  <span className="text-xs font-bold text-stone-900">Pregnancy Summary</span>
                </div>
                <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                  Allows clinic staff to see your current week, trimester, and estimated due date (EDD).
                </p>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  {consents.pregnancy_summary ? 'Visible to clinic' : 'Hidden from clinic'}
                </span>
              </div>

              <button
                type="button"
                disabled={togglingScope === 'pregnancy_summary'}
                onClick={() => handleToggleConsent('pregnancy_summary')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  consents.pregnancy_summary ? 'bg-enat-700' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    consents.pregnancy_summary ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Scope 2: Appointments */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 mb-2.5 flex items-start justify-between space-x-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-stone-600" />
                  <span className="text-xs font-bold text-stone-900">Appointments Coordination</span>
                </div>
                <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                  Allows clinic staff to view scheduled visits and add new antenatal checkups to your calendar.
                </p>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  {consents.appointments ? 'Visible to clinic' : 'Hidden from clinic'}
                </span>
              </div>

              <button
                type="button"
                disabled={togglingScope === 'appointments'}
                onClick={() => handleToggleConsent('appointments')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  consents.appointments ? 'bg-enat-700' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    consents.appointments ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Scope 3: Health Records */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-start justify-between space-x-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <Activity className="w-4 h-4 text-stone-600" />
                  <span className="text-xs font-bold text-stone-900">Health Records & Logs</span>
                </div>
                <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                  Allows clinic staff to view your logged blood pressure, weight checks, and personal symptom notes.
                </p>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  {consents.health_records ? 'Visible to clinic' : 'Hidden from clinic'}
                </span>
              </div>

              <button
                type="button"
                disabled={togglingScope === 'health_records'}
                onClick={() => handleToggleConsent('health_records')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  consents.health_records ? 'bg-enat-700' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    consents.health_records ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Not Enrolled: Independent Mode & Join Clinic Input */
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-stone-800">
              <ShieldCheck className="w-5 h-5 text-enat-700" />
              <h2 className="text-sm font-bold">Independent Mode Active</h2>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              You are currently using Enat Plus completely independently. All your dates, notes, and reminders stay 100% private on your device and are never visible to any clinic.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-enat-700" />
              Connect to Your Clinic
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              If your health centre or midwife gave you an invitation code or QR link, enter it below to link your account.
            </p>

            <form onSubmit={handleJoinViaCode} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Invitation Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ENAT-DEMO-2026"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm uppercase font-mono tracking-wider rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
                />
              </div>

              <button
                type="submit"
                disabled={connecting}
                className="w-full bg-enat-700 hover:bg-enat-800 text-white font-medium text-xs py-2.5 px-4 rounded-xl flex items-center justify-center transition disabled:opacity-50"
              >
                {connecting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  'Connect to Clinic'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Safety & Audit Explanation */}
      <div className="bg-stone-100 border border-stone-200 rounded-xl p-3.5 text-[11px] text-stone-600 space-y-1">
        <p className="font-semibold text-stone-800 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-stone-500" /> Tamper-Proof Audit Logging
        </p>
        <p className="leading-relaxed">
          Every time clinic staff look at your records, and whenever you grant or revoke access, an immutable entry is logged in the system.
        </p>
      </div>
    </div>
  );
}
