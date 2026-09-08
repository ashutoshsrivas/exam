'use client';

import { useState } from 'react';
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const data = await api<{ message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: current, new_password: pw, confirm_password: confirm }),
      });
      setMessage({ text: data.message, type: 'success' });
      setCurrent(''); setPw(''); setConfirm('');
    } catch (e) {
      setMessage({ text: (e as Error).message, type: 'error' });
    } finally { setLoading(false); }
  }

  const initials = (user?.name || 'U')
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and security.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-primary to-info text-2xl font-semibold text-primary-foreground shadow-md ring-4 ring-white">
              {initials}
            </div>
            <div>
              <div className="font-display text-lg font-semibold">{user?.name}</div>
              <div className="text-sm text-muted-foreground">{user?.role}</div>
            </div>
            <dl className="w-full space-y-1 border-t pt-4 text-left text-sm">
              {user?.employeeid && (
                <div className="flex justify-between"><dt className="text-muted-foreground">Employee ID</dt><dd className="font-medium">{user.employeeid}</dd></div>
              )}
              {user?.email && (
                <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Email</dt><dd className="truncate font-medium">{user.email}</dd></div>
              )}
              {user?.phone && (
                <div className="flex justify-between"><dt className="text-muted-foreground">Phone</dt><dd className="font-medium">{user.phone}</dd></div>
              )}
              {user?.department && (
                <div className="flex justify-between"><dt className="text-muted-foreground">Dept</dt><dd className="font-medium">{user.department}</dd></div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Password card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <CardTitle className="font-display">Change password</CardTitle>
            </div>
            <CardDescription>Use at least 6 characters. We&apos;ll keep you signed in.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              {message && <Alert variant={message.type === 'success' ? 'success' : 'destructive'}>{message.text}</Alert>}
              <div className="space-y-1.5">
                <Label>Current password</Label>
                <Input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>New password</Label>
                  <Input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm new password</Label>
                  <Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Stored with bcrypt
                </p>
                <Button type="submit" disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : 'Update password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
