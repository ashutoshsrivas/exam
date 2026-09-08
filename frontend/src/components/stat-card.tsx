'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  href,
  tone = 'primary',
  className,
}: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  icon: LucideIcon;
  href?: string;
  tone?: 'primary' | 'success' | 'warning' | 'info';
  className?: string;
}) {
  const tones: Record<string, string> = {
    primary: 'from-primary/15 to-primary/0 text-primary',
    success: 'from-emerald-500/15 to-emerald-500/0 text-emerald-700',
    warning: 'from-amber-500/15 to-amber-500/0 text-amber-700',
    info: 'from-sky-500/15 to-sky-500/0 text-sky-700',
  };

  const inner = (
    <div className={cn(
      'group relative overflow-hidden rounded-xl border bg-white p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift',
      className,
    )}>
      <div className={cn('pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br opacity-70 blur-2xl transition-opacity group-hover:opacity-100', tones[tone])} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</p>
          {delta && <p className="mt-1 text-xs text-muted-foreground">{delta}</p>}
        </div>
        <div className={cn('grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br shadow-sm ring-1 ring-inset ring-black/5', tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {href && (
        <div className="relative mt-3 inline-flex items-center text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          View <ArrowUpRight className="ml-1 h-3 w-3" />
        </div>
      )}
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
