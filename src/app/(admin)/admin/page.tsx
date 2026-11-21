'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  PlusCircle, 
  Search, 
  Users, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  ExternalLink 
} from 'lucide-react';

export default function SuperAdminFacilitiesPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending' | 'suspended'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrganizations();
  }, []);

  async function loadOrganizations() {
    try {
      const supabase = createClient();
      
      const { data: orgs, error: orgErr } = await supabase
        .from('organizations')
        .select(`
          *,
          staff:organization_staff(count),
          enrollments:patient_enrollments(count)
        `)
        .order('created_at', { ascending: false });

      if (orgErr) throw orgErr;
      setOrganizations(orgs || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load health facilities.');
    } finally {
      setLoading(false);
    }
  }

  const handleToggleVerification = async (orgId: string, currentVerified: boolean) => {
    try {
      const supabase = createClient();
      const updated = !currentVerified;

      setOrganizations((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, verified: updated, status: updated ? 'active' : 'pending' } : o))
      );

      await supabase
        .from('organizations')
        .update({ 
          verified: updated,
          verified_at: updated ? new Date().toISOString() : null,
          status: updated ? 'active' : 'pending',
        })
        .eq('id', orgId);
    } catch (err) {
      console.error('Error toggling clinic verification:', err);
    }
  };

  const handleToggleStatus = async (orgId: string, newStatus: string) => {
    try {
      const supabase = createClient();
      setOrganizations((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, status: newStatus } : o))
      );

      await supabase
        .from('organizations')
        .update({ status: newStatus })
        .eq('id', orgId);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const filteredOrgs = organizations.filter((o) => {
    const matchesSearch = 
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.city && o.city.toLowerCase().includes(search.toLowerCase())) ||
      (o.license_number && o.license_number.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filter === 'verified') return o.verified === true;
    if (filter === 'pending') return !o.verified || o.status === 'pending';
    if (filter === 'suspended') return o.status === 'suspended';
    return true;
  });

  const totalFacilities = organizations.length;
  const verifiedCount = organizations.filter((o) => o.verified).length;
  const pendingCount = organizations.filter((o) => !o.verified).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-2" />
        <p className="text-xs">Loading health facilities registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-700" />
            National Health Facilities Registry
          </h1>
          <p className="text-xs text-stone-500">
            Enrol, credential, and monitor maternal health clinics and hospitals across Ethiopia.
          </p>
        </div>

        <Link
          href="/admin/clinics/new"
          className="inline-flex items-center justify-center bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" /> Enrol New Facility
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase">Total Facilities</span>
            <Building2 className="w-4 h-4 text-stone-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">{totalFacilities}</div>
          <p className="text-[11px] text-stone-400 mt-0.5">Hospitals & MCH clinics</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase">Verified & Active</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{verifiedCount}</div>
          <p className="text-[11px] text-stone-400 mt-0.5">Ministry credentials validated</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase">Pending Verification</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{pendingCount}</div>
          <p className="text-[11px] text-stone-400 mt-0.5">Awaiting documentation review</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by hospital name, city, or license number..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="flex space-x-1 w-full sm:w-auto">
            {(['all', 'verified', 'pending', 'suspended'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                  filter === t
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Facilities Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Registered Facilities ({filteredOrgs.length})
          </h2>
          <span className="text-[11px] text-stone-400">
            Ministry of Health Ethiopia Alignment
          </span>
        </div>

        {filteredOrgs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 font-semibold">
                  <th className="py-3 px-6">Facility Name</th>
                  <th className="py-3 px-6">Location</th>
                  <th className="py-3 px-6">License Number</th>
                  <th className="py-3 px-6">Verification</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrgs.map((org) => {
                  const isVerified = org.verified;
                  return (
                    <tr key={org.id} className="hover:bg-stone-50/60">
                      {/* Name & Type */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-stone-900 text-sm">{org.name}</div>
                        <div className="text-[10px] text-teal-700 font-medium capitalize">
                          {org.facility_type ? org.facility_type.replace('_', ' ') : 'Primary Hospital'}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-6 text-stone-600">
                        <div>{org.city || 'Addis Ababa'}</div>
                        <div className="text-[10px] text-stone-400">{org.phone || 'No phone'}</div>
                      </td>

                      {/* License */}
                      <td className="py-4 px-6 font-mono text-stone-700 font-medium">
                        {org.license_number || 'ETH-MOH-PENDING'}
                      </td>

                      {/* Verification Status */}
                      <td className="py-4 px-6">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-semibold px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> Unverified
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          org.status === 'active'
                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                            : org.status === 'suspended'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {org.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleToggleVerification(org.id, isVerified)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${
                            isVerified
                              ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {isVerified ? 'Revoke Verification' : 'Verify Facility'}
                        </button>

                        {org.status !== 'suspended' ? (
                          <button
                            onClick={() => handleToggleStatus(org.id, 'suspended')}
                            className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-semibold"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(org.id, 'active')}
                            className="px-2 py-1 bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-[10px] font-semibold"
                          >
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-stone-400 space-y-2">
            <Building2 className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-xs font-semibold text-stone-700">No health facilities found matching criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
