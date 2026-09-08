'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, ShieldCheck, Sparkles, ArrowRight, Loader2, FileDown } from 'lucide-react';
import { api, setAuth, AuthUser } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';

const HIGHLIGHTS = [
  { icon: ShieldCheck, text: 'Role-based limits enforce fair distribution' },
  { icon: Sparkles, text: 'Auto-generate dozens of slots in one click' },
  { icon: FileDown, text: "CSV exports ready for the controller's office" },
];

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api<{ token: string; user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      setAuth(data.token, data.user);
      if (String(data.user.role).toLowerCase() === 'admin') router.replace('/admin/dashboard');
      else router.replace('/dashboard');
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden p-10 text-white md:flex grain">
        <div className="relative z-10 flex items-center gap-3 animate-fade-up">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 backdrop-blur ring-1 ring-white/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="font-display text-xl font-bold tracking-tight">ExamPanel</div>
            <div className="text-xs text-white/70">Invigilation Duty Management</div>
          </div>
        </div>

        <div className="relative z-10 space-y-6 animate-fade-up" style={{ animationDelay: '120ms' }}>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight">
            Streamline exam duty<br />assignment for your faculty.
          </h1>
          <p className="max-w-md text-white/70">
            Publish duties, let faculty pick their slots within their role&apos;s limit,
            and export attendance reports — without the spreadsheet shuffle.
          </p>
          <ul className="space-y-3 text-sm text-white/85">
            {HIGHLIGHTS.map(({ icon: Icon, text }, i) => (
              <li
                key={i}
                className="flex items-center gap-3 animate-fade-up"
                style={{ animationDelay: `${200 + i * 70}ms` }}
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-xs text-white/50">
          © {new Date().getFullYear()} ExamPanel · Built for academic departments
        </div>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="font-display text-lg font-semibold">ExamPanel</div>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in with your name, email, or employee ID.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {error && <Alert variant="destructive">{error}</Alert>}
            <div className="space-y-1.5">
              <Label htmlFor="identifier">Email or Employee ID</Label>
              <Input
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
                placeholder="you@example.com or E12345"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="group w-full" size="lg" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
              ) : (
                <>Sign in <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Trouble signing in? Contact your administrator.
          </p>
        </div>
      </main>
    </div>
  );
}
