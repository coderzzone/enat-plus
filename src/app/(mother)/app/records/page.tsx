'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Activity, Plus, Heart, Scale, FileText, Stethoscope, AlertCircle, Loader2 } from 'lucide-react';
import { SAFETY_DISCLAIMER } from '@/lib/pregnancy';

export default function HealthRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [recordType, setRecordType] = useState<'blood_pressure' | 'weight' | 'symptom' | 'note'>('blood_pressure');
  const [systolic, setSystolic] = useState<number | ''>('');
  const [diastolic, setDiastolic] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [notesText, setNotesText] = useState('');
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadHealthRecords();
  }, []);

  async function loadHealthRecords() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('mother_id', user.id)
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load records.');
    } finally {
      setLoading(false);
    }
  }

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Validation
    if (recordType === 'blood_pressure' && (!systolic || !diastolic)) {
      setError('Please provide both systolic and diastolic blood pressure readings.');
      setSaving(false);
      return;
    }
    if (recordType === 'weight' && !weightKg) {
      setError('Please provide weight in kilograms.');
      setSaving(false);
      return;
    }
    if ((recordType === 'symptom' || recordType === 'note') && !notesText.trim()) {
      setError('Please describe your note or symptom.');
      setSaving(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: insertError } = await supabase
        .from('health_records')
        .insert({
          mother_id: user.id,
          type: recordType,
          systolic: systolic ? Number(systolic) : null,
          diastolic: diastolic ? Number(diastolic) : null,
          weight_kg: weightKg ? Number(weightKg) : null,
          text: notesText.trim() || null,
          recorded_at: new Date(recordedAt).toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setRecords((prev) => [data, ...prev]);
      setShowAddModal(false);
      setSystolic('');
      setDiastolic('');
      setWeightKg('');
      setNotesText('');
    } catch (err: any) {
      setError(err?.message || 'Failed to save health record.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-500">
        <Loader2 className="w-6 h-6 animate-spin text-enat-700 mb-2" />
        <p className="text-xs">Loading health records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-stone-900 flex items-center gap-1.5">
            <Activity className="w-5 h-5 text-enat-700" />
            Health Records
          </h1>
          <p className="text-xs text-stone-500">Self-recorded measurements and observations</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center bg-enat-700 hover:bg-enat-800 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Entry
        </button>
      </div>

      {/* Safety Notice (Non-negotiable: NO diagnosis, risk scoring, or triage) */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
        <p className="font-semibold text-amber-950 mb-0.5">Clinical Consultation Notice:</p>
        <p className="text-[11px]">{SAFETY_DISCLAIMER}</p>
        <p className="text-[10px] text-amber-800/90 mt-1 italic">
          This log is for personal reference and clinical discussion. Enat Plus does not evaluate or score your readings.
        </p>
      </div>

      {/* Records List */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
          Recorded Entries ({records.length})
        </h2>

        {records.length > 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 shadow-sm overflow-hidden">
            {records.map((rec) => (
              <div key={rec.id} className="p-4 flex items-start space-x-3">
                <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0 text-stone-700 mt-0.5">
                  {rec.type === 'blood_pressure' && <Heart className="w-4 h-4 text-rose-600" />}
                  {rec.type === 'weight' && <Scale className="w-4 h-4 text-enat-700" />}
                  {rec.type === 'symptom' && <Stethoscope className="w-4 h-4 text-amber-600" />}
                  {rec.type === 'note' && <FileText className="w-4 h-4 text-stone-600" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-stone-900 uppercase tracking-wide">
                      {rec.type === 'blood_pressure' && 'Blood Pressure'}
                      {rec.type === 'weight' && 'Weight Check'}
                      {rec.type === 'symptom' && 'Symptom Note'}
                      {rec.type === 'note' && 'Personal Note'}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {new Date(rec.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {rec.type === 'blood_pressure' && (
                    <div className="text-sm font-semibold text-stone-900">
                      {rec.systolic} / {rec.diastolic}{' '}
                      <span className="text-xs text-stone-500 font-normal">mmHg</span>
                    </div>
                  )}

                  {rec.type === 'weight' && (
                    <div className="text-sm font-semibold text-stone-900">
                      {rec.weight_kg}{' '}
                      <span className="text-xs text-stone-500 font-normal">kg</span>
                    </div>
                  )}

                  {rec.text && (
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                      {rec.text}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-stone-200 p-8 text-center text-stone-400 space-y-2">
            <Activity className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-xs font-medium text-stone-600">No health records logged yet.</p>
            <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
              Keep track of your blood pressure measurements, weight progress, or observations to discuss with your healthcare professional.
            </p>
          </div>
        )}
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">Log Health Entry</h3>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddRecord} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Record Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecordType('blood_pressure')}
                    className={`p-2 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 ${
                      recordType === 'blood_pressure'
                        ? 'border-enat-700 bg-enat-50 text-enat-800 font-semibold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" /> Blood Pressure
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordType('weight')}
                    className={`p-2 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 ${
                      recordType === 'weight'
                        ? 'border-enat-700 bg-enat-50 text-enat-800 font-semibold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" /> Weight
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordType('symptom')}
                    className={`p-2 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 ${
                      recordType === 'symptom'
                        ? 'border-enat-700 bg-enat-50 text-enat-800 font-semibold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" /> Symptom
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordType('note')}
                    className={`p-2 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 ${
                      recordType === 'note'
                        ? 'border-enat-700 bg-enat-50 text-enat-800 font-semibold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> General Note
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Date of Entry
                </label>
                <input
                  type="date"
                  required
                  value={recordedAt}
                  onChange={(e) => setRecordedAt(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
                />
              </div>

              {/* Conditional Inputs */}
              {recordType === 'blood_pressure' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Systolic (Upper)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 118"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Diastolic (Lower)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 76"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
                    />
                  </div>
                </div>
              )}

              {recordType === 'weight' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Weight in Kilograms (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 62.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {recordType === 'blood_pressure' || recordType === 'weight'
                    ? 'Optional Context / Note'
                    : 'Description / Observations *'}
                </label>
                <textarea
                  rows={3}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder={
                    recordType === 'blood_pressure'
                      ? 'e.g. Measured after 10 mins resting'
                      : recordType === 'symptom'
                      ? 'e.g. Mild headache after working outdoors'
                      : 'Add notes for your next clinic discussion...'
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold bg-enat-700 hover:bg-enat-800 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
