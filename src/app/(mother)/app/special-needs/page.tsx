'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  HeartHandshake, 
  Activity, 
  Baby, 
  Smile, 
  HelpCircle, 
  CheckCircle2, 
  BookOpen, 
  ShieldCheck, 
  ChevronRight,
  Loader2 
} from 'lucide-react';
import { SAFETY_DISCLAIMER } from '@/lib/pregnancy';

export default function SpecialNeedsEducationPage() {
  const [contentList, setContentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);

  useEffect(() => {
    loadSpecialNeedsContent();
  }, []);

  async function loadSpecialNeedsContent() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('special_needs_content')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setContentList(data || []);
      if (data && data.length > 0) {
        setSelectedTopic(data[0]);
      }
    } catch (err) {
      console.error('Failed to load special needs content:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-enat-700 mb-2" />
        <p className="text-xs">Loading inclusive maternal guide...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
          <HeartHandshake className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-stone-900">Special Needs Maternal Care</h1>
          <p className="text-xs text-stone-500">Empowering inclusive care, adaptations & specialized support</p>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
        <p className="font-semibold text-amber-950 mb-0.5">Individualized Clinical Assessment:</p>
        <p className="text-[11px]">{SAFETY_DISCLAIMER}</p>
        <p className="text-[10px] text-amber-800/90 mt-1 italic">
          Every mother and baby is unique. Use these guides to prepare questions for your healthcare specialist.
        </p>
      </div>

      {/* Topic Cards / Selector */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
          Specialized Education Modules
        </h2>

        <div className="grid grid-cols-1 gap-2.5">
          {contentList.map((item) => {
            const isSelected = selectedTopic?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedTopic(item)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50/70 shadow-2xs'
                    : 'border-stone-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">
                        {item.topic_area}
                      </span>
                      <h3 className="text-xs font-bold text-stone-900 mt-0.5">{item.title}</h3>
                      <p className="text-[11px] text-stone-600 mt-1 leading-snug">{item.summary}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 mt-1 transition-transform ${isSelected ? 'rotate-90 text-purple-700' : 'text-stone-300'}`} />
                </div>

                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-purple-200/60 text-xs text-stone-700 leading-relaxed bg-white p-3.5 rounded-xl border border-purple-100">
                    <p className="whitespace-pre-line">{item.body}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Supportive Resources Box */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-2">
        <h3 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-purple-700" />
          Specialist Referral Information (Ethiopia)
        </h3>
        <p className="text-[11px] text-stone-600 leading-relaxed">
          If your antenatal screening indicates specialized neonatal care or if you require physical therapy accommodations, major referral centres such as Tikur Anbessa Hospital and St. Paul's Hospital offer specialized multidisciplinary maternal clinics. Speak to your attending midwife to initiate an early referral.
        </p>
      </div>
    </div>
  );
}
