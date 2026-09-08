'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Eye, EyeOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Duty = { id: number; title: string; academicsession: string; type: string };
type Slot = {
  id: number; slottext: string; slottime: string; slotdate: string; requirement: number; applicants: number; hidden: number;
};

export default function SlotsAdminPage() {
  const router = useRouter();
  const params = useSearchParams();
  const dutyParam = Number(params.get('duty') || 0);

  const [duties, setDuties] = useState<Duty[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const selectedDuty = dutyParam || duties[0]?.id || 0;

  const [addOpen, setAddOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [editing, setEditing] = useState<Slot | null>(null);

  const [addForm, setAddForm] = useState({ slottext: '', slottime: '', slotdate: '', requirement: 0 });
  const [editForm, setEditForm] = useState({ slottext: '', slottime: '', slotdate: '', requirement: 0 });

  // auto-generate state — Calendar drives `selectedDays` (Date[]); we derive ISO strings on submit
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [templates, setTemplates] = useState([{ slottext: '', slottime: '', requirement: 0 }]);

  const toIsoDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const sortedDays = [...selectedDays].sort((a, b) => a.getTime() - b.getTime());

  useEffect(() => {
    api<{ duties: Duty[] }>('/api/duties').then((d) => setDuties(d.duties)).catch((e) => setMessage({ text: e.message, type: 'error' }));
  }, []);

  useEffect(() => {
    if (!selectedDuty) { setSlots([]); return; }
    api<{ slots: Slot[] }>(`/api/slots?duty=${selectedDuty}`)
      .then((d) => setSlots(d.slots))
      .catch((e) => setMessage({ text: e.message, type: 'error' }));
  }, [selectedDuty]);

  function changeDuty(id: string) { router.push(`/admin/slots?duty=${id}`); }

  const slotsByDate = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const list = map.get(s.slotdate) || [];
      list.push(s);
      map.set(s.slotdate, list);
    }
    return Array.from(map.entries());
  }, [slots]);

  async function reloadSlots() {
    const d = await api<{ slots: Slot[] }>(`/api/slots?duty=${selectedDuty}`);
    setSlots(d.slots);
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/api/slots', { method: 'POST', body: JSON.stringify({ ...addForm, duty: selectedDuty }) });
      setMessage({ text: 'Slot added successfully.', type: 'success' });
      setAddOpen(false);
      setAddForm({ slottext: '', slottime: '', slotdate: '', requirement: 0 });
      await reloadSlots();
    } catch (e) { setMessage({ text: (e as Error).message, type: 'error' }); }
  }

  function openEdit(s: Slot) {
    setEditForm({ slottext: s.slottext, slottime: s.slottime, slotdate: s.slotdate, requirement: s.requirement });
    setEditing(s);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      await api(`/api/slots/${editing.id}`, { method: 'PUT', body: JSON.stringify(editForm) });
      setMessage({ text: 'Slot updated successfully.', type: 'success' });
      setEditing(null);
      await reloadSlots();
    } catch (e) { setMessage({ text: (e as Error).message, type: 'error' }); }
  }

  async function remove(s: Slot) {
    if (!confirm('Are you sure you want to delete this slot?')) return;
    try {
      await api(`/api/slots/${s.id}`, { method: 'DELETE' });
      setMessage({ text: 'Slot deleted successfully.', type: 'success' });
      await reloadSlots();
    } catch (e) { setMessage({ text: (e as Error).message, type: 'error' }); }
  }

  async function toggleVisibility(s: Slot) {
    try {
      const nextHidden = !s.hidden;
      await api(`/api/slots/${s.id}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify({ hidden: nextHidden }),
      });
      setMessage({
        text: nextHidden ? 'Slot hidden from faculty.' : 'Slot is now visible to faculty.',
        type: 'success',
      });
      await reloadSlots();
    } catch (e) { setMessage({ text: (e as Error).message, type: 'error' }); }
  }

  async function submitAuto(e: React.FormEvent) {
    e.preventDefault();
    try {
      const dates = sortedDays.map(toIsoDate);
      const res = await api<{ generated: number; dates: number }>('/api/slots/generate', {
        method: 'POST',
        body: JSON.stringify({ duty: selectedDuty, dates, templates }),
      });
      setMessage({ text: `Generated ${res.generated} slots across ${res.dates} dates.`, type: 'success' });
      setAutoOpen(false);
      setSelectedDays([]);
      setTemplates([{ slottext: '', slottime: '', requirement: 0 }]);
      await reloadSlots();
    } catch (e) { setMessage({ text: (e as Error).message, type: 'error' }); }
  }

  return (
    <>
      {message && <Alert variant={message.type === 'success' ? 'success' : 'destructive'}>{message.text}</Alert>}

      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Slots</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage individual slots or auto-generate by date.</p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap text-xs uppercase tracking-wider text-muted-foreground">Duty</Label>
          <Select value={String(selectedDuty)} onValueChange={changeDuty}>
            <SelectTrigger className="w-[320px]"><SelectValue placeholder="Select duty" /></SelectTrigger>
            <SelectContent>
              {duties.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.title} ({d.academicsession})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddOpen(true)} disabled={!selectedDuty}>Add slot</Button>
          <Button variant="outline" onClick={() => setAutoOpen(true)} disabled={!selectedDuty}>Auto-generate</Button>
        </div>
      </div>

      {slots.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No slots yet. Create your first slot to get started.</CardContent></Card>
      ) : (
        slotsByDate.map(([date, dateSlots]) => (
          <section key={date}>
            <div className="mb-3 flex items-end justify-between border-b pb-2">
              <h3 className="text-lg font-semibold text-primary">
                {new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <span className="text-xs text-muted-foreground">{date}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dateSlots.map((s) => {
                const avail = Math.max(0, s.requirement - s.applicants);
                const status = avail === 0 ? 'full' : (avail < s.requirement / 2 ? 'partial' : 'available');
                const isHidden = !!s.hidden;
                return (
                  <Card
                    key={s.id}
                    className={cn(
                      'transition-all',
                      isHidden && 'border-dashed bg-muted/30 opacity-75'
                    )}
                  >
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn('text-base font-semibold', isHidden && 'text-muted-foreground line-through')}>
                          {s.slottext}
                        </h4>
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                          {isHidden && (
                            <Badge variant="secondary" className="border border-dashed">
                              <EyeOff className="h-3 w-3" /> Hidden
                            </Badge>
                          )}
                          <Badge variant={status === 'full' ? 'destructive' : status === 'partial' ? 'warning' : 'success'}>
                            {avail === 0 ? 'Full' : avail === 1 ? '1 left' : `${avail} left`}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">🕐 {s.slottime}</p>
                      <div className="flex justify-between border-t pt-2 text-sm">
                        <div><div className="text-xs text-muted-foreground">Applicants</div><div className="font-semibold">{s.applicants}</div></div>
                        <div><div className="text-xs text-muted-foreground">Requirement</div><div className="font-semibold">{s.requirement}</div></div>
                      </div>
                      <div className="flex gap-1.5 pt-1">
                        <Button asChild size="sm" variant="outline" className="flex-1">
                          <Link href={`/admin/slots/${s.id}/applicants?duty=${selectedDuty}`}>View</Link>
                        </Button>
                        <Button size="sm" variant="secondary" className="flex-1" onClick={() => openEdit(s)}>Edit</Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleVisibility(s)}
                          title={isHidden ? 'Show to faculty' : 'Hide from faculty'}
                          aria-label={isHidden ? 'Show slot' : 'Hide slot'}
                        >
                          {isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => remove(s)}
                          title="Delete slot"
                          aria-label="Delete slot"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Slot</DialogTitle></DialogHeader>
          <form onSubmit={submitAdd} className="space-y-3">
            <div className="space-y-1"><Label>Slot Name</Label><Input required value={addForm.slottext} onChange={(e) => setAddForm({ ...addForm, slottext: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Time</Label><Input type="time" required value={addForm.slottime} onChange={(e) => setAddForm({ ...addForm, slottime: e.target.value })} /></div>
              <div className="space-y-1"><Label>Date</Label><Input type="date" required value={addForm.slotdate} onChange={(e) => setAddForm({ ...addForm, slotdate: e.target.value })} /></div>
            </div>
            <div className="space-y-1"><Label>Requirement</Label><Input type="number" min={0} required value={addForm.requirement} onChange={(e) => setAddForm({ ...addForm, requirement: Number(e.target.value) })} /></div>
            <DialogFooter><Button type="submit">Add Slot</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Slot</DialogTitle></DialogHeader>
          <form onSubmit={submitEdit} className="space-y-3">
            <div className="space-y-1"><Label>Slot Name</Label><Input required value={editForm.slottext} onChange={(e) => setEditForm({ ...editForm, slottext: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Time</Label><Input type="time" required value={editForm.slottime} onChange={(e) => setEditForm({ ...editForm, slottime: e.target.value })} /></div>
              <div className="space-y-1"><Label>Date</Label><Input type="date" required value={editForm.slotdate} onChange={(e) => setEditForm({ ...editForm, slotdate: e.target.value })} /></div>
            </div>
            <div className="space-y-1"><Label>Requirement</Label><Input type="number" min={0} required value={editForm.requirement} onChange={(e) => setEditForm({ ...editForm, requirement: Number(e.target.value) })} /></div>
            <DialogFooter><Button type="submit">Update Slot</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={autoOpen}
        onOpenChange={(o) => {
          setAutoOpen(o);
          if (!o) { setSelectedDays([]); setTemplates([{ slottext: '', slottime: '', requirement: 0 }]); }
        }}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Auto-Generate Slots</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Pick the dates on the left and define one or more slot templates on the right.
              We&apos;ll create every template on every date.
            </p>
          </DialogHeader>
          <form onSubmit={submitAuto} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              {/* LEFT — Dates */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    1. Choose dates
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {selectedDays.length === 0
                      ? 'Click days to add'
                      : `${selectedDays.length} day${selectedDays.length === 1 ? '' : 's'} selected`}
                  </span>
                </div>
                <div className="rounded-lg border bg-white p-2">
                  <Calendar
                    mode="multiple"
                    selected={selectedDays}
                    onSelect={(days) => setSelectedDays(days ?? [])}
                    disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                    numberOfMonths={1}
                    className="mx-auto"
                  />
                </div>

                <div className="rounded-lg border bg-secondary/30 p-3 min-h-[88px]">
                  {sortedDays.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Selected dates will appear here. Click a date again to remove it.
                    </p>
                  ) : (
                    <>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Selected
                        </span>
                        <button
                          type="button"
                          className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
                          onClick={() => setSelectedDays([])}
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {sortedDays.map((d) => {
                          const iso = toIsoDate(d);
                          const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                          return (
                            <Badge
                              key={iso}
                              variant="default"
                              className="group cursor-pointer pr-1"
                              onClick={() => setSelectedDays((cur) => cur.filter((x) => toIsoDate(x) !== iso))}
                              title="Click to remove"
                            >
                              {label}
                              <X className="ml-1 h-3 w-3 opacity-70 transition-opacity group-hover:opacity-100" />
                            </Badge>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* RIGHT — Slot templates */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    2. Slot templates per day
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    className="h-8 w-20 text-center"
                    value={templates.length}
                    onChange={(e) => {
                      const n = Math.max(1, Math.min(10, Number(e.target.value) || 1));
                      setTemplates((cur) => {
                        const next = [...cur];
                        while (next.length < n) next.push({ slottext: '', slottime: '', requirement: 0 });
                        while (next.length > n) next.pop();
                        return next;
                      });
                    }}
                  />
                </div>
                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {templates.map((t, i) => (
                    <div key={i} className="rounded-lg border bg-white p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                          Slot {i + 1}
                        </span>
                        {templates.length > 1 && (
                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => setTemplates(templates.filter((_, j) => j !== i))}
                            title="Remove"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Slot name (e.g. Morning)"
                          required
                          value={t.slottext}
                          onChange={(e) => setTemplates(templates.map((x, j) => j === i ? { ...x, slottext: e.target.value } : x))}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="time"
                            required
                            value={t.slottime}
                            onChange={(e) => setTemplates(templates.map((x, j) => j === i ? { ...x, slottime: e.target.value } : x))}
                          />
                          <Input
                            type="number"
                            min={0}
                            placeholder="Requirement"
                            required
                            value={t.requirement}
                            onChange={(e) => setTemplates(templates.map((x, j) => j === i ? { ...x, requirement: Number(e.target.value) } : x))}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {templates.length < 10 && (
                    <button
                      type="button"
                      onClick={() => setTemplates([...templates, { slottext: '', slottime: '', requirement: 0 }])}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-primary"
                    >
                      + Add another slot template
                    </button>
                  )}
                </div>
              </section>
            </div>

            <DialogFooter className="border-t pt-4">
              <div className="mr-auto text-xs text-muted-foreground">
                {selectedDays.length > 0 && templates.length > 0 ? (
                  <>
                    Will generate{' '}
                    <strong className="text-foreground tabular-nums">
                      {selectedDays.length * templates.length}
                    </strong>{' '}
                    slots ({selectedDays.length} {selectedDays.length === 1 ? 'date' : 'dates'} × {templates.length} per day)
                  </>
                ) : (
                  <>Pick at least one date to continue.</>
                )}
              </div>
              <Button type="submit" disabled={selectedDays.length === 0}>Generate Slots</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
