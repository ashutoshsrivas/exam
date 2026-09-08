'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthUser, clearAuth, getStoredUser, getToken } from '@/lib/api';

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => void;
};

const Ctx = React.createContext<AuthCtx>({ user: null, loading: true, isAdmin: false, logout: () => {} });

export function AuthProvider({ children, requireRole }: { children: React.ReactNode; requireRole?: 'admin' | 'user' }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const t = getToken();
    const u = getStoredUser();
    if (!t || !u) {
      setLoading(false);
      if (!pathname?.startsWith('/login')) router.replace('/login');
      return;
    }
    setUser(u);
    setLoading(false);
    const isAdmin = String(u.role).toLowerCase() === 'admin';
    if (requireRole === 'admin' && !isAdmin) router.replace('/dashboard');
    if (requireRole === 'user' && isAdmin) router.replace('/admin/dashboard');
  }, [router, pathname, requireRole]);

  const isAdmin = !!user && String(user.role).toLowerCase() === 'admin';

  const logout = React.useCallback(() => {
    clearAuth();
    router.replace('/login');
  }, [router]);

  return <Ctx.Provider value={{ user, loading, isAdmin, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return React.useContext(Ctx);
}
