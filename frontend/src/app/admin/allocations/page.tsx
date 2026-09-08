'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, CalendarRange, Clock, DoorOpen, EyeOff, Loader2, MapPin, RefreshCw, Settings2, Users2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Duty = { id: number; title: string; academicsession: string; type: string };
type Room = { id: number; name: string; need: number | null };
type AllocUser = {
  id: number; name: string; role: string;
  employeeid: string | null; email: string | null; department: string | null;
};
type AllocSlot = {
  slot: { id: number; slottext: string; slottime: string; slotdate: string; requirement: number };
  rooms: { room: { id: number; name: string; need: number }; users: AllocUser[] }[];
  reserved: AllocUser[];
};
type Allocation = {
  duty: { id: number; title: string; academicsession: string; type: string };
  generated_at: string | null;
  slots: AllocSlot[];
};

export default function AllocationsPage() {
  const [duties, setDuties] = useState<Duty[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dutyId, setDutyId] = useState<string>('');
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [allocationLoading, setAllocationLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [genOpen, setGenOpen] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<Set<number>>(new Set());
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    Promise.all([
      api<{ duties: Duty[] }>('/api/duties'),
      api<{ rooms: Room[] }>('/api/rooms'),
    ])
      .then(([d, r]) => { setDuties(d.duties); setRooms(r.rooms); })
      .catch((e) => setMessage({ text: (e as Error).message, type: 'error' }));
  }, []);

  useEffect(() => {
    if (!dutyId) { setAllocation(null); return; }
    setAllocationLoading(true);
    api<Allocation>(`/api/allocations?duty=${dutyId}`)
      .then((a) => setAllocation(a))
      .catch((e) => setMessage({ text: (e as Error).message, type: 'error' }))
      .finally(() => setAllocationLoading(false));
  }, [dutyId]);

  const totals = useMemo(() => {
    if (!allocation) return { assigned: 0, reserved: 0, slots: 0, rooms: 0 };
    const roomSet = new Set<number>();
    let assigned = 0, reserved = 0;
    for (const s of allocation.slots) {
      for (const r of s.rooms) {
        roomSet.add(r.room.id);
        assigned += r.users.length;
      }
      reserved += s.reserved.length;
    }
    return { assigned, reserved, slots: allocation.slots.length, rooms: roomSet.size };
  }, [allocation]);

  function openGenerate() {
    // Default to all rooms with positive capacity
    setSelectedRooms(new Set(rooms.filter((r) => (r.need || 0) > 0).map((r) => r.id)));
    setGenOpen(true);
  }

  async function generate() {
    if (!dutyId) return;
    if (selectedRooms.size === 0) return;
    setGenerating(true);
    setMessage(null);
    try {
      const res = await api<{ assigned: number; reserved: number; slots: number; rooms_used: number }>(
        '/api/allocations/generate',
        {
          method: 'POST',
          body: JSON.stringify({ duty_id: Number(dutyId), room_ids: Array.from(selectedRooms) }),
        },
      );
      setMessage({
        text: `Generated — ${res.assigned} assigned · ${res.reserved} in reserved · across ${res.slots} slot${res.slots === 1 ? '' : 's'} and ${res.rooms_used} room${res.rooms_used === 1 ? '' : 's'}.`,
        type: 'success',
      });
      setGenOpen(false);
      // Reload allocation
      const a = await api<Allocation>(`/api/allocations?duty=${dutyId}`);
      setAllocation(a);
    } catch (e) {
      setMessage({ text: (e as Error).message, type: 'error' });
    } finally { setGenerating(false); }
  }

  const usableRooms = rooms.filter((r) => (r.need || 0) > 0);
  const allRoomsSelected = usableRooms.length > 0 && usableRooms.every((r) => selectedRooms.has(r.id));
  const totalSelectedCapacity = usableRooms
    .filter((r) => selectedRooms.has(r.id))
    .reduce((s, r) => s + (r.need || 0), 0);

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Room allocations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Distribute booked faculty into rooms per slot. Extras land in the (private) reserved tray.
          </p>
        </div>
      </header>

      {message && <Alert variant={message.type === 'success' ? 'success' : message.type === 'info' ? 'info' : 'destructive'}>{message.text}</Alert>}

      <Card>
        <CardContent className="flex flex-wrap items-end justify-between gap-4 p-5">
          <div className="flex flex-1 items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Duty</Label>
              <Select value={dutyId} onValueChange={setDutyId}>
                <SelectTrigger className="w-[340px]"><SelectValue placeholder="Select a duty…" /></SelectTrigger>
                <SelectContent>
                  {duties.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.title} ({d.academicsession})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {allocation?.generated_at && (
              <p className="pb-2 text-xs text-muted-foreground">
                Last generated {new Date(allocation.generated_at).toLocaleString()}
              </p>
            )}
          </div>
          <Button onClick={openGenerate} disabled={!dutyId || usableRooms.length === 0}>
            {allocation?.generated_at ? <><RefreshCw className="h-4 w-4" /> Regenerate</> : <><Settings2 className="h-4 w-4" /> Generate allocation</>}
          </Button>
        </CardContent>
      </Card>

      {!dutyId ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">Pick a duty to start</p>
              <p className="text-sm text-muted-foreground">Then choose the rooms to use for this allocation.</p>
            </div>
          </CardContent>
        </Card>
      ) : allocationLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !allocation?.slots?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <Settings2 className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">No allocation yet for this duty</p>
              <p className="text-sm text-muted-foreground">
                Click <strong>Generate allocation</strong>. Faculty booked into each slot will be distributed across the rooms you pick.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary tiles */}
          <div className="grid gap-3 sm:grid-cols-4">
            <SummaryTile icon={CalendarRange} label="Slots" value={totals.slots} />
            <SummaryTile icon={DoorOpen} label="Rooms in use" value={totals.rooms} />
            <SummaryTile icon={Users2} label="Assigned" value={totals.assigned} tone="primary" />
            <SummaryTile icon={EyeOff} label="Reserved (private)" value={totals.reserved} tone={totals.reserved ? 'warning' : 'muted'} />
          </div>

          {/* Per slot */}
          {allocation.slots.map((s) => (
            <section key={s.slot.id} className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b pb-2">
                <div>
                  <h2 className="font-display text-lg font-semibold">{s.slot.slottext}</h2>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarRange className="h-3.5 w-3.5" />
                    {new Date(s.slot.slotdate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    <span className="text-border">·</span>
                    <Clock className="h-3.5 w-3.5" />
                    {s.slot.slottime}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">Requirement: {s.slot.requirement}</Badge>
                  <Badge variant="default">
                    {s.rooms.reduce((sum, r) => sum + r.users.length, 0)} assigned
                  </Badge>
                  {s.reserved.length > 0 && (
                    <Badge variant="warning"><EyeOff className="h-3 w-3" /> {s.reserved.length} reserved</Badge>
                  )}
                </div>
              </div>

              {s.rooms.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {s.rooms.map((r) => (
                    <Card key={r.room.id} className="overflow-hidden">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 font-display text-base font-semibold">
                              <DoorOpen className="h-4 w-4 text-primary" /> {r.room.name}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {r.users.length} / {r.room.need} filled
                            </p>
                          </div>
                          <Badge variant={r.users.length >= r.room.need ? 'success' : 'warning'}>
                            {r.users.length >= r.room.need ? 'Full' : `${r.room.need - r.users.length} short`}
                          </Badge>
                        </div>
                        <ul className="space-y-1.5">
                          {r.users.map((u) => (
                            <li key={u.id} className="flex items-center justify-between gap-2 rounded-md border bg-secondary/30 px-2.5 py-1.5 text-sm">
                              <span className="min-w-0">
                                <span className="block truncate font-medium">{u.name}</span>
                                <span className="block truncate text-[11px] text-muted-foreground">{u.employeeid || ''}{u.department ? ` · ${u.department}` : ''}</span>
                              </span>
                              <Badge variant="secondary" className="shrink-0">{u.role}</Badge>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert variant="info">No one is assigned to a room for this slot.</Alert>
              )}

              {s.reserved.length > 0 && (
                <div className="rounded-lg border border-dashed bg-amber-50/40 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-800">
                    <EyeOff className="h-3.5 w-3.5" /> Reserved · admin-only ({s.reserved.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.reserved.map((u) => (
                      <Badge key={u.id} variant="secondary" className="border" title={u.role}>
                        {u.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </section>
          ))}
        </>
      )}

      {/* Generate dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Generate room allocation</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Pick the rooms to use. We'll distribute the booked faculty per slot, balancing roles across rooms and pushing extras to a private reserved list.
            </p>
          </DialogHeader>

          {usableRooms.length === 0 ? (
            <Alert variant="warning">No rooms with capacity &gt; 0 found. Add or update rooms first.</Alert>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Rooms ({selectedRooms.size}/{usableRooms.length} · capacity {totalSelectedCapacity})
                </Label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                  onClick={() => {
                    if (allRoomsSelected) setSelectedRooms(new Set());
                    else setSelectedRooms(new Set(usableRooms.map((r) => r.id)));
                  }}
                >
                  {allRoomsSelected ? 'Clear' : 'Select all'}
                </button>
              </div>

              <div className="max-h-[320px] space-y-1 overflow-y-auto rounded-lg border bg-white p-2">
                {usableRooms.map((r) => {
                  const checked = selectedRooms.has(r.id);
                  return (
                    <label
                      key={r.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors ${checked ? 'bg-primary/10' : 'hover:bg-accent'}`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => setSelectedRooms((cur) => {
                          const next = new Set(cur);
                          if (v) next.add(r.id); else next.delete(r.id);
                          return next;
                        })}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{r.name}</div>
                      </div>
                      <Badge variant="secondary">{r.need} invigilator{r.need === 1 ? '' : 's'}</Badge>
                    </label>
                  );
                })}
              </div>

              {allocation?.generated_at && (
                <Alert variant="warning">
                  This duty already has an allocation. Regenerating will replace it.
                </Alert>
              )}
            </>
          )}

          <DialogFooter>
            <div className="mr-auto text-xs text-muted-foreground">
              {selectedRooms.size > 0
                ? <>Total capacity per slot: <strong className="text-foreground tabular-nums">{totalSelectedCapacity}</strong></>
                : 'Pick at least one room.'}
            </div>
            <Button onClick={generate} disabled={generating || selectedRooms.size === 0}>
              {generating
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                : <>Generate <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SummaryTile({
  icon: Icon, label, value, tone = 'default',
}: {
  icon: typeof Users2;
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'primary' | 'warning' | 'muted';
}) {
  const toneClasses: Record<string, string> = {
    default: 'text-foreground',
    primary: 'text-primary',
    warning: 'text-amber-700',
    muted: 'text-muted-foreground',
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`grid h-10 w-10 place-items-center rounded-lg bg-primary/10 ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={`font-display text-2xl font-semibold tabular-nums ${toneClasses[tone]}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
