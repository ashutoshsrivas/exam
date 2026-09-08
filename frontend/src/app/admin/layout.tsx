'use client';

import { BarChart3, Briefcase, CalendarRange, ClipboardCheck, DoorOpen, LayoutDashboard, MapPin, Users, Users2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/components/auth-provider';
import { Shell, type NavItem } from '@/components/layouts/shell';

const NAV: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/cohorts', label: 'Cohorts', icon: Users2 },
  { href: '/admin/duties', label: 'Duties', icon: Briefcase },
  { href: '/admin/rooms', label: 'Rooms', icon: DoorOpen },
  { href: '/admin/slots', label: 'Slots', icon: CalendarRange },
  { href: '/admin/allocations', label: 'Allocations', icon: MapPin },
  { href: '/admin/attendance', label: 'Attendance', icon: ClipboardCheck },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

function Inner({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  if (loading || !user) return null;
  return (
    <Shell navItems={NAV} title="Admin Console" subtitle="Administration">
      {children}
    </Shell>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider requireRole="admin">
      <Inner>{children}</Inner>
    </AuthProvider>
  );
}
