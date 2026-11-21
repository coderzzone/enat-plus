'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Store, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function NewShopEnrollmentPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Addis Ababa');
  const [category, setCategory] = useState('pharmacy_cosmetics');
  const [commissionPercent, setCommissionPercent] = useState<number>(10.0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!name.trim() || !ownerName.trim() || !phone.trim()) {
      setError('Please provide shop name, owner name, and contact phone.');
      setSaving(false);
      return;
    }

    try {
      const supabase = createClient();
      
      const { error: insertErr } = await supabase
        .from('marketplace_shops')
        .insert({
          name: name.trim(),
          owner_name: ownerName.trim(),
          phone: phone.trim(),
          city: city.trim(),
          category,
          commission_percent: Number(commissionPercent) || 10.0,
          verified: true,
          status: 'active',
        });

      if (insertErr) throw insertErr;

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/marketplace');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Failed to enrol vendor shop.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <Link
          href="/admin/marketplace"
          className="p-2 rounded-xl hover:bg-stone-200 text-stone-600 transition bg-white border border-stone-200"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-teal-700" />
            Enrol Partner Vendor / Pharmacy
          </h1>
          <p className="text-xs text-stone-500">
            Add a licensed pharmacy, maternal cosmetics brand, or baby-care merchant.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Vendor shop successfully enrolled! Redirecting...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-2xs">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Shop or Pharmacy Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Addis Maternal Pharmacy & Care"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Owner / Lead Pharmacist Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sr. Hanna Worku"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Contact Phone Number *
            </label>
            <input
              type="tel"
              required
              placeholder="+251 91 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
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
              placeholder="e.g. Addis Ababa (Bole)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Primary Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            >
              <option value="pharmacy_cosmetics">Pharmacy & Care</option>
              <option value="baby_essentials">Baby Essentials</option>
              <option value="cosmetics_care">Maternal Cosmetics</option>
              <option value="maternity_wear">Maternity Apparel</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Platform Commission (%) *
            </label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="50"
              required
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
        </div>

        <p className="text-[11px] text-stone-500 bg-stone-50 p-3 rounded-xl border border-stone-200">
          The configured platform commission will automatically be calculated on every maternal order placed through this shop.
        </p>

        <div className="pt-2 flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => router.push('/admin/marketplace')}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-2xs transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5 inline" /> : 'Enrol Shop'}
          </button>
        </div>
      </form>
    </div>
  );
}
