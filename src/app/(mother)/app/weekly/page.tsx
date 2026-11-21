'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, Sparkles, AlertCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { SAFETY_DISCLAIMER } from '@/lib/pregnancy';

export default function WeeklyContentPage() {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [allContent, setAllContent] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [currentGestationalWeek, setCurrentGestationalWeek] = useState<number | null>(null);

  useEffect(() => {
    async function loadWeeklyContent() {
      try {
        const supabase = createClient();
        
        // 1. Fetch user gestational week if available
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
            setCurrentGestationalWeek(gestWeek);
            setSelectedWeek(gestWeek);
          }
        }

        // 2. Fetch all 40 weeks of educational content
        const { data: contentData } = await supabase
          .from('pregnancy_content')
          .select('*')
          .order('week', { ascending: true });

        if (contentData) {
          const map: Record<number, any> = {};
          contentData.forEach((item) => {
            map[item.week] = item;
          });
          setAllContent(map);
        }
      } catch (err) {
        console.error('Failed to load weekly content:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWeeklyContent();
  }, []);

  const activeContent = allContent[selectedWeek] || {
    week: selectedWeek,
    title: `Week ${selectedWeek}: Maternal Development`,
    body: 'Standard weekly development milestones are currently being indexed.',
    reviewed: false,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-500">
        <Loader2 className="w-6 h-6 animate-spin text-enat-700 mb-2" />
        <p className="text-xs">Loading educational guide...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-bold text-stone-900 flex items-center gap-1.5">
          <BookOpen className="w-5 h-5 text-enat-700" />
          Weekly Development Guide
        </h1>
        <p className="text-xs text-stone-500">
          Explore baby development and maternal changes from Week 1 to 40.
        </p>
      </div>

      {/* Week Selector Chips (Scrollable) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-2.5 shadow-sm">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-semibold text-stone-700">Select Week</span>
          {currentGestationalWeek && (
            <button
              onClick={() => setSelectedWeek(currentGestationalWeek)}
              className="text-[11px] font-semibold text-enat-700 hover:underline"
            >
              Jump to Your Week ({currentGestationalWeek})
            </button>
          )}
        </div>
        <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {Array.from({ length: 40 }, (_, i) => i + 1).map((w) => {
            const isSelected = selectedWeek === w;
            const isCurrent = currentGestationalWeek === w;
            return (
              <button
                key={w}
                onClick={() => setSelectedWeek(w)}
                className={`flex-shrink-0 w-9 h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-enat-700 text-white shadow-sm'
                    : isCurrent
                    ? 'bg-enat-100 text-enat-800 border border-enat-300'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {w}
              </button>
            );
          })}
        </div>
      </div>

      {/* Week Detail Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-black text-stone-900">
              Week {activeContent.week}
            </span>
            <span className="text-xs text-stone-400">
              {activeContent.week <= 13 ? 'Trimester 1' : activeContent.week <= 27 ? 'Trimester 2' : 'Trimester 3'}
            </span>
          </div>

          {!activeContent.reviewed && (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-medium px-2.5 py-1 rounded-full border border-amber-200">
              Draft - pending clinical review
            </span>
          )}
        </div>

        <div>
          <h2 className="text-base font-bold text-stone-900 mb-2">
            {activeContent.title}
          </h2>
          <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-100">
            {activeContent.body}
          </p>
        </div>

        {/* Previous / Next navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            disabled={selectedWeek <= 1}
            onClick={() => setSelectedWeek((prev) => Math.max(1, prev - 1))}
            className="inline-flex items-center text-xs font-medium text-stone-600 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none px-3 py-1.5 rounded-lg border border-stone-200"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Week {selectedWeek - 1}
          </button>

          <button
            disabled={selectedWeek >= 40}
            onClick={() => setSelectedWeek((prev) => Math.min(40, prev + 1))}
            className="inline-flex items-center text-xs font-medium text-stone-600 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none px-3 py-1.5 rounded-lg border border-stone-200"
          >
            Week {selectedWeek + 1} <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Safety Notice Footer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 leading-relaxed">
        {SAFETY_DISCLAIMER}
      </div>
    </div>
  );
}
