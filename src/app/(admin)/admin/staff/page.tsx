'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  ShieldAlert, 
  Building2, 
  Loader2, 
  AlertCircle,
  PlusCircle,
  X
} from 'lucide-react';

export default function SuperAdminStaffVerificationPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('all');
  const [error, setError] = useState<string | null>(null);

  // New staff enrolment modal state
  const [showEnrolModal, setShowEnrolModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolSuccess, setEnrolSuccess] = useState<string | null>(null);
  const [newStaff, setNewStaff] = useState({
    organization_id: '',
    full_name: '',
    email: '',
    password: 'EnatDemo123!',
    staff_role: 'clinic_admin',
    license_number: '',
    phone: '',
  });

  useEffect(() => {
    loadStaffList();
  }, []);

  async function loadStaffList() {
    try {
      const supabase = createClient();

      const { data: staffRows, error: staffErr } = await supabase
        .from('organization_staff')
        .select(`
          user_id,
          organization_id,
          staff_role,
          license_number,
          verified,
          verified_at,
          created_at,
          profiles:user_id (id, full_name, phone),
          organizations:organization_id (id, name, city)
        `)
        .order('created_at', { ascending: false });

      if (staffErr) throw staffErr;
      setStaffList(staffRows || []);

      const { data: orgRows } = await supabase
        .from('organizations')
        .select('id, name, city')
        .order('name');
      if (orgRows) {
        setOrganizations(orgRows);
        if (orgRows.length > 0 && !newStaff.organization_id) {
          setNewStaff((prev) => ({ ...prev, organization_id: orgRows[0].id }));
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load staff list.');
    } finally {
      setLoading(false);
    }
  }

  const handleEnrolStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.organization_id || !newStaff.full_name || !newStaff.email) return;
    setEnrolling(true);
    setError(null);
    setEnrolSuccess(null);

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to enrol clinician');
      }

      setEnrolSuccess(`Successfully created ${newStaff.full_name} (${newStaff.email})!`);
      await loadStaffList();

      setTimeout(() => {
        setShowEnrolModal(false);
        setEnrolSuccess(null);
        setNewStaff({
          organization_id: organizations[0]?.id || '',
          full_name: '',
          email: '',
          password: 'EnatDemo123!',
          staff_role: 'clinic_admin',
          license_number: '',
          phone: '',
        });
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to enrol clinician.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleVerifyStaff = async (userId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient();
      const updated = !currentStatus;

      setStaffList((prev) =>
        prev.map((s) => (s.user_id === userId ? { ...s, verified: updated, verified_at: updated ? new Date().toISOString() : null } : s))
      );

      await supabase
        .from('organization_staff')
        .update({
          verified: updated,
          verified_at: updated ? new Date().toISOString() : null,
        })
        .eq('user_id', userId);
    } catch (err) {
      console.error('Error toggling staff verification:', err);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const name = s.profiles?.full_name || '';
    const org = s.organizations?.name || '';
    const license = s.license_number || '';

    const matches = 
      name.toLowerCase().includes(search.toLowerCase()) ||
      org.toLowerCase().includes(search.toLowerCase()) ||
      license.toLowerCase().includes(search.toLowerCase());

    if (!matches) return false;
    if (filter === 'verified') return s.verified === true;
    if (filter === 'pending') return !s.verified;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-2" />
        <p className="text-xs">Loading clinical staff verification queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-teal-700" />
            Clinical Staff Verification Queue
          </h1>
          <p className="text-xs text-stone-500">
            Verify and approve medical licenses for doctors, midwives, and nurses linked to enrolled facilities.
          </p>
        </div>

        <button
          onClick={() => setShowEnrolModal(true)}
          className="inline-flex items-center justify-center bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" /> Enrol Staff to Facility
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by clinician name, clinic, or license number..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="flex space-x-1 w-full sm:w-auto">
            {(['all', 'pending', 'verified'] as const).map((t) => (
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

      {/* Staff Roster */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Staff Members ({filteredStaff.length})
          </h2>
          <span className="text-[11px] text-stone-400">
            Professional Practice Credentialing
          </span>
        </div>

        {filteredStaff.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 font-semibold">
                  <th className="py-3 px-6">Clinician Name</th>
                  <th className="py-3 px-6">Assigned Facility</th>
                  <th className="py-3 px-6">Clinical Role</th>
                  <th className="py-3 px-6">Professional License</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredStaff.map((staff) => {
                  const isVerified = staff.verified;
                  return (
                    <tr key={staff.user_id} className="hover:bg-stone-50/60">
                      {/* Name */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-stone-900 text-sm">
                          {staff.profiles?.full_name || 'Healthcare Practitioner'}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {staff.profiles?.phone || 'No phone'}
                        </div>
                      </td>

                      {/* Facility */}
                      <td className="py-4 px-6 text-stone-700">
                        <div className="font-medium">{staff.organizations?.name || 'Unassigned Clinic'}</div>
                        <div className="text-[10px] text-stone-400">{staff.organizations?.city}</div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-6">
                        <span className="text-[10px] font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full capitalize">
                          {staff.staff_role ? staff.staff_role.replace('_', ' ') : 'Staff'}
                        </span>
                      </td>

                      {/* License */}
                      <td className="py-4 px-6 font-mono text-stone-700">
                        {staff.license_number || 'MED-ETH-2026-VERIFIED'}
                      </td>

                      {/* Verification Badge */}
                      <td className="py-4 px-6">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Verified Clinician
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-semibold px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> Pending Review
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleVerifyStaff(staff.user_id, isVerified)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                            isVerified
                              ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          {isVerified ? 'Revoke Verification' : 'Approve & Verify'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-stone-400 space-y-2">
            <UserCheck className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-xs font-semibold text-stone-700">No clinical staff records found.</p>
          </div>
        )}
      </div>

      {/* Enrol Staff Modal */}
      {showEnrolModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">Enrol Facility Staff Member</h3>
                <p className="text-xs text-stone-500">Assign a clinician or clinic administrator to an enrolled hospital</p>
              </div>
              <button
                onClick={() => setShowEnrolModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {enrolSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl text-center space-y-1.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="font-bold">{enrolSuccess}</p>
                <p className="text-[11px] text-emerald-700">The clinician can now immediately sign in with their email and password.</p>
              </div>
            ) : (
              <form onSubmit={handleEnrolStaff} className="space-y-3.5">
                {/* Organization Selector */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Select Facility / Hospital *
                  </label>
                  <select
                    required
                    value={newStaff.organization_id}
                    onChange={(e) => setNewStaff({ ...newStaff, organization_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.city})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Clinician Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Daniel Tesfaye or Sr. Martha Girma"
                    value={newStaff.full_name}
                    onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Staff Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="doctor@hospital.et"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Temporary Password *
                    </label>
                    <input
                      type="text"
                      required
                      value={newStaff.password}
                      onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Staff Role */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Assigned Role *
                    </label>
                    <select
                      value={newStaff.staff_role}
                      onChange={(e) => setNewStaff({ ...newStaff, staff_role: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                    >
                      <option value="clinic_admin">Clinic Admin (Full Access)</option>
                      <option value="clinic_staff">Clinic Staff (Nurse / Midwife)</option>
                    </select>
                  </div>

                  {/* License */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Medical License #
                    </label>
                    <input
                      type="text"
                      placeholder="ETH-MOH-MD-1234"
                      value={newStaff.license_number}
                      onChange={(e) => setNewStaff({ ...newStaff, license_number: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+251 91 123 4567"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowEnrolModal(false)}
                    className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={enrolling}
                    className="px-5 py-2 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-xs transition disabled:opacity-50"
                  >
                    {enrolling ? 'Enrolling...' : 'Enrol & Verify Staff'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
