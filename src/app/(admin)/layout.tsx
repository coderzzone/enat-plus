'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  Building2, 
  UserCheck, 
  PlusCircle, 
  LogOut, 
  CheckCircle2, 
  ShieldCheck, 
  BarChart3,
  Loader2,
  ShoppingBag
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState<string>('Super Admin');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSuperAdmin() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();

        if (profile?.role !== 'super_admin') {
          router.push('/app');
          return;
        }

        if (profile?.full_name) {
          setAdminName(profile.full_name);
        }
      } catch (err) {
        console.error('Error loading super admin:', err);
      } finally {
        setLoading(false);
      }
    }

    checkSuperAdmin();
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navTabs = [
    { href: '/admin', label: 'Facilities Directory', icon: Building2 },
    { href: '/admin/clinics/new', label: 'Enrol Facility', icon: PlusCircle },
    { href: '/admin/staff', label: 'Staff Verification Queue', icon: UserCheck },
    { href: '/admin/marketplace', label: 'Marketplace & Commissions', icon: ShoppingBag },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-900 text-stone-400">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
        <p className="text-xs">Authenticating Super Admin session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-stone-900 text-white border-b border-stone-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand & Admin Badge */}
            <div className="flex items-center space-x-3">
              <Link href="/admin" className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-white text-sm tracking-tight">
                      Enat Plus Governance
                    </span>
                    <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Super Admin
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-400">
                    National Health Facility & Clinician Registry
                  </div>
                </div>
              </Link>
            </div>

            {/* Right: Admin profile & Logout */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-white">{adminName}</div>
                <div className="text-[10px] text-teal-400">System Administrator</div>
              </div>

              <button
                onClick={handleSignOut}
                className="inline-flex items-center space-x-1.5 text-xs text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded-xl border border-stone-700 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-header Navigation Tabs */}
        <div className="bg-stone-950/80 border-t border-stone-800/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex space-x-2 sm:space-x-6 overflow-x-auto py-2">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800'
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

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
