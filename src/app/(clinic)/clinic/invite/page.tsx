'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { logAuditEvent } from '@/lib/audit';
import { UserPlus, Copy, Check, QrCode, ArrowLeft, Loader2, AlertCircle, Share2 } from 'lucide-react';

export default function InvitePatientPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [creating, setCreating] = useState(false);
  const [invitationResult, setInvitationResult] = useState<{
    token: string;
    url: string;
    name: string;
    phone: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    if (!name || !phone) {
      setError('Please provide both the patient name and phone number.');
      setCreating(false);
      return;
    }

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
        throw new Error('You are not associated with any active clinic organization.');
      }

      // 2. Generate a clean, readable token (e.g. ENAT-XXXXXX)
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const token = `ENAT-${randomSuffix}`;

      // 3. Insert invitation into Supabase
      const { data: invite, error: inviteErr } = await supabase
        .from('invitations')
        .insert({
          organization_id: orgStaff.organization_id,
          token,
          invitee_name: name.trim(),
          invitee_phone: phone.trim(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
        })
        .select()
        .single();

      if (inviteErr) throw inviteErr;

      // Construct join URL
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const joinUrl = `${origin}/join/${token}`;

      await logAuditEvent({
        action: 'create_invitation',
        organizationId: orgStaff.organization_id,
        details: { token, invitee_name: name.trim(), invitee_phone: phone.trim() },
      });

      setInvitationResult({
        token,
        url: joinUrl,
        name: name.trim(),
        phone: phone.trim(),
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to generate invitation.');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = () => {
    if (!invitationResult) return;
    navigator.clipboard.writeText(invitationResult.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center space-x-2">
        <Link
          href="/clinic"
          className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-enat-700" />
            Invite & Enrol Patient
          </h1>
          <p className="text-xs text-stone-500">
            Generate an onboarding link or QR code for an expectant mother.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!invitationResult ? (
        <form onSubmit={handleGenerateInvitation} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Patient Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bethlehem Tadesse"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Patient Phone Number *
            </label>
            <input
              type="tel"
              required
              placeholder="+251 91 234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Will be matched when the patient accepts her digital invitation.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={creating}
              className="w-full bg-enat-700 hover:bg-enat-800 text-white font-medium text-xs py-3 px-4 rounded-xl flex items-center justify-center transition disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                'Generate Invitation & QR Code'
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Invitation Result with Copyable Link & QR Display */
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5 shadow-xs text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <Share2 className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-base font-bold text-stone-900">
              Invitation Ready for {invitationResult.name}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Phone: {invitationResult.phone} • Valid for 7 days
            </p>
          </div>

          {/* QR Code Presentation */}
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 inline-block shadow-inner mx-auto">
            <div className="w-48 h-48 bg-white border-2 border-stone-800 p-3 flex flex-col items-center justify-center rounded-xl shadow-xs mx-auto">
              <QrCode className="w-32 h-32 text-stone-900" />
              <span className="font-mono text-xs font-bold text-stone-800 mt-1">
                {invitationResult.token}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-3">
              Mother can scan this QR code or visit the link below.
            </p>
          </div>

          {/* Invitation Code & URL Box */}
          <div className="space-y-2 text-left">
            <label className="block text-xs font-semibold text-stone-700">
              Sharable Link & Invitation Code
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={invitationResult.url}
                className="w-full bg-stone-50 px-3 py-2 text-xs font-mono rounded-xl border border-stone-300 text-stone-700"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center border-t border-stone-100">
            <button
              onClick={() => {
                setInvitationResult(null);
                setName('');
                setPhone('');
              }}
              className="text-xs text-stone-500 hover:text-stone-800 font-medium"
            >
              ← Invite Another Patient
            </button>

            <Link
              href="/clinic"
              className="text-xs font-bold text-enat-700 hover:underline"
            >
              Return to Patients List
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
