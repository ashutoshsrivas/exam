'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, getToken } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const user = getStoredUser();
    if (!getToken() || !user) return router.replace('/login');
    if (String(user.role).toLowerCase() === 'admin') router.replace('/admin/dashboard');
    else router.replace('/dashboard');
  }, [router]);
  return null;
}
