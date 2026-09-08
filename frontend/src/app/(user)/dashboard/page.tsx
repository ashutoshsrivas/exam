'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarRange, Clock, GraduationCap, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

type Duty = {
  id: number; title: string; academicsession: string; type: string; createdat: string; slot_count: number;
  professor: number; assistantprofessor: number; associateprofessor: number; researchscholar: number;
  specialrole1: number; specialrole2: number; specialrole3: number; specialrole4: number;
};

const ROLE_LIMIT_COLUMN: Record<string, keyof Duty> = {
  'Professor': 'professor', 'Assistant Professor': 'assistantprofessor', 'Associate Professor': 'associateprofessor',
  'Research Scholar': 'researchscholar', 'Special Role 1': 'specialrole1', 'Special Role 2': 'specialrole2',
  'Special Role 3': 'specialrole3', 'Special Role 4': 'specialrole4',
};

export default function UserDashboard() {
  const { user } = useAuth();
  const [duties, setDuties] = useState<Duty[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ duties: Duty[] }>('/api/duties?accepting=1')
      .then((d) => setDuties(d.duties))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  // null when the role has no quota column — those users see a limit of 0,
  // matching what the server will enforce, instead of the Research Scholar one.
  const limitColFor = (role: string) =>
    ROLE_LIMIT_COLUMN[role] || ROLE_LIMIT_COLUMN[(role || '').replace(/\b\w/g, (c) => c.toUpperCase())] || null;
  const myCol = user ? limitColFor(user.role) : null;

  return (
    <>
      <header>
        <p className="text-sm font-medium text-primary">Hello, {user?.name?.split(' ')[0] || 'Faculty'}</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Available duties</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick exam slots for any open duty. Your selection is locked once saved.
        </p>
      </header>

      {error && <Alert variant="destructive">{error}</Alert>}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : duties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <CalendarRange className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">No duties available</p>
              <p className="text-sm text-muted-foreground">Check back once your admin opens a new exam.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {duties.map((d) => {
            const limit = myCol ? Math.max(0, Number(d[myCol]) || 0) : 0;
            return (
              <Link key={d.id} href={`/duties/${d.id}/slots`} className="group">
                <article className="relative flex h-full flex-col overflow-hidden rounded-xl border bg-white p-5 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
                  <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br from-primary/20 to-transparent opacity-70 blur-2xl transition-opacity group-hover:opacity-100" />
                  <div className="relative flex items-start justify-between gap-2">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <Badge variant="success">Accepting</Badge>
                  </div>
                  <h3 className="relative mt-4 line-clamp-2 font-display text-lg font-semibold leading-snug">
                    {d.title}
                  </h3>
                  <div className="relative mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{d.academicsession}</span>
                    <span aria-hidden>•</span>
                    <span>{d.type}</span>
                  </div>
                  <div className="relative mt-5 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Slots</div>
                      <div className="font-display text-lg font-semibold tabular-nums">{d.slot_count}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Your limit</div>
                      <div className="font-display text-lg font-semibold tabular-nums">{limit}</div>
                    </div>
                  </div>
                  <div className="relative mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {d.createdat ? new Date(d.createdat).toLocaleDateString() : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      View slots <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
