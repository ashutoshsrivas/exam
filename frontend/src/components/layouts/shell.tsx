'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, LogOut, Menu, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';

export type NavItem = { href: string; label: string; icon: LucideIcon };

function Avatar({ name }: { name?: string | null }) {
  const initials = (name || 'U')
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-info text-sm font-semibold text-primary-foreground shadow-sm ring-2 ring-white">
      {initials}
    </div>
  );
}

export function Shell({
  navItems,
  title,
  subtitle,
  topRight,
  children,
}: {
  navItems: NavItem[];
  title: string;
  subtitle: string;
  topRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '';
  const { user, logout } = useAuth();
  const [open, setOpen] = React.useState(false);

  // Close mobile sidebar on route change
  React.useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="min-h-screen">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-white/80 backdrop-blur-md transition-transform duration-200 ease-out md:translate-x-0',
          open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-info text-primary-foreground shadow-sm">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-base font-semibold tracking-tight">ExamPanel</div>
              <div className="text-[11px] text-muted-foreground">{subtitle}</div>
            </div>
          </Link>
          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-3 my-3 flex items-center gap-3 rounded-xl border bg-secondary/40 p-3">
          <Avatar name={user?.name} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user?.name || 'User'}</div>
            <div className="truncate text-xs text-muted-foreground">{user?.role}</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 pb-3">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground/70 hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className={cn('h-4 w-4 transition-transform group-hover:scale-110', active && 'text-primary-foreground')} />
                <span>{item.label}</span>
                {active && <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary-foreground/80" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={logout}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/70 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
          </div>
          <div className="flex items-center gap-2">{topRight}</div>
        </header>
        <main key={pathname} className="page-enter mx-auto max-w-7xl space-y-6 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
