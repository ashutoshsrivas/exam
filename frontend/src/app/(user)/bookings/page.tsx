'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookmarkCheck, Calendar, Clock, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';

type SelectedSlot = { id: number; slottext: string; slottime: string; slotdate: string };
type Booking = {
  id: number; title: string; academicsession: string; type: string;
  accepting_bookings: number; createdat: string; selected_slots: SelectedSlot[];
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ bookings: Booking[] }>('/api/preferences/mine')
      .then((d) => setBookings(d.bookings))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const totalSlots = bookings.reduce((acc, b) => acc + b.selected_slots.length, 0);

  return (
    <>
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">My slots</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalSlots} slot{totalSlots === 1 ? '' : 's'} booked across {bookings.length} dut{bookings.length === 1 ? 'y' : 'ies'}.
        </p>
      </header>

      {error && <Alert variant="destructive">{error}</Alert>}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <BookmarkCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">No slots selected yet</p>
              <p className="text-sm text-muted-foreground">Browse open duties to make your first selection.</p>
            </div>
            <Button asChild className="mt-2"><Link href="/dashboard">Browse duties</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {bookings.map((b) => (
            <Card key={b.id} className="surface surface-hover">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-semibold">{b.title}</h3>
                      <Badge variant={b.accepting_bookings ? 'success' : 'destructive'}>
                        {b.accepting_bookings ? 'Open' : 'Closed'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{b.academicsession} · {b.type}</p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/duties/${b.id}/slots`}>
                      Details <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {b.selected_slots.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 rounded-lg border bg-gradient-to-br from-primary/5 to-transparent px-4 py-3 transition-colors hover:border-primary/30"
                    >
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{s.slottext}</div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {s.slotdate} at {s.slottime}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
