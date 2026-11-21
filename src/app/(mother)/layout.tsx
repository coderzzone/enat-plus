'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Heart, Calendar, BookOpen, Bell, Activity, Shield, LogOut, Globe2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LanguageProvider, useLanguage } from '@/lib/LanguageContext';

function MotherShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, toggleLanguage, t } = useLanguage();
  const [motherName, setMotherName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (profile?.full_name) {
          setMotherName(profile.full_name);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { href: '/app', label: t('navToday'), icon: Heart },
    { href: '/app/weekly', label: t('navWeekly'), icon: BookOpen },
    { href: '/app/reminders', label: t('navReminders'), icon: Bell },
    { href: '/app/records', label: t('navHealth'), icon: Activity },
    { href: '/app/clinic', label: t('navClinic'), icon: Shield },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-warm-50 pb-20 md:pb-6">
      {/* Top Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 px-4 py-2.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/app" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-enat-100 flex items-center justify-center text-enat-700">
              <Heart className="w-4 h-4 fill-enat-600" />
            </div>
            <div>
              <span className="font-bold text-stone-900 text-sm tracking-tight">{t('brandName')}</span>
              <span className="text-[10px] text-enat-700 ml-1 font-medium hidden sm:inline">{t('brandSub')}</span>
            </div>
          </Link>

          <div className="flex items-center space-x-2 text-xs">
            {/* Language Switcher Toggle */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-300/80 text-[11px] font-bold text-stone-800 transition active:scale-95"
              title="ቋንቋ ቀይር / Switch Language"
            >
              <Globe2 className="w-3.5 h-3.5 text-teal-700" />
              <span>{language === 'am' ? 'አማርኛ' : 'English'}</span>
            </button>

            {motherName && (
              <span className="text-stone-600 font-medium hidden sm:inline truncate max-w-[100px]">
                {motherName}
              </span>
            )}

            <button
              onClick={handleSignOut}
              title={t('signOut')}
              className="text-stone-500 hover:text-stone-800 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Quick Navigation Strip for Community, Marketplace & Special Needs */}
      <div className="bg-white border-b border-stone-200 px-4 py-2">
        <div className="max-w-md mx-auto flex items-center justify-between text-xs font-semibold">
          <Link
            href="/app/marketplace"
            className={`px-2.5 py-1 rounded-lg transition ${
              pathname === '/app/marketplace' ? 'bg-teal-700 text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            🛍️ {t('navMarket')}
          </Link>
          <span className="text-stone-300">•</span>
          <Link
            href="/app/community"
            className={`px-2.5 py-1 rounded-lg transition ${
              pathname === '/app/community' ? 'bg-pink-700 text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            💬 {t('navCommunity')}
          </Link>
          <span className="text-stone-300">•</span>
          <Link
            href="/app/special-needs"
            className={`px-2.5 py-1 rounded-lg transition ${
              pathname === '/app/special-needs' ? 'bg-purple-700 text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            💜 {t('navSpecialNeeds')}
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-5">
        {children}
      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 py-1.5 px-2 z-40 md:relative md:max-w-md md:mx-auto md:border-none md:bg-transparent md:mt-4">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-enat-700 font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function MotherLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <MotherShell>{children}</MotherShell>
    </LanguageProvider>
  );
}
