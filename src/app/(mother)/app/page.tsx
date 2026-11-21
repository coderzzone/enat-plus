'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { calculatePregnancy, PregnancyCalculation, CLINICAL_ESTIMATE_NOTE } from '@/lib/pregnancy';
import { 
  Heart, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  PlusCircle, 
  AlertCircle,
  Building,
  Loader2,
  FileText
} from 'lucide-react';

export default function MotherDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pregnancyCalc, setPregnancyCalc] = useState<PregnancyCalculation | null>(null);
  const [weekContent, setWeekContent] = useState<any | null>(null);
  const [nextAppointment, setNextAppointment] = useState<any | null>(null);
  const [todayReminders, setTodayReminders] = useState<any[]>([]);
  const [enrolledClinic, setEnrolledClinic] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // 1. Fetch active pregnancy
        const { data: pregData, error: pregErr } = await supabase
          .from('pregnancies')
          .select('*')
          .eq('mother_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pregErr) {
          console.error('Error fetching pregnancy:', pregErr);
        }

        if (pregData && pregData.lmp_date) {
          const calc = calculatePregnancy(
            pregData.lmp_date,
            pregData.cycle_length || 28,
            pregData.clinician_confirmed_edd
          );
          setPregnancyCalc(calc);

          // 2. Fetch educational content for this week
          const currentWeekNum = Math.min(40, Math.max(1, calc.weeks || 1));
          const { data: contentData } = await supabase
            .from('pregnancy_content')
            .select('*')
            .eq('week', currentWeekNum)
            .maybeSingle();

          setWeekContent(contentData);
        }

        // 3. Fetch next scheduled appointment
        const nowIso = new Date().toISOString();
        const { data: apptData } = await supabase
          .from('appointments')
          .select('*, organizations(name)')
          .eq('mother_id', user.id)
          .gte('scheduled_at', nowIso)
          .eq('status', 'scheduled')
          .order('scheduled_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        setNextAppointment(apptData);

        // 4. Fetch reminders due today / upcoming
        const { data: remData } = await supabase
          .from('reminders')
          .select('*')
          .eq('mother_id', user.id)
          .order('remind_at', { ascending: true })
          .limit(5);

        setTodayReminders(remData || []);

        // 5. Fetch connected clinic (if enrolled)
        const { data: enrollData } = await supabase
          .from('patient_enrollments')
          .select('*, organizations(name, city, phone)')
          .eq('mother_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (enrollData?.organizations) {
          setEnrolledClinic(enrollData.organizations);
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [router]);

  const toggleReminderDone = async (reminderId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient();
      const updatedStatus = !currentStatus;
      
      setTodayReminders((prev) =>
        prev.map((r) => (r.id === reminderId ? { ...r, done: updatedStatus } : r))
      );

      await supabase
        .from('reminders')
        .update({ done: updatedStatus })
        .eq('id', reminderId);
    } catch (err) {
      console.error('Failed to update reminder:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-enat-700 mb-2" />
        <p className="text-xs">Loading your maternal companion...</p>
      </div>
    );
  }

  // If no pregnancy record found, display onboarding card
  if (!pregnancyCalc) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-stone-200 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-enat-100 text-enat-700 flex items-center justify-center mx-auto">
          <Calendar className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-stone-800">Set Up Your Pregnancy Details</h2>
        <p className="text-xs text-stone-600 max-w-sm mx-auto">
          Please provide the first day of your Last Menstrual Period (LMP) to unlock your weekly baby updates, due date, and personalized reminders.
        </p>
        <Link
          href="/app/onboarding"
          className="inline-flex items-center justify-center bg-enat-700 hover:bg-enat-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow transition"
        >
          Add Pregnancy Details <ArrowRight className="w-4 h-4 ml-1.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Pregnancy Hero Card */}
      <div className="bg-gradient-to-br from-enat-700 to-enat-900 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        {/* Subtle decorative background circle */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />

        <div className="flex items-start justify-between">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white uppercase tracking-wider mb-2">
              Trimester {pregnancyCalc.trimester}
            </span>
            <div className="text-3xl font-extrabold tracking-tight">
              Week {pregnancyCalc.weeks}{' '}
              <span className="text-lg font-normal text-enat-200">
                + {pregnancyCalc.days} {pregnancyCalc.days === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-enat-200 block">Estimated Due Date</span>
            <span className="text-sm font-bold text-white block">
              {pregnancyCalc.formattedEdd}
            </span>
            {pregnancyCalc.isClinicianConfirmed && (
              <span className="text-[10px] font-medium text-emerald-200 block">
                Clinician Confirmed
              </span>
            )}
          </div>
        </div>

        {/* 40-Week Progress Bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-[11px] text-enat-200">
            <span>Progress through 40 Weeks</span>
            <span className="font-semibold text-white">{pregnancyCalc.progressPercent}%</span>
          </div>
          <div className="w-full bg-black/25 rounded-full h-2.5 overflow-hidden p-0.5">
            <div
              className="bg-emerald-300 h-full rounded-full transition-all duration-700 shadow"
              style={{ width: `${Math.max(4, pregnancyCalc.progressPercent)}%` }}
            />
          </div>
          <p className="text-[10px] text-enat-200/90 italic pt-1">
            {CLINICAL_ESTIMATE_NOTE}
          </p>
        </div>
      </div>

      {/* 2. "This Week" Baby Development Card */}
      {weekContent && (
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-enat-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                This Week in Development
              </h3>
            </div>
            
            {!weekContent.reviewed && (
              <span className="text-[10px] bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded-full">
                Draft - pending clinical review
              </span>
            )}
          </div>

          <h4 className="text-sm font-bold text-stone-900">{weekContent.title}</h4>
          <p className="text-xs text-stone-600 leading-relaxed">{weekContent.body}</p>

          <div className="pt-2 flex justify-end">
            <Link
              href="/app/weekly"
              className="text-xs font-semibold text-enat-700 hover:text-enat-800 inline-flex items-center gap-1"
            >
              Browse all 40 weeks <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 3. Next Appointment Card */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-stone-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Next Appointment
            </h3>
          </div>
          <Link
            href="/app/records"
            className="text-xs text-enat-700 font-semibold hover:underline"
          >
            All records
          </Link>
        </div>

        {nextAppointment ? (
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-stone-900">{nextAppointment.title}</p>
              <p className="text-[11px] text-stone-600 mt-0.5">
                {new Date(nextAppointment.scheduled_at).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {nextAppointment.organizations?.name && (
                <p className="text-[10px] text-enat-700 font-medium mt-0.5 flex items-center gap-1">
                  <Building className="w-3 h-3" /> {nextAppointment.organizations.name}
                </p>
              )}
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full">
              Scheduled
            </span>
          </div>
        ) : (
          <div className="text-center py-4 bg-stone-50/50 rounded-xl border border-dashed border-stone-200 text-stone-500">
            <p className="text-xs">No upcoming appointment scheduled.</p>
            <p className="text-[10px] text-stone-400 mt-0.5">
              Add your clinical checkups to stay prepared.
            </p>
          </div>
        )}
      </div>

      {/* 4. Today's Reminders Card */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-stone-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Today's Reminders
            </h3>
          </div>
          <Link
            href="/app/reminders"
            className="text-xs text-enat-700 font-semibold hover:underline flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Add
          </Link>
        </div>

        <p className="text-[10px] text-stone-400 italic">
          Reminder: Only take medicines already prescribed by your healthcare professional.
        </p>

        {todayReminders.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {todayReminders.map((rem) => (
              <div
                key={rem.id}
                className="py-2.5 flex items-start space-x-3 group cursor-pointer"
                onClick={() => toggleReminderDone(rem.id, rem.done)}
              >
                <button
                  type="button"
                  className="mt-0.5 text-stone-400 group-hover:text-enat-600 transition-colors"
                >
                  {rem.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-medium leading-tight ${
                      rem.done ? 'line-through text-stone-400' : 'text-stone-800'
                    }`}
                  >
                    {rem.title}
                  </p>
                  {rem.notes && (
                    <p className="text-[11px] text-stone-500 mt-0.5 truncate">{rem.notes}</p>
                  )}
                </div>
                <span className="text-[10px] text-stone-400 flex-shrink-0">
                  {new Date(rem.remind_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 bg-stone-50/50 rounded-xl border border-dashed border-stone-200 text-stone-500">
            <p className="text-xs">No reminders for today.</p>
            <Link
              href="/app/reminders"
              className="text-[11px] text-enat-700 font-medium underline mt-1 inline-block"
            >
              Set medication or appointment reminder
            </Link>
          </div>
        )}
      </div>

      {/* 5. Clinic Connection Status Bar */}
      <div className="bg-enat-50/70 border border-enat-100 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-enat-100 text-enat-700 flex items-center justify-center flex-shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-900">
              {enrolledClinic ? enrolledClinic.name : 'Independent Pregnancy Tracking'}
            </p>
            <p className="text-[11px] text-stone-600">
              {enrolledClinic
                ? 'Care coordination active • You control what is shared'
                : 'No clinic connected • You can use Enat Plus completely independently'}
            </p>
          </div>
        </div>
        <Link
          href="/app/clinic"
          className="text-xs font-semibold text-enat-700 hover:text-enat-800 whitespace-nowrap pl-2"
        >
          {enrolledClinic ? 'Manage Privacy' : 'Connect Clinic'}
        </Link>
      </div>
    </div>
  );
}
