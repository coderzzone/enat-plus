import Link from 'next/link';
import { Heart, Building2, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { SAFETY_DISCLAIMER } from '@/lib/pregnancy';

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-12 max-w-lg mx-auto text-center">
      {/* Safety Banner */}
      <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-8 text-left text-xs text-amber-900 flex items-start space-x-2.5 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed font-medium">
          {SAFETY_DISCLAIMER}
        </p>
      </div>

      {/* Brand Header */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-enat-100 text-enat-700 mb-4 shadow-inner">
        <Heart className="w-8 h-8 fill-enat-600 text-enat-700" />
      </div>
      
      <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight mb-2">
        Enat Plus <span className="text-enat-700 font-semibold text-lg block sm:inline">እናት ፕላስ</span>
      </h1>
      
      <p className="text-stone-600 font-medium text-base mb-2">
        Every Week Matters. Every Mother Matters.
      </p>
      
      <p className="text-xs text-stone-500 max-w-sm mb-8 leading-normal">
        A private, caring maternal health companion designed for Ethiopian mothers, with optional, consent-driven clinic care coordination.
      </p>

      {/* Primary Action Cards */}
      <div className="w-full space-y-4">
        {/* Mother App Option */}
        <Link
          href="/app"
          className="w-full bg-enat-700 hover:bg-enat-800 text-white rounded-2xl p-4 flex items-center justify-between shadow-md transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center space-x-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-base">Mother Portal</div>
              <div className="text-xs text-enat-100">Track your pregnancy, reminders & health logs</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-enat-200 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Clinic Dashboard Option */}
        <Link
          href="/clinic"
          className="w-full bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 rounded-2xl p-4 flex items-center justify-between shadow-sm transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center space-x-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-stone-700" />
            </div>
            <div>
              <div className="font-semibold text-base">Clinic Staff Portal</div>
              <div className="text-xs text-stone-500">Enrol patients, schedules & follow-up care</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-stone-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Fast Sign-in Links */}
      <div className="mt-8 pt-6 border-t border-stone-200 w-full flex items-center justify-center space-x-6 text-xs text-stone-600">
        <Link href="/login" className="hover:text-enat-700 font-medium underline underline-offset-4">
          Sign In
        </Link>
        <span>•</span>
        <Link href="/register" className="hover:text-enat-700 font-medium underline underline-offset-4">
          Register New Account
        </Link>
      </div>

      {/* Quick Demo Credentials Reminder Box */}
      <div className="mt-8 p-3.5 bg-stone-100 rounded-xl text-left text-xs text-stone-600 w-full border border-stone-200">
        <p className="font-semibold text-stone-800 mb-1 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-enat-700" /> Demo Accounts (Password: EnatDemo123!)
        </p>
        <p className="font-mono text-[11px] text-stone-700">Clinic Admin: admin@stpaulclinic.et</p>
        <p className="font-mono text-[11px] text-stone-700">Clinic Staff: nurse.tigist@stpaulclinic.et</p>
        <p className="font-mono text-[11px] text-stone-700">Consented Mother: mother.chaltu@example.com</p>
        <p className="font-mono text-[11px] text-stone-700">Independent Mother: mother.leman@example.com</p>
      </div>
    </div>
  );
}
