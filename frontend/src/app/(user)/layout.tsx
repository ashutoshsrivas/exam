'use client';

import { BookmarkCheck, LayoutDashboard, UserCircle2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/components/auth-provider';
import { Shell, type NavItem } from '@/components/layouts/shell';

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/bookings', label: 'My Slots', icon: BookmarkCheck },
  { href: '/profile', label: 'Profile', icon: UserCircle2 },
];

function Inner({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  if (loading || !user) return null;
  return (
    <Shell navItems={NAV} title="ExamPanel" subtitle="User workspace">
      {children}
    </Shell>
  );
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider requireRole="user">
      <Inner>{children}</Inner>
    </AuthProvider>
  );
}
