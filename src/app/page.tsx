'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Heart, 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Users, 
  ShoppingBag, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Activity, 
  ChevronRight,
  Globe2,
  Stethoscope,
  Smile,
  Baby,
  Pill,
  Award,
  Store,
  UserCheck
} from 'lucide-react';
import { SAFETY_DISCLAIMER } from '@/lib/pregnancy';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'mothers' | 'clinics' | 'marketplace'>('mothers');

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-800 selection:bg-teal-700 selection:text-white">
      {/* 1. TOP ANNOUNCEMENT & SAFETY BANNER */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-stone-900 text-white text-[11px] sm:text-xs py-2 px-4 text-center border-b border-teal-700/40">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
          <span className="bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
            ኢትዮጵያ 🇪🇹
          </span>
          <span className="font-medium">
            Ethiopia&apos;s Integrated Maternal Health Companion & Hospital Care Coordination Platform
          </span>
        </div>
      </div>

      {/* 2. NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-white/20 stroke-[2.5px]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-stone-950 text-lg tracking-tight">Enat Plus</span>
                <span className="text-xs bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded-full border border-teal-200">
                  እናት ፕላስ
                </span>
              </div>
              <p className="text-[10px] text-stone-500 font-medium">Maternal Care & Hospital Network</p>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-7 text-xs font-semibold text-stone-600">
            <a href="#features" className="hover:text-teal-700 transition">Features</a>
            <a href="#ecosystem" className="hover:text-teal-700 transition">For Mothers</a>
            <a href="#clinics" className="hover:text-teal-700 transition">For Hospitals</a>
            <a href="#marketplace" className="hover:text-teal-700 transition">Marketplace</a>
            <a href="#safety" className="hover:text-teal-700 transition">Clinical Safety</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link
              href="/login"
              className="text-xs font-bold text-stone-700 hover:text-teal-700 px-3.5 py-2 rounded-xl transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white px-4 py-2.5 rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
        {/* Ethiopian Heritage Geometric Pattern & Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="absolute top-36 right-1/4 w-96 h-96 rounded-full bg-amber-300/25 blur-3xl" />
        </div>

        {/* Traditional Ethiopian Pattern Accent Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-teal-700 to-rose-600 mb-8 max-w-5xl mx-auto rounded-full opacity-80" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-6">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold shadow-2xs">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Every Week Matters. Every Mother Matters.</span>
            <span className="text-teal-400">•</span>
            <span className="font-bold text-teal-800">እያንዳንዱ ሳምንት ወሳኝ ነው</span>
          </div>

          {/* Grand Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-[1.15]">
            Empowering Ethiopian Mothers.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-teal-800 to-amber-700 block mt-1">
              Connecting Hospitals, Midwives & Care.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
            A comprehensive, mobile-first maternal ecosystem designed for Ethiopia. Guiding mothers through all 40 weeks with culturally attuned milestones, privacy-first hospital chart coordination, peer community, and verified maternal pharmacies.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <Link
              href="/app"
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-md transition-all active:scale-[0.98] gap-2"
            >
              <Heart className="w-4 h-4 fill-white/20" />
              <span>For Mothers: Start Free</span>
            </Link>

            <Link
              href="/clinic"
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center bg-white hover:bg-stone-50 text-stone-800 font-bold text-sm px-6 py-3.5 rounded-2xl border border-stone-300 shadow-2xs transition-all active:scale-[0.98] gap-2"
            >
              <Building2 className="w-4 h-4 text-teal-700" />
              <span>Clinic & Staff Portal</span>
            </Link>
          </div>

          {/* Quick Super Admin Link */}
          <div className="text-[11px] text-stone-500 pt-1">
            Ministry of Health or Facility Administrator?{' '}
            <Link href="/admin" className="font-semibold text-teal-700 hover:underline">
              Access Super Admin Governance →
            </Link>
          </div>

          {/* Hero Feature Teaser Grid / Interactive Floating Cards */}
          <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* Card 1: 40-Week Baby Card */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl p-2.5 bg-teal-50 rounded-2xl border border-teal-100/60 inline-block group-hover:scale-110 transition-transform">
                  🥑
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                  Week 16 • ሳምንት 16
                </span>
              </div>
              <h3 className="font-bold text-sm text-stone-900">Baby Size: Avocado (አቮካዶ)</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                40-week development guide with familiar Ethiopian comparisons (coffee cherry, avocado, corn, papaya).
              </p>
              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-teal-700 font-semibold">
                <span>Length: ~11.6 cm</span>
                <span>Weight: ~100 g</span>
              </div>
            </div>

            {/* Card 2: Consented Clinic EHR */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl p-2.5 bg-rose-50 rounded-2xl border border-rose-100/60 inline-block group-hover:scale-110 transition-transform">
                  🏥
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                  Care Coordination
                </span>
              </div>
              <h3 className="font-bold text-sm text-stone-900">Hospital & Clinic EHR</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Connect seamlessly with partner clinics (St. Paul&apos;s, Tikur Anbessa) while retaining 100% control over shared charts.
              </p>
              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-rose-700 font-semibold">
                <span>Opt-in Consent</span>
                <span>Missed Visit Triage</span>
              </div>
            </div>

            {/* Card 3: Motherpreneur Marketplace */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl p-2.5 bg-amber-50 rounded-2xl border border-amber-100/60 inline-block group-hover:scale-110 transition-transform">
                  🛍️
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                  Motherpreneur Hub
                </span>
              </div>
              <h3 className="font-bold text-sm text-stone-900">Marketplace & Care</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Order verified iron supplements, gentle belly butter, and baby essentials from licensed maternal vendors.
              </p>
              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-amber-800 font-semibold">
                <span>Verified Pharmacies</span>
                <span>Special Needs Care</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ETHIOPIAN HEALTHCARE REALITY & IMPACT STATS */}
      <section className="bg-stone-900 text-white py-12 px-4 border-y border-stone-800">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-teal-400">40 Weeks</div>
            <p className="text-xs text-stone-300 font-medium">Bilingual Clinical Guides (አማርኛ & English)</p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-amber-400">100%</div>
            <p className="text-xs text-stone-300 font-medium">Patient-Controlled Data Privacy (Default Off)</p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-teal-400">8 ANC</div>
            <p className="text-xs text-stone-300 font-medium">WHO & MOH Antenatal Visit Coordination</p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-amber-400">3 Ecosystems</div>
            <p className="text-xs text-stone-300 font-medium">Mother App • Clinic Portal • MOH Super Admin</p>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE 3-PILLAR ECOSYSTEM SECTION */}
      <section id="ecosystem" className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            A Complete Connected Network
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
            Designed for Every Stage of the Maternal Journey
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            Enat Plus seamlessly bridges mothers at home with their healthcare clinicians and specialized community care.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-stone-200/80 p-1.5 rounded-2xl inline-flex space-x-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('mothers')}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === 'mothers'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              👶 For Expectant Mothers
            </button>
            <button
              onClick={() => setActiveTab('clinics')}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === 'clinics'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              🏥 For Clinics & Hospitals
            </button>
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === 'marketplace'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              🛍️ Marketplace & Special Needs
            </button>
          </div>
        </div>

        {/* Dynamic Tab Content Display */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-sm">
          {activeTab === 'mothers' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Mobile-First Mother Companion</span>
                <h3 className="text-2xl font-black text-stone-900">
                  Peace of Mind From Conception to Delivery
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Designed for low-bandwidth mobile networks across Ethiopia. Mothers track fetal milestones, log blood pressure and symptoms, receive appointment alerts, and connect with peer mothers in supportive trimester channels.
                </p>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-start gap-2.5 text-xs text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span><strong>40-Week Illustrated Guides:</strong> Relatable Ethiopian fruit and grain comparisons with baby length and weight tracking.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Daily Health Journal:</strong> Safely record resting blood pressure, weight changes, and notes.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Mothers Community Hub:</strong> Ask questions about morning nausea, barley genfo nutrition, and emotional wellness.</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Link
                    href="/app"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 px-5 py-3 rounded-xl shadow-xs transition"
                  >
                    Open Mother Companion <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Visual Mockup Box */}
              <div className="bg-gradient-to-br from-teal-50 to-stone-100 rounded-2xl p-6 border border-teal-100 space-y-3">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">Trimester 2 • Week 24</span>
                    <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">60% Complete</span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="text-3xl p-2 bg-stone-50 rounded-xl">🌽</div>
                    <div>
                      <p className="text-xs font-bold text-stone-900">Ear of Corn (የበቆሎ ራስ)</p>
                      <p className="text-[11px] text-stone-500">Length: ~30 cm • Weight: ~600 g</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-3 shadow-sm border border-stone-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-stone-400" />
                    <span>Daily Iron & Folic Acid Supplement</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Taken</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clinics' && (
            <div id="clinics" className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Clinical Workflow & Charting</span>
                <h3 className="text-2xl font-black text-stone-900">
                  Reduce Missed Visits & Coordinate Antenatal Care
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Clinics and hospitals onboard patients easily via invitation QR codes or phone numbers. View consented health trends, schedule upcoming ANC checkups, and triage missed appointments before complications develop.
                </p>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-start gap-2.5 text-xs text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Consented Patient Charts:</strong> Clinicians only access scopes explicitly granted by the mother.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Missed Appointment Follow-Up:</strong> Automated queue identifying mothers who need outreach.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Audit Logging & Export:</strong> Export cohort reports compliant with national health management reporting.</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Link
                    href="/clinic"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 px-5 py-3 rounded-xl shadow-xs transition"
                  >
                    Open Clinic Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Visual Mockup Box */}
              <div className="bg-gradient-to-br from-rose-50 to-stone-100 rounded-2xl p-6 border border-rose-100 space-y-3">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-900">St. Paul Maternal Clinic</span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">Active Registry</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-stone-600">
                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span>Total Enrolled Patients:</span>
                      <span className="font-bold text-stone-900">142 Mothers</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span>Next Checkup Scheduled:</span>
                      <span className="font-bold text-emerald-700">Tomorrow, 9:00 AM</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Follow-Up Outreach Required:</span>
                      <span className="font-bold text-amber-700">3 Missed Visits</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'marketplace' && (
            <div id="marketplace" className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Commerce & Inclusive Support</span>
                <h3 className="text-2xl font-black text-stone-900">
                  Motherpreneur Marketplace & Special Needs Care
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Access safe, verified maternity supplements and essentials from licensed pharmacies and local female-led businesses. Plus, inclusive education for mothers with mobility differences, chronic conditions, and infant milestones.
                </p>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-start gap-2.5 text-xs text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Licensed Partner Pharmacies:</strong> Genuine prenatal iron, folic acid, and pregnancy-safe skincare.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Special Needs Maternal Education:</strong> Guidance for physical disabilities, chronic illness, and neurodiversity.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Super Admin Commission Governance:</strong> Transparent vendor verification and commission tracking.</span>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Link
                    href="/app/marketplace"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 px-5 py-3 rounded-xl shadow-xs transition"
                  >
                    Browse Marketplace <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/app/special-needs"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-5 py-3 rounded-xl transition"
                  >
                    Special Needs Care
                  </Link>
                </div>
              </div>

              {/* Visual Mockup Box */}
              <div className="bg-gradient-to-br from-amber-50 to-stone-100 rounded-2xl p-6 border border-amber-100 space-y-3">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-900">Addis Maternal Pharmacy</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Licensed Vendor</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="text-2xl p-2 bg-stone-50 rounded-xl">💊</div>
                    <div>
                      <p className="text-xs font-bold text-stone-900">Folic Acid + Iron High-Absorption</p>
                      <p className="text-xs font-black text-teal-800 mt-0.5">450 ETB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. CORE FEATURES BENTO GRID */}
      <section id="features" className="py-16 px-4 bg-stone-100/70 border-t border-stone-200">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Product Capabilities</span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900">
              Built for Safety, Dignity & Clinical Standards
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Every screen in Enat Plus adheres to ethical healthcare principles and cultural nuance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Bento Item 1 */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-stone-900">40-Week Cultural Guidance</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Relatable fruit and vegetable comparisons, anatomical organ milestones, and trimester-by-trimester body adaptations in English and Amharic.
              </p>
            </div>

            {/* Bento Item 2 */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-stone-900">Strict Patient Consent</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Health records remain private by default. Mothers independently choose whether to share summaries, appointment schedules, or health logs with their clinic.
              </p>
            </div>

            {/* Bento Item 3 */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-stone-900">Mothers Community Hub</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Safe peer discussions divided into five channels: 1st Trimester, 2nd Trimester, 3rd Trimester, New Mothers, and Nutrition & Rest.
              </p>
            </div>

            {/* Bento Item 4 */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-stone-900">ANC Visit Coordination</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Never miss an antenatal checkup. Clinics book visits directly into the mother&apos;s app with automatic date and time alerts.
              </p>
            </div>

            {/* Bento Item 5 */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Smile className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-stone-900">Inclusive Special Needs</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Dedicated support for mothers with physical mobility impairments, gestational hypertension/diabetes care, and early infant screening.
              </p>
            </div>

            {/* Bento Item 6 */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-stone-900">MOH Facility Governance</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Super Admin portal verifying clinic medical licenses, doctor and nurse credentials, and marketplace take-rate commission revenue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CLINICAL SAFETY COMMITMENT */}
      <section id="safety" className="py-16 px-4 max-w-4xl mx-auto">
        <div className="bg-amber-50/90 border border-amber-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-950">Ethical Healthcare & Safety Guarantee</h3>
              <p className="text-xs text-amber-800 font-medium">Built with the highest clinical safety boundaries</p>
            </div>
          </div>

          <p className="text-xs text-amber-900 leading-relaxed">
            {SAFETY_DISCLAIMER}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] text-amber-900 font-medium border-t border-amber-200/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>Strictly No Automated Medical Diagnosis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>No High-Risk Scoring or Prescriptive Dosing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>Conservative Guidelines Aligned with MOH</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>Instant Data Sharing Revocation</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. QUICK DEMO ACCESS PANEL */}
      <section className="py-8 px-4 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-teal-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Evaluation & Presentation Demo Credentials
              </h3>
            </div>
            <span className="text-[10px] bg-stone-100 text-stone-600 font-mono px-2 py-0.5 rounded-full">
              Password: EnatDemo123!
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
              <span className="text-[10px] font-bold text-teal-800 uppercase block">Super Admin</span>
              <p className="font-mono text-[11px] text-stone-900 truncate">superadmin@enatplus.et</p>
              <p className="text-[10px] text-stone-400">National Facility Governance</p>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
              <span className="text-[10px] font-bold text-rose-800 uppercase block">St. Paul Clinic</span>
              <p className="font-mono text-[11px] text-stone-900 truncate">admin@stpaulclinic.et</p>
              <p className="text-[10px] text-stone-400">Hospital EHR & Patients</p>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
              <span className="text-[10px] font-bold text-blue-800 uppercase block">Tikur Anbessa</span>
              <p className="font-mono text-[11px] text-stone-900 truncate">admin@tikuranbessa.et</p>
              <p className="text-[10px] text-stone-400">Specialized Hospital Care</p>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Consented Mother</span>
              <p className="font-mono text-[11px] text-stone-900 truncate">mother.chaltu@example.com</p>
              <p className="text-[10px] text-stone-400">Week 24 Maternal Profile</p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FINAL CALL TO ACTION BANNER */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-teal-800 via-teal-900 to-stone-950 p-8 sm:p-14 text-white text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              Join the Maternal Health Movement
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Ready to experience Enat Plus?
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
              Whether you are an expectant mother looking for personalized weekly guidance or a healthcare clinic aiming to coordinate antenatal visits, Enat Plus is here for you.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-sm transition active:scale-95"
              >
                Create Free Mother Account
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl border border-white/20 transition active:scale-95"
              >
                Sign In to Your Portal
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
