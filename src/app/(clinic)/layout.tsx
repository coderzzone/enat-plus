'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Building2, 
  Users, 
  UserPlus, 
  Calendar, 
  AlertTriangle, 
  BarChart3, 
  LogOut, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SAFETY_DISCLAIMER } from '@/lib/pregnancy';

export default function ClinicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [staffInfo, setStaffInfo] = useState<{
    name: string;
    role: string;
    orgName: string;
    city: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStaffProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch staff profile and org info
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();

        const { data: orgStaff } = await supabase
          .from('organization_staff')
          .select('staff_role, organizations(name, city)')
          .eq('user_id', user.id)
          .maybeSingle();

        const orgData = (orgStaff?.organizations as any) || {};

        setStaffInfo({
          name: profile?.full_name || 'Clinic Staff',
          role: orgStaff?.staff_role === 'clinic_admin' ? 'Clinic Admin' : 'Clinic Staff',
          orgName: orgData.name || 'Maternal Health Clinic',
          city: orgData.city || 'Addis Ababa',
        });
      } catch (err) {
        console.error('Failed to load clinic staff profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStaffProfile();
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navLinks = [
    { href: '/clinic', label: 'Enrolled Patients', icon: Users },
    { href: '/clinic/invite', label: 'Invite Patient', icon: UserPlus },
    { href: '/clinic/appointments', label: 'Appointments', icon: Calendar },
    { href: '/clinic/follow-up', label: 'Follow-Up Needed', icon: AlertTriangle },
    { href: '/clinic/reports', label: 'Reports & Export', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand & Clinic Org */}
            <div className="flex items-center space-x-4">
              <Link href="/clinic" className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-enat-700 flex items-center justify-center text-white shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-stone-900 text-sm tracking-tight">
                      Enat Plus Clinic
                    </span>
                    <span className="text-[10px] bg-enat-100 text-enat-800 font-semibold px-2 py-0.5 rounded-full">
                      {staffInfo?.role || 'Staff Portal'}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 font-medium truncate max-w-[220px]">
                    {staffInfo?.orgName} ({staffInfo?.city})
                  </div>
                </div>
              </Link>
            </div>

            {/* Right: Staff profile & Logout */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-stone-800">{staffInfo?.name}</div>
                <div className="text-[10px] text-stone-400">Authorized Care Provider</div>
              </div>

              <button
                onClick={handleSignOut}
                className="inline-flex items-center space-x-1 text-xs text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-200 px-3 py-1.5 rounded-xl border border-stone-200 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-header navigation tabs */}
        <div className="bg-stone-50 border-t border-stone-200 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-6 overflow-x-auto py-2">
            {navLinks.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-enat-700 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Clinic Portal Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
