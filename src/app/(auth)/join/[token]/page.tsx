'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { logAuditEvent } from '@/lib/audit';
import { Building2, Heart, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { SAFETY_DISCLAIMER } from '@/lib/pregnancy';

export default function JoinClinicInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === 'string' ? params.token : '';

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function checkTokenAndUser() {
      try {
        const supabase = createClient();
        
        // 1. Check logged in user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // 2. Fetch invitation by token
        const { data: invite, error: inviteErr } = await supabase
          .from('invitations')
          .select('*, organizations(id, name, city, phone)')
          .eq('token', token)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (inviteErr || !invite) {
          setError('This invitation link is invalid, expired, or has already been used.');
        } else {
          setInvitation(invite);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to verify invitation.');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      checkTokenAndUser();
    }
  }, [token]);

  const handleAcceptForLoggedInUser = async () => {
    if (!currentUser || !invitation) return;
    setAccepting(true);
    setError(null);

    try {
      const supabase = createClient();

      // Create or update enrollment
      const { error: enrollErr } = await supabase
        .from('patient_enrollments')
        .upsert(
          {
            mother_id: currentUser.id,
            organization_id: invitation.organization_id,
            status: 'active',
            invited_at: invitation.created_at,
            joined_at: new Date().toISOString(),
          },
          { onConflict: 'mother_id,organization_id' }
        );

      if (enrollErr) throw enrollErr;

      // Mark invitation used
      await supabase
        .from('invitations')
        .update({ status: 'accepted', used_by: currentUser.id })
        .eq('id', invitation.id);

      await logAuditEvent({
        action: 'accept_invitation',
        organizationId: invitation.organization_id,
        details: { token },
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/app/clinic');
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to accept invitation.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-enat-700 mb-2" />
        <p className="text-xs">Verifying clinic invitation...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-8 max-w-md mx-auto w-full">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-enat-100 text-enat-700 mb-2">
          <Heart className="w-6 h-6 fill-enat-600 text-enat-700" />
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">Clinic Care Invitation</h1>
        <p className="text-xs text-stone-500 mt-0.5">Enat Plus • Ethiopia</p>
      </div>

      {error ? (
        <div className="w-full bg-white rounded-2xl border border-stone-200 p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-stone-800">Invitation Expired or Invalid</h2>
          <p className="text-xs text-stone-500 leading-relaxed">{error}</p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition"
            >
              Return Home
            </Link>
          </div>
        </div>
      ) : (
        <div className="w-full bg-white rounded-2xl border border-stone-200 p-6 space-y-5 shadow-sm">
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Invitation accepted! Redirecting to your privacy settings...</span>
            </div>
          )}

          {/* Invitation Details Card */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-enat-100 text-enat-800 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-enat-700">Invited by</p>
                <h3 className="text-sm font-bold text-stone-900">
                  {invitation?.organizations?.name}
                </h3>
                <p className="text-xs text-stone-500">
                  {invitation?.organizations?.city}
                </p>
              </div>
            </div>

            <div className="border-t border-stone-200/60 pt-2 text-xs text-stone-600">
              <p>
                Patient Name: <span className="font-semibold text-stone-800">{invitation?.invitee_name}</span>
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Invitation Code: <span className="font-mono text-stone-600 font-semibold">{invitation?.token}</span>
              </p>
            </div>
          </div>

          {/* Safety & Consent Guarantee */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Accepting this invitation does <span className="font-bold">not</span> automatically share your personal health logs. You will be able to review and enable each sharing permission individually.
            </p>
          </div>

          {/* Action based on authentication state */}
          {currentUser ? (
            <button
              onClick={handleAcceptForLoggedInUser}
              disabled={accepting || success}
              className="w-full bg-enat-700 hover:bg-enat-800 text-white text-xs font-semibold py-3 px-4 rounded-xl flex items-center justify-center shadow-sm transition disabled:opacity-50"
            >
              {accepting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <>Accept & Connect to Clinic <ArrowRight className="w-4 h-4 ml-1.5" /></>
              )}
            </button>
          ) : (
            <div className="space-y-2.5">
              <Link
                href={`/register?invite=${token}`}
                className="w-full bg-enat-700 hover:bg-enat-800 text-white text-xs font-semibold py-3 px-4 rounded-xl flex items-center justify-center shadow-sm transition text-center"
              >
                Create Account & Join
              </Link>
              <Link
                href={`/login?next=/join/${token}`}
                className="w-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center transition text-center"
              >
                I Already Have An Account
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
