'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, Plus, CheckCircle2, Circle, Trash2, Calendar, Pill, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { SAFETY_DISCLAIMER } from '@/lib/pregnancy';

export default function RemindersPage() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [kind, setKind] = useState<'medication' | 'appointment'>('medication');
  const [title, setTitle] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReminders();
  }, []);

  async function loadReminders() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('mother_id', user.id)
        .order('remind_at', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load reminders.');
    } finally {
      setLoading(false);
    }
  }

  const handleToggleDone = async (id: string, currentDone: boolean) => {
    try {
      const supabase = createClient();
      const newStatus = !currentDone;

      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, done: newStatus } : r))
      );

      await supabase.from('reminders').update({ done: newStatus }).eq('id', id);
    } catch (err) {
      console.error('Error toggling reminder status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const supabase = createClient();
      setReminders((prev) => prev.filter((r) => r.id !== id));
      await supabase.from('reminders').delete().eq('id', id);
    } catch (err) {
      console.error('Error deleting reminder:', err);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!title || !remindAt) {
      setError('Please provide a title and reminder time.');
      setSaving(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: insertError } = await supabase
        .from('reminders')
        .insert({
          mother_id: user.id,
          kind,
          title,
          remind_at: new Date(remindAt).toISOString(),
          notes: notes || null,
          done: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setReminders((prev) => [...prev, data].sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime()));
      setShowAddModal(false);
      setTitle('');
      setRemindAt('');
      setNotes('');
    } catch (err: any) {
      setError(err?.message || 'Failed to create reminder.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-500">
        <Loader2 className="w-6 h-6 animate-spin text-enat-700 mb-2" />
        <p className="text-xs">Loading reminders...</p>
      </div>
    );
  }

  // Filter due today vs upcoming
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const dueToday = reminders.filter((r) => {
    const d = new Date(r.remind_at);
    return d >= todayStart && d <= todayEnd;
  });

  const otherReminders = reminders.filter((r) => {
    const d = new Date(r.remind_at);
    return d < todayStart || d > todayEnd;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-stone-900 flex items-center gap-1.5">
            <Bell className="w-5 h-5 text-enat-700" />
            Reminders
          </h1>
          <p className="text-xs text-stone-500">Personal alerts for medication and checkups</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center bg-enat-700 hover:bg-enat-800 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4 mr-1" /> New Reminder
        </button>
      </div>

      {/* Mandatory Safety Guidance for Medications */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
        <span className="font-semibold block mb-0.5">Medication Safety Note:</span>
        Only set reminders for medicines already prescribed by your healthcare professional (such as iron & folic acid). Enat Plus does not prescribe or recommend medications.
      </div>

      {/* Due Today Section */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
          Due Today ({dueToday.length})
        </h2>

        {dueToday.length > 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 shadow-sm">
            {dueToday.map((rem) => (
              <ReminderRow
                key={rem.id}
                item={rem}
                onToggle={handleToggleDone}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-4 text-center text-xs text-stone-500 shadow-sm">
            No reminders due today.
          </div>
        )}
      </div>

      {/* Other / Upcoming Reminders */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
          All Reminders ({otherReminders.length})
        </h2>

        {otherReminders.length > 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 shadow-sm">
            {otherReminders.map((rem) => (
              <ReminderRow
                key={rem.id}
                item={rem}
                onToggle={handleToggleDone}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-stone-200 p-6 text-center text-xs text-stone-400">
            No other scheduled reminders. Tap "+ New Reminder" to create one.
          </div>
        )}
      </div>

      {/* Modal / Add Reminder Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">Add Reminder</h3>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateReminder} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Reminder Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setKind('medication')}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 ${
                      kind === 'medication'
                        ? 'border-enat-700 bg-enat-50 text-enat-800 font-semibold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Pill className="w-3.5 h-3.5" /> Medication
                  </button>
                  <button
                    type="button"
                    onClick={() => setKind('appointment')}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 ${
                      kind === 'appointment'
                        ? 'border-enat-700 bg-enat-50 text-enat-800 font-semibold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" /> Appointment
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={kind === 'medication' ? 'e.g. Folic acid supplement' : 'e.g. Antenatal checkup visit'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  When *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={remindAt}
                  onChange={(e) => setRemindAt(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Take with food / Bring yellow book"
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
                  {saving ? 'Saving...' : 'Save Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ReminderRow({
  item,
  onToggle,
  onDelete,
}: {
  item: any;
  onToggle: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const isMedication = item.kind === 'medication';
  return (
    <div className="p-3.5 flex items-start space-x-3 group">
      <button
        type="button"
        onClick={() => onToggle(item.id, item.done)}
        className="mt-0.5 text-stone-400 hover:text-enat-700 transition"
      >
        {item.done ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
        ) : (
          <Circle className="w-4 h-4" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              isMedication ? 'bg-teal-50 text-teal-700' : 'bg-blue-50 text-blue-700'
            }`}
          >
            {isMedication ? 'Medicine' : 'Appointment'}
          </span>
          <span className="text-[11px] text-stone-400">
            {new Date(item.remind_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
            at {new Date(item.remind_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <p
          className={`text-xs font-medium leading-snug ${
            item.done ? 'line-through text-stone-400' : 'text-stone-900'
          }`}
        >
          {item.title}
        </p>

        {item.notes && (
          <p className="text-[11px] text-stone-500 mt-0.5 leading-normal">{item.notes}</p>
        )}
      </div>

      <button
        onClick={() => onDelete(item.id)}
        className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 transition p-1"
        title="Delete reminder"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
