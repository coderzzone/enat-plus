'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { WEEKS_DATA, WeekData } from '@/lib/weeklyData';
import { SAFETY_DISCLAIMER } from '@/lib/pregnancy';
import { 
  BookOpen, 
  Sparkles, 
  Heart, 
  Baby, 
  Activity, 
  Apple, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  PlusCircle, 
  Loader2 
} from 'lucide-react';

export default function WeeklyContentPage() {
  const [selectedWeek, setSelectedWeek] = useState<number>(16); // sensible default
  const [currentGestationalWeek, setCurrentGestationalWeek] = useState<number | null>(null);
  const [currentGestationalDays, setCurrentGestationalDays] = useState<number>(0);
  const [dbContentMap, setDbContentMap] = useState<Record<number, any>>({});
  const [activeTab, setActiveTab] = useState<'baby' | 'mom' | 'care'>('baby');
  const [loading, setLoading] = useState(true);
  
  const scrubberRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadWeeklyData() {
      try {
        const supabase = createClient();
        
        // 1. Fetch user gestational age from active pregnancy
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: preg } = await supabase
            .from('pregnancies')
            .select('lmp_date')
            .eq('mother_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

          if (preg?.lmp_date) {
            const lmp = new Date(preg.lmp_date);
            const now = new Date();
            const days = Math.max(0, Math.floor((now.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24)));
            const gestWeek = Math.min(40, Math.max(1, Math.floor(days / 7)));
            const gestDays = days % 7;
            setCurrentGestationalWeek(gestWeek);
            setCurrentGestationalDays(gestDays);
            setSelectedWeek(gestWeek);
          }
        }

        // 2. Fetch educational content from database
        const { data: contentData } = await supabase
          .from('pregnancy_content')
          .select('*')
          .order('week', { ascending: true });

        if (contentData) {
          const map: Record<number, any> = {};
          contentData.forEach((item) => {
            map[item.week] = item;
          });
          setDbContentMap(map);
        }
      } catch (err) {
        console.error('Failed to load weekly content:', err);
      } finally {
        setLoading(false);
      }
    }

    loadWeeklyData();
  }, []);

  // Auto-scroll scrubber to selected week
  useEffect(() => {
    if (scrubberRef.current) {
      const activeEl = scrubberRef.current.querySelector(`[data-week="${selectedWeek}"]`) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedWeek]);

  const weekData: WeekData = WEEKS_DATA[selectedWeek] || WEEKS_DATA[1];
  const dbItem = dbContentMap[selectedWeek];

  const getTrimesterBadge = (trimester: 1 | 2 | 3) => {
    if (trimester === 1) return { label: 'Trimester 1 • Weeks 1-13', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (trimester === 2) return { label: 'Trimester 2 • Weeks 14-27', color: 'bg-teal-50 text-teal-800 border-teal-200' };
    return { label: 'Trimester 3 • Weeks 28-40', color: 'bg-amber-50 text-amber-800 border-amber-200' };
  };

  const trimInfo = getTrimesterBadge(weekData.trimester);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-enat-700 mb-2" />
        <p className="text-xs">Loading baby & maternal guide...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* 1. Header & Trimester Quick Jump */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-stone-900 flex items-center gap-1.5">
              <BookOpen className="w-5 h-5 text-enat-700" />
              Weekly Development Guide
            </h1>
            <p className="text-xs text-stone-500">Baby growth & maternal wellness week-by-week</p>
          </div>

          {currentGestationalWeek && (
            <button
              onClick={() => setSelectedWeek(currentGestationalWeek)}
              className="inline-flex items-center text-[10px] font-bold bg-enat-50 hover:bg-enat-100 text-enat-800 border border-enat-200 px-2.5 py-1.5 rounded-xl transition shadow-2xs"
            >
              <Sparkles className="w-3 h-3 mr-1 text-enat-600 animate-pulse" />
              My Week ({currentGestationalWeek})
            </button>
          )}
        </div>

        {/* Trimester Segment Pills */}
        <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-bold">
          <button
            onClick={() => setSelectedWeek(selectedWeek <= 13 ? selectedWeek : 1)}
            className={`py-1.5 px-1 rounded-xl border transition ${
              weekData.trimester === 1
                ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            🌸 1st Trimester
          </button>
          <button
            onClick={() => setSelectedWeek(selectedWeek >= 14 && selectedWeek <= 27 ? selectedWeek : 14)}
            className={`py-1.5 px-1 rounded-xl border transition ${
              weekData.trimester === 2
                ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            🌿 2nd Trimester
          </button>
          <button
            onClick={() => setSelectedWeek(selectedWeek >= 28 ? selectedWeek : 28)}
            className={`py-1.5 px-1 rounded-xl border transition ${
              weekData.trimester === 3
                ? 'bg-amber-700 text-white border-amber-700 shadow-2xs'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            🌟 3rd Trimester
          </button>
        </div>
      </div>

      {/* 2. Interactive Week Horizontal Scrubber */}
      <div className="bg-white rounded-2xl border border-stone-200 p-2 shadow-2xs">
        <div 
          ref={scrubberRef}
          className="flex space-x-2 overflow-x-auto py-1 px-1 scrollbar-thin scroll-smooth"
        >
          {Array.from({ length: 40 }, (_, i) => i + 1).map((w) => {
            const isSelected = selectedWeek === w;
            const isCurrent = currentGestationalWeek === w;
            const itemData = WEEKS_DATA[w];

            return (
              <button
                key={w}
                data-week={w}
                onClick={() => setSelectedWeek(w)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-12 py-2 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-md scale-105'
                    : isCurrent
                    ? 'bg-teal-50 text-teal-900 border-2 border-teal-600'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/80'
                }`}
              >
                <span className="text-[10px] font-medium leading-none opacity-80">Wk</span>
                <span className="text-sm font-black leading-tight">{w}</span>
                <span className="text-xs mt-0.5">{itemData?.emoji || '🌱'}</span>
                {isCurrent && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-teal-600 animate-ping'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Hero Visual Baby & Fruit Size Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-800 via-teal-900 to-stone-900 p-5 text-white shadow-md">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-teal-500/20 blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-rose-500/10 blur-xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Header Row */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-teal-100">
                  Week {weekData.week} of 40
                </span>
                {currentGestationalWeek === weekData.week && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950">
                    You Are Here
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {weekData.titleEn}
              </h2>
              <p className="text-xs text-teal-200/90 font-medium">
                {weekData.titleAm}
              </p>
            </div>

            {/* Floating Fruit Bubble */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shadow-inner transition transform hover:scale-110">
                {weekData.emoji}
              </div>
              <span className="text-[10px] font-bold text-teal-200 mt-1 capitalize text-center leading-tight max-w-[70px]">
                {weekData.fruitEn}
              </span>
            </div>
          </div>

          {/* Size & Weight Metric Pills */}
          <div className="grid grid-cols-2 gap-2 bg-black/25 rounded-2xl p-2.5 backdrop-blur-xs border border-white/10">
            <div className="text-center border-r border-white/10 pr-2">
              <span className="text-[10px] text-teal-200 block font-medium">Approx. Baby Length</span>
              <span className="text-sm font-extrabold text-white">{weekData.lengthCm}</span>
            </div>
            <div className="text-center pl-2">
              <span className="text-[10px] text-teal-200 block font-medium">Approx. Baby Weight</span>
              <span className="text-sm font-extrabold text-white">{weekData.weightG}</span>
            </div>
          </div>

          {/* Comparison summary */}
          <div className="text-center pt-0.5">
            <p className="text-xs text-teal-100">
              Your baby is roughly the size of a <span className="font-bold underline decoration-teal-400 underline-offset-2">{weekData.fruitEn}</span> ({weekData.fruitAm})!
            </p>
          </div>
        </div>
      </div>

      {/* 4. Tabbed Segmented Controller */}
      <div className="bg-stone-200/70 p-1 rounded-2xl grid grid-cols-3 gap-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('baby')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
            activeTab === 'baby'
              ? 'bg-white text-teal-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Baby className="w-3.5 h-3.5" /> Baby Growth
        </button>
        <button
          onClick={() => setActiveTab('mom')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
            activeTab === 'mom'
              ? 'bg-white text-teal-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Heart className="w-3.5 h-3.5" /> Mom's Body
        </button>
        <button
          onClick={() => setActiveTab('care')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
            activeTab === 'care'
              ? 'bg-white text-teal-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Care & Food
        </button>
      </div>

      {/* 5. Dynamic Tab Content Cards */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-4">
        {/* Tab 1: Baby Development */}
        {activeTab === 'baby' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                <Baby className="w-4 h-4 text-teal-700" />
                Baby's Development in Week {weekData.week}
              </h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${trimInfo.color}`}>
                Trimester {weekData.trimester}
              </span>
            </div>

            <div className="space-y-2">
              {weekData.babyHighlights.map((hl, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-stone-50 rounded-xl border border-stone-100 text-xs text-stone-700">
                  <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0 text-[11px] font-black mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="leading-relaxed">{hl}</p>
                </div>
              ))}
            </div>

            {dbItem?.body && (
              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100/80 text-xs text-stone-700 leading-relaxed">
                <p className="font-semibold text-teal-900 mb-1">Weekly Fetal Summary:</p>
                <p>{dbItem.body}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Mom's Body Changes */}
        {activeTab === 'mom' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-600" />
                Mother's Body & Symptoms
              </h3>
              <span className="text-[10px] text-stone-400 font-medium">Week {weekData.week} Changes</span>
            </div>

            <div className="space-y-2">
              {weekData.momHighlights.map((hl, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-rose-50/50 rounded-xl border border-rose-100/70 text-xs text-stone-700">
                  <CheckCircle2 className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{hl}</p>
                </div>
              ))}
            </div>

            {/* Quick Action to log health symptoms */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-stone-500">Feeling changes today?</span>
              <Link
                href="/app/records"
                className="inline-flex items-center gap-1 text-xs font-bold text-enat-700 hover:text-enat-800 bg-enat-50 px-3 py-1.5 rounded-xl border border-enat-200 transition"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Log in Health Records
              </Link>
            </div>
          </div>
        )}

        {/* Tab 3: Care & Nutrition Tip */}
        {activeTab === 'care' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-600" />
                Clinical Care & Ethiopian Nutrition
              </h3>
              <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                Midwife Tip
              </span>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs text-amber-950 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                Weekly Healthcare Advice:
              </p>
              <p className="leading-relaxed pl-5">{weekData.careTip}</p>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs text-emerald-950 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Apple className="w-4 h-4 text-emerald-700" />
                Nutritional Focus:
              </p>
              <p className="leading-relaxed pl-5">{weekData.nutritionTip}</p>
            </div>

            {/* Quick Link to Community */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-stone-500">Have questions for fellow moms?</span>
              <Link
                href="/app/community"
                className="inline-flex items-center gap-1 text-xs font-bold text-pink-700 hover:text-pink-800 bg-pink-50 px-3 py-1.5 rounded-xl border border-pink-200 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Open Community Hub
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 6. Previous & Next Week Step Controls */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          disabled={selectedWeek <= 1}
          onClick={() => setSelectedWeek((prev) => Math.max(1, prev - 1))}
          className="flex-1 inline-flex items-center justify-center text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:pointer-events-none py-2.5 px-3 rounded-xl border border-stone-200 shadow-2xs transition"
        >
          <ChevronLeft className="w-4 h-4 mr-1 text-stone-500" />
          Week {Math.max(1, selectedWeek - 1)}
        </button>

        <span className="text-xs font-extrabold text-stone-400 px-2">
          {selectedWeek} / 40
        </span>

        <button
          disabled={selectedWeek >= 40}
          onClick={() => setSelectedWeek((prev) => Math.min(40, prev + 1))}
          className="flex-1 inline-flex items-center justify-center text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:pointer-events-none py-2.5 px-3 rounded-xl border border-stone-200 shadow-2xs transition"
        >
          Week {Math.min(40, selectedWeek + 1)}
          <ChevronRight className="w-4 h-4 ml-1 text-stone-500" />
        </button>
      </div>

      {/* 7. Clinical Disclaimer Footer */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-900 leading-relaxed space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-amber-950">
          <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>Educational Guidance Disclaimer</span>
        </div>
        <p>{SAFETY_DISCLAIMER}</p>
      </div>
    </div>
  );
}
