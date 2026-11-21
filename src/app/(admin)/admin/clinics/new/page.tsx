'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Building2, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function NewFacilityEnrollmentPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [facilityType, setFacilityType] = useState('primary_hospital');
  const [city, setCity] = useState('Addis Ababa');
  const [region, setRegion] = useState('Addis Ababa');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [autoVerify, setAutoVerify] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!name.trim() || !licenseNumber.trim()) {
      setError('Please provide facility name and health license number.');
      setSaving(false);
      return;
    }

    try {
      const supabase = createClient();
      
      const { data, error: insertErr } = await supabase
        .from('organizations')
        .insert({
          name: name.trim(),
          facility_type: facilityType,
          city: city.trim(),
          region: region.trim(),
          phone: phone.trim() || null,
          license_number: licenseNumber.trim().toUpperCase(),
          verified: autoVerify,
          verified_at: autoVerify ? new Date().toISOString() : null,
          status: 'active',
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Failed to enrol health facility.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center space-x-3">
        <Link
          href="/admin"
          className="p-2 rounded-xl hover:bg-stone-200 text-stone-600 transition bg-white border border-stone-200"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-700" />
            Enrol Clinic or Hospital
          </h1>
          <p className="text-xs text-stone-500">
            Register a healthcare provider facility to participate in Enat Plus maternal care.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Facility successfully enrolled! Redirecting to registry...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-xs">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Facility Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Tikur Anbessa Specialized Hospital"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Facility Classification *
            </label>
            <select
              value={facilityType}
              onChange={(e) => setFacilityType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            >
              <option value="referral_hospital">Referral Hospital</option>
              <option value="primary_hospital">Primary Hospital</option>
              <option value="health_center">Maternal Health Centre</option>
              <option value="private_clinic">Private MCH Clinic</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              MOH / Regulatory License Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ETH-MOH-HOSP-2026-081"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              City / Sub-City
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Addis Ababa"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Region
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Addis Ababa / Oromia"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Official Phone Number
            </label>
            <input
              type="tel"
              placeholder="+251-11-551-1211"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
        </div>

        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
          <label className="flex items-center space-x-2 text-xs text-stone-800 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={autoVerify}
              onChange={(e) => setAutoVerify(e.target.checked)}
              className="rounded text-teal-700 focus:ring-teal-600 w-4 h-4"
            />
            <span>Mark facility as Verified immediately (License verified by Ministry)</span>
          </label>
        </div>

        <div className="pt-2 flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-xs transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5 inline" /> : 'Enrol Facility'}
          </button>
        </div>
      </form>
    </div>
  );
}
