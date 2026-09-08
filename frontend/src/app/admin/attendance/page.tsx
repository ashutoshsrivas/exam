'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarRange, Clock, DoorOpen, Loader2, Users2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPicker, type PickerUser } from '@/components/user-picker';

type Slot = { id: number; slottext: string; slottime: string; slotdate: string; duty: number; duty_title?: string; academicsession?: string };
type Room = { id: number; name: string; need: number };
type SeatEntry = { user_id: number; name: string; role: string; employeeid: string | null; email: string | null; department: string | null; marked_at?: string };
type Attendance = {
  slot: Slot;
  rooms: { room: Room; seats: Record<number, SeatEntry> }[];
};
type SeatStatus = 'idle' | 'saving' | 'saved' | 'error';

const MIN_SEATS = 4;

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function AttendancePage() {
  const [date, setDate] = useState<string>(todayIso());
  const [slotsForDate, setSlotsForDate] = useState<Slot[]>([]);
  const [slotId, setSlotId] = useState<string>('');
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [seatStatus, setSeatStatus] = useState<Record<string, SeatStatus>>({});
  const [error, setError] = useState<string | null>(null);

  // Load slots for the picked date. We hit the admin duties feed (all duties)
  // and take slots via /api/slots?duty=… — but there's no per-date endpoint,
  // so simpler: fetch all duties, then all slots per duty, then filter by date.
  // With modest data volumes this is fine; if it ever isn't we can add a
  // dedicated /api/slots?date= endpoint.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingSlots(true);
      setError(null);
      try {
        const { duties } = await api<{ duties: { id: number; title: string; academicsession: string }[] }>('/api/duties');
        const per = await Promise.all(duties.map((d) =>
          api<{ slots: Slot[] }>(`/api/slots?duty=${d.id}`).then((r) => r.slots.map((s) => ({ ...s, duty_title: d.title, academicsession: d.academicsession }))),
        ));
        if (cancelled) return;
        const flat = per.flat().filter((s) => s.slotdate === date);
        flat.sort((a, b) => a.slottime.localeCompare(b.slottime));
        setSlotsForDate(flat);
        // Auto-select the first one, or preserve existing selection if still valid
        if (flat.length === 0) setSlotId('');
        else if (!flat.some((s) => String(s.id) === slotId)) setSlotId(String(flat[0].id));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoadingSlots(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // slotId intentionally left out — we only want to reload when the date changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const loadAttendance = useCallback(async () => {
    if (!slotId) { setAttendance(null); return; }
    setLoadingAttendance(true);
    try {
      const data = await api<Attendance>(`/api/attendance?slot=${slotId}`);
      setAttendance(data);
      setSeatStatus({});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingAttendance(false);
    }
  }, [slotId]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  async function saveSeat(roomId: number, seatIndex: number, user: PickerUser | null) {
    if (!slotId) return;
    const key = `${roomId}:${seatIndex}`;
    setSeatStatus((s) => ({ ...s, [key]: 'saving' }));
    setError(null);

    // Optimistic local update
    setAttendance((cur) => {
      if (!cur) return cur;
      return {
        ...cur,
        rooms: cur.rooms.map((r) => {
          if (r.room.id !== roomId) return r;
          const seats = { ...r.seats };
          if (user) {
            seats[seatIndex] = {
              user_id: user.id,
              name: user.name,
              role: user.role,
              employeeid: user.employeeid ?? null,
              email: user.email ?? null,
              department: user.department ?? null,
            };
          } else {
            delete seats[seatIndex];
          }
          return { ...r, seats };
        }),
      };
    });

    try {
      await api('/api/attendance', {
        method: 'PUT',
        body: JSON.stringify({
          slot_id: Number(slotId),
          room_id: roomId,
          seat_index: seatIndex,
          user_id: user?.id ?? null,
        }),
      });
      setSeatStatus((s) => ({ ...s, [key]: 'saved' }));
      setTimeout(() => {
        setSeatStatus((s) => (s[key] === 'saved' ? { ...s, [key]: 'idle' } : s));
      }, 1600);
    } catch (e) {
      // Revert the optimistic change by refetching
      setSeatStatus((s) => ({ ...s, [key]: 'error' }));
      const err = e as ApiError;
      setError(err.message);
      loadAttendance();
    }
  }

  const selectedSlot = useMemo(
    () => slotsForDate.find((s) => String(s.id) === slotId) || null,
    [slotsForDate, slotId],
  );

  const totalFilled = attendance?.rooms.reduce((n, r) => n + Object.keys(r.seats).length, 0) ?? 0;

  return (
    <>
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a date, pick the slot, then tap a search box in any room to mark who is present. Auto-saved.
        </p>
      </header>

      {error && <Alert variant="destructive">{error}</Alert>}

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-5">
          <div className="space-y-1">
            <Label htmlFor="att-date" className="text-xs uppercase tracking-wider text-muted-foreground">Date</Label>
            <Input
              id="att-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-[180px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Slot</Label>
            {loadingSlots ? (
              <div className="flex h-10 w-[340px] items-center rounded-md border bg-white px-3 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Loading slots…
              </div>
            ) : slotsForDate.length === 0 ? (
              <div className="flex h-10 w-[340px] items-center rounded-md border border-dashed bg-secondary/30 px-3 text-xs text-muted-foreground">
                No slots on this date.
              </div>
            ) : (
              <Select value={slotId} onValueChange={setSlotId}>
                <SelectTrigger className="w-[340px]"><SelectValue placeholder="Select slot…" /></SelectTrigger>
                <SelectContent>
                  {slotsForDate.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.slottime} · {s.slottext} {s.duty_title ? `(${s.duty_title})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {selectedSlot && (
            <div className="ml-auto text-right text-xs text-muted-foreground">
              <div><Clock className="inline h-3 w-3" /> {selectedSlot.slottime}</div>
              <div><CalendarRange className="inline h-3 w-3" /> {new Date(selectedSlot.slotdate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
              {selectedSlot.duty_title && <div>{selectedSlot.duty_title} · {selectedSlot.academicsession}</div>}
            </div>
          )}
        </CardContent>
      </Card>

      {!slotId ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <CalendarRange className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">Pick a slot</p>
              <p className="text-sm text-muted-foreground">Choose a date and slot above to start marking attendance.</p>
            </div>
          </CardContent>
        </Card>
      ) : loadingAttendance || !attendance ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="flex items-center gap-3 p-4 text-sm">
              <Badge variant="default"><Users2 className="h-3 w-3" /> {totalFilled} marked present</Badge>
              <span className="text-muted-foreground">across {attendance.rooms.length} room{attendance.rooms.length === 1 ? '' : 's'}</span>
            </CardContent>
          </Card>

          {attendance.rooms.length === 0 ? (
            <Alert variant="info">No rooms are configured yet. Add rooms first.</Alert>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {attendance.rooms.map(({ room, seats }) => {
                const seatCount = Math.max(MIN_SEATS, room.need || 0);
                const filled = Object.keys(seats).length;
                return (
                  <Card key={room.id} className="overflow-hidden">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2 border-b pb-3">
                        <div>
                          <div className="flex items-center gap-2 font-display text-base font-semibold">
                            <DoorOpen className="h-4 w-4 text-primary" /> {room.name}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {filled}/{seatCount} seats filled{room.need ? ` · needs ${room.need}` : ''}
                          </p>
                        </div>
                        <Badge variant={filled >= (room.need || MIN_SEATS) ? 'success' : 'secondary'}>
                          {filled} present
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {Array.from({ length: seatCount }).map((_, seatIndex) => {
                          const entry = seats[seatIndex] || null;
                          const key = `${room.id}:${seatIndex}`;
                          return (
                            <div key={seatIndex} className="flex items-center gap-2">
                              <span className="w-6 shrink-0 text-center text-xs font-semibold text-muted-foreground">
                                {seatIndex + 1}
                              </span>
                              <UserPicker
                                className="flex-1"
                                value={entry ? {
                                  id: entry.user_id,
                                  name: entry.name,
                                  role: entry.role,
                                  employeeid: entry.employeeid,
                                  department: entry.department,
                                } : null}
                                onPick={(u) => saveSeat(room.id, seatIndex, u)}
                                status={seatStatus[key] || 'idle'}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
