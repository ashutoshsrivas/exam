'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, Clock, Lock, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Duty = {
  id: number; title: string; academicsession: string; type: string; accepting_bookings: number;
  professor: number; assistantprofessor: number; associateprofessor: number; researchscholar: number;
  specialrole1: number; specialrole2: number; specialrole3: number; specialrole4: number;
};
type Slot = { id: number; slottext: string; slottime: string; slotdate: string; requirement: number; applicants: number };

const ROLE_LIMIT_COLUMN: Record<string, keyof Duty> = {
  'Professor': 'professor', 'Assistant Professor': 'assistantprofessor', 'Associate Professor': 'associateprofessor',
  'Research Scholar': 'researchscholar', 'Special Role 1': 'specialrole1', 'Special Role 2': 'specialrole2',
  'Special Role 3': 'specialrole3', 'Special Role 4': 'specialrole4',
};

export default function BookSlotsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dutyId = Number(params?.id);
  const { user } = useAuth();

  const [duty, setDuty] = useState<Duty | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!dutyId) return;
    Promise.all([
      api<{ duty: Duty }>(`/api/duties/${dutyId}`),
      api<{ slots: Slot[] }>(`/api/slots?duty=${dutyId}`),
      api<{ preferences: number[] }>(`/api/preferences?duty=${dutyId}`),
    ])
      .then(([d, s, p]) => {
        setDuty(d.duty);
        setSlots(s.slots);
        setSelected(new Set(p.preferences));
        setLocked(p.preferences.length > 0);
      })
      .catch((e) => setMessage({ text: (e as Error).message, type: 'error' }));
  }, [dutyId]);

  const isAccepting = duty ? Number(duty.accepting_bookings) === 1 : false;
  // A role with no quota column of its own has no allowance here — the server
  // rejects any selection from it. Don't borrow the Research Scholar column.
  const limitCol = user
    ? (ROLE_LIMIT_COLUMN[user.role] || ROLE_LIMIT_COLUMN[(user.role || '').replace(/\b\w/g, (c) => c.toUpperCase())] || null)
    : null;
  const roleLimit = duty && limitCol ? Math.max(0, Number(duty[limitCol]) || 0) : 0;

  const slotsByDate = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const list = map.get(s.slotdate) || [];
      list.push(s);
      map.set(s.slotdate, list);
    }
    return Array.from(map.entries());
  }, [slots]);

  function toggle(s: Slot) {
    if (locked || !isAccepting) return;
    const avail = Math.max(0, s.requirement - s.applicants);
    if (avail === 0 && !selected.has(s.id)) return;
    const next = new Set(selected);
    if (next.has(s.id)) next.delete(s.id); else next.add(s.id);
    setSelected(next);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      await api('/api/preferences', {
        method: 'POST',
        body: JSON.stringify({ duty: dutyId, slot_ids: Array.from(selected) }),
      });
      setMessage({ text: 'Preferences saved for this duty.', type: 'success' });
      setLocked(true);
      router.refresh();
    } catch (e) {
      setMessage({ text: (e as Error).message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (!duty) return null;

  // A quota of 0 means "this role may not book this duty" server-side, so there
  // is nothing valid to submit — the button stays disabled rather than posting a
  // selection the API will refuse.
  const canSave = !locked && isAccepting && roleLimit > 0 && selected.size === roleLimit;
  const progressPct = roleLimit ? Math.min(100, (selected.size / roleLimit) * 100) : 0;
  const progressTone = progressPct >= 100 ? 'bg-emerald-500' : progressPct > 0 ? 'bg-primary' : 'bg-slate-300';

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-1 text-muted-foreground">
            <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
          </Button>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{duty.title}</h1>
          <p className="text-sm text-muted-foreground">{duty.academicsession} · {duty.type}</p>
        </div>
        <div className="flex items-center gap-2">
          {locked && <Badge variant="success"><Check className="h-3 w-3" /> Saved</Badge>}
          {!isAccepting && <Badge variant="destructive"><Lock className="h-3 w-3" /> Closed</Badge>}
        </div>
      </header>

      {isAccepting && roleLimit === 0 && !locked && (
        <Alert variant="warning">
          <strong>No slots allocated to your role for this duty.</strong>{' '}
          {user?.role ? `${user.role} has a quota of 0 here.` : ''} Contact your admin if you think this is wrong.
        </Alert>
      )}

      {!isAccepting && (
        <Alert variant="warning">
          <strong>Bookings closed.</strong>{' '}
          {locked
            ? 'You can review your selected slots below, but cannot change them.'
            : 'You did not select any slots for this duty.'}
        </Alert>
      )}

      <form onSubmit={save} className="space-y-6">
        {/* Progress panel */}
        <Card className={cn('overflow-hidden', !isAccepting && 'pointer-events-none opacity-70')}>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Selections</p>
                <p className="font-display text-3xl font-semibold tracking-tight tabular-nums">
                  <span className="text-primary">{selected.size}</span>
                  <span className="text-muted-foreground"> / {roleLimit}</span>
                </p>
              </div>
              <Button type="submit" disabled={!canSave || saving} className="group">
                {saving ? 'Saving…' : <>
                  <Save className="h-4 w-4" /> Save preferences
                </>}
              </Button>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn('h-full rounded-full transition-all duration-500', progressTone)}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {!locked && roleLimit > 0 && selected.size !== roleLimit && (
              <p className="mt-3 text-xs text-muted-foreground">
                Select exactly {roleLimit} slot{roleLimit === 1 ? '' : 's'} to enable saving.
              </p>
            )}
            {locked && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" /> Preferences are locked once saved.
              </p>
            )}
          </CardContent>
        </Card>

        {message && (
          <Alert variant={message.type === 'success' ? 'success' : message.type === 'error' ? 'destructive' : message.type}>
            {message.text}
          </Alert>
        )}

        {slotsByDate.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No slots available for this duty.
            </CardContent>
          </Card>
        ) : (
          slotsByDate.map(([date, ds]) => {
            const formatted = new Date(date).toLocaleDateString(undefined, {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            });
            return (
              <section key={date} className="space-y-4">
                <div className="flex items-end justify-between border-b pb-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">{formatted}</h3>
                    <p className="text-xs text-muted-foreground">{date}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{ds.length} slot{ds.length === 1 ? '' : 's'}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {ds.map((s) => {
                    const avail = Math.max(0, s.requirement - s.applicants);
                    const isSelected = selected.has(s.id);
                    const isFull = avail === 0;
                    const disabled = locked || !isAccepting || (isFull && !isSelected);
                    const tone = isFull ? 'destructive' : avail <= s.requirement / 2 ? 'warning' : 'success';
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggle(s)}
                        disabled={disabled}
                        aria-pressed={isSelected}
                        className={cn(
                          'group relative flex flex-col gap-2 overflow-hidden rounded-xl border-2 bg-white p-4 text-left shadow-soft transition-all duration-200',
                          isSelected
                            ? 'border-primary bg-primary/[0.04] shadow-lift'
                            : 'border-transparent ring-1 ring-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
                          disabled && !isSelected && 'cursor-not-allowed opacity-55 hover:translate-y-0 hover:border-transparent'
                        )}
                      >
                        <div
                          className={cn(
                            'pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br opacity-0 blur-2xl transition-opacity duration-300',
                            isSelected ? 'from-primary/30 to-transparent opacity-100' : 'from-primary/10 to-transparent group-hover:opacity-100'
                          )}
                        />
                        <div className="relative flex items-start justify-between gap-2">
                          <h4 className="line-clamp-2 font-semibold">{s.slottext}</h4>
                          <Badge variant={tone}>
                            {avail === 0 ? 'Full' : avail === 1 ? '1 left' : `${avail} left`}
                          </Badge>
                        </div>
                        <p className="relative inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {s.slottime}
                        </p>
                        <div className="relative mt-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span className="tabular-nums">{s.applicants}/{s.requirement} taken</span>
                        </div>
                        {isSelected && (
                          <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-white animate-pop-in">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </form>
    </>
  );
}
