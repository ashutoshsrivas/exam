'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Briefcase, CalendarRange, CheckCircle2, DoorOpen, Users, type LucideIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Stats = { users: number; duties: number; duties_open: number; slots: number; preferences: number; rooms: number };

const ACTIONS = [
  { href: '/admin/duties', icon: Briefcase, title: 'Create a duty', desc: 'Set up a new exam with role-based quotas.' },
  { href: '/admin/slots', icon: CalendarRange, title: 'Add slots', desc: 'Add individual slots or auto-generate by date.' },
  { href: '/admin/users', icon: Users, title: 'Manage faculty', desc: 'Onboard, edit, or remove users.' },
  { href: '/admin/reports', icon: BarChart3, title: 'Export reports', desc: 'Download attendance and assignment CSVs.' },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api<Stats>('/api/stats').then(setStats).catch(() => setStats(null));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <header>
        <p className="text-sm font-medium text-primary">{greeting}</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Welcome back, {user?.name?.split(' ')[0] || 'Admin'}.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Here&apos;s a snapshot of the system today.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats?.users ?? '—'} icon={Users} href="/admin/users" tone="primary" />
        <StatCard
          label="Active Duties"
          value={stats ? `${stats.duties_open}/${stats.duties}` : '—'}
          delta={stats ? `${stats.duties_open} accepting bookings` : undefined}
          icon={Briefcase}
          href="/admin/duties"
          tone="info"
        />
        <StatCard label="Total Slots" value={stats?.slots ?? '—'} icon={CalendarRange} href="/admin/slots" tone="success" />
        <StatCard label="Total Bookings" value={stats?.preferences ?? '—'} icon={CheckCircle2} href="/admin/reports" tone="warning" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="surface surface-hover lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">Quick actions</CardTitle>
            <CardDescription>Common workflows for managing exam duties.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {ACTIONS.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="group flex items-start gap-3 rounded-lg border bg-white/60 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent hover:shadow-md"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <a.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{a.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="surface">
          <CardHeader>
            <CardTitle className="font-display">System</CardTitle>
            <CardDescription>Live counts from the database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row icon={Users} label="Faculty users" value={stats?.users ?? '—'} />
            <Row icon={Briefcase} label="Duties" value={stats?.duties ?? '—'} />
            <Row icon={CalendarRange} label="Slots" value={stats?.slots ?? '—'} />
            <Row icon={DoorOpen} label="Rooms" value={stats?.rooms ?? '—'} />
            <Row icon={CheckCircle2} label="Slot bookings" value={stats?.preferences ?? '—'} />
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function Row({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-accent">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
