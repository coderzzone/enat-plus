'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart3, Download, Users, Calendar, AlertTriangle, Activity, Loader2 } from 'lucide-react';

export default function ClinicReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    enrolledCount: 0,
    activeCount: 0,
    upcomingThisWeek: 0,
    missedCount: 0,
  });
  const [reportRows, setReportRows] = useState<any[]>([]);

  useEffect(() => {
    loadReportsData();
  }, []);

  async function loadReportsData() {
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

      // 1. Enrolled patients
      const { data: enrollments } = await supabase
        .from('patient_enrollments')
        .select(`
          id,
          mother_id,
          status,
          joined_at,
          profiles:mother_id (id, full_name, phone, created_at)
        `)
        .eq('organization_id', orgId)
        .eq('status', 'active');

      const enrolled = enrollments || [];

      // 2. Appointments
      const { data: appts } = await supabase
        .from('appointments')
        .select('*')
        .eq('organization_id', orgId);

      const allAppts = appts || [];

      // Date windows
      const now = new Date();
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const upcomingThisWeek = allAppts.filter((a) => {
        const d = new Date(a.scheduled_at);
        return a.status === 'scheduled' && d >= now && d <= sevenDaysFromNow;
      }).length;

      const missedCount = allAppts.filter((a) => a.status === 'missed').length;

      // Active count (e.g. joined or interacted within last 7 days)
      const activeCount = enrolled.filter((e) => {
        const joined = e.joined_at ? new Date(e.joined_at) : new Date();
        return joined >= sevenDaysAgo;
      }).length;

      setStats({
        enrolledCount: enrolled.length,
        activeCount: Math.max(activeCount, enrolled.length > 0 ? 1 : 0),
        upcomingThisWeek,
        missedCount,
      });

      // Prepare cohort rows for table & CSV
      const rows = enrolled.map((e: any) => {
        const motherProfile = e.profiles || {};
        const motherAppts = allAppts.filter((a) => a.mother_id === e.mother_id);
        const upcoming = motherAppts.find((a) => a.status === 'scheduled' && new Date(a.scheduled_at) >= now);
        const missed = motherAppts.filter((a) => a.status === 'missed').length;

        return {
          motherId: e.mother_id,
          fullName: motherProfile.full_name || 'Patient',
          phone: motherProfile.phone || 'N/A',
          enrolledDate: e.joined_at ? new Date(e.joined_at).toLocaleDateString() : 'Active',
          nextVisit: upcoming ? new Date(upcoming.scheduled_at).toLocaleDateString() : 'None',
          missedVisits: missed,
          status: 'Active',
        };
      });

      setReportRows(rows);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }

  const exportToCSV = () => {
    if (reportRows.length === 0) return;

    const headers = ['Patient Name', 'Phone', 'Enrollment Date', 'Next Appointment', 'Missed Visits', 'Status'];
    const csvContent = [
      headers.join(','),
      ...reportRows.map((r) =>
        [
          `"${r.fullName}"`,
          `"${r.phone}"`,
          `"${r.enrolledDate}"`,
          `"${r.nextVisit}"`,
          r.missedVisits,
          `"${r.status}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `enat_plus_clinic_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-enat-700 mb-2" />
        <p className="text-xs">Generating clinic care reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-enat-700" />
            Clinic Program Metrics & Export
          </h1>
          <p className="text-xs text-stone-500">
            Overview of enrolled mothers, active participation, and antenatal visit adherence.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="inline-flex items-center justify-center bg-stone-900 hover:bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          <Download className="w-4 h-4 mr-1.5" /> Export Report (CSV)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase">Total Enrolled</span>
            <Users className="w-4 h-4 text-enat-700" />
          </div>
          <div className="text-2xl font-black text-stone-900">{stats.enrolledCount}</div>
          <p className="text-[11px] text-stone-400 mt-0.5">Mothers linked to clinic</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase">Active (Last 7d)</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">{stats.activeCount}</div>
          <p className="text-[11px] text-stone-400 mt-0.5">Engaged recently</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase">Upcoming Visits</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">{stats.upcomingThisWeek}</div>
          <p className="text-[11px] text-stone-400 mt-0.5">Scheduled this week</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase">Missed Visits</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">{stats.missedCount}</div>
          <p className="text-[11px] text-stone-400 mt-0.5">Requiring outreach</p>
        </div>
      </div>

      {/* Cohort Report Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Enrolled Patient Cohort Summary
          </h2>
          <button
            onClick={exportToCSV}
            className="text-xs text-enat-700 font-semibold hover:underline"
          >
            Download CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 font-semibold">
                <th className="py-3 px-6">Patient Name</th>
                <th className="py-3 px-6">Phone Number</th>
                <th className="py-3 px-6">Enrolment Date</th>
                <th className="py-3 px-6">Next Appointment</th>
                <th className="py-3 px-6">Missed Visits</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {reportRows.map((r) => (
                <tr key={r.motherId} className="hover:bg-stone-50/60">
                  <td className="py-3.5 px-6 font-bold text-stone-900">{r.fullName}</td>
                  <td className="py-3.5 px-6 font-mono text-stone-600">{r.phone}</td>
                  <td className="py-3.5 px-6 text-stone-600">{r.enrolledDate}</td>
                  <td className="py-3.5 px-6 text-stone-700">{r.nextVisit}</td>
                  <td className="py-3.5 px-6">
                    {r.missedVisits > 0 ? (
                      <span className="text-rose-700 font-bold">{r.missedVisits} missed</span>
                    ) : (
                      <span className="text-stone-400">0</span>
                    )}
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
