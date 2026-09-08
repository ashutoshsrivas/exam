'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Briefcase, Loader2, Lock, Plus, Trash2, Users2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Cohort = {
  id: number;
  name: string;
  description: string | null;
  createdat: string;
  member_count: number;
  duty_count: number;
  system_default: number;
};

export default function CohortsPage() {
  const router = useRouter();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', add_all_users: false });
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api<{ cohorts: Cohort[] }>('/api/cohorts');
      setCohorts(data.cohorts);
    } catch (e) {
      setMessage({ text: (e as Error).message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createCohort(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setCreating(true);
    try {
      const data = await api<{ id: number }>('/api/cohorts', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setAddOpen(false);
      setForm({ name: '', description: '', add_all_users: false });
      router.push(`/admin/cohorts/${data.id}`);
    } catch (e) {
      setMessage({ text: (e as Error).message, type: 'error' });
    } finally {
      setCreating(false);
    }
  }

  async function remove(c: Cohort) {
    if (!confirm(`Delete cohort "${c.name}"?\n\nDuties currently assigned to it will become invisible to faculty until you reassign them to another cohort.`)) return;
    try {
      await api(`/api/cohorts/${c.id}`, { method: 'DELETE' });
      setMessage({ text: 'Cohort deleted.', type: 'success' });
      await load();
    } catch (e) {
      setMessage({ text: (e as Error).message, type: 'error' });
    }
  }

  return (
    <>
      {message && <Alert variant={message.type === 'success' ? 'success' : 'destructive'}>{message.text}</Alert>}

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Cohorts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Group faculty so each duty reaches exactly the right audience.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> New cohort</Button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : cohorts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <Users2 className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">No cohorts yet</p>
              <p className="text-sm text-muted-foreground">Create one to start targeting duties.</p>
            </div>
            <Button className="mt-2" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> New cohort</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cohorts.map((c) => (
            <article
              key={c.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border bg-white p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br from-primary/15 to-transparent opacity-70 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-start justify-between gap-2">
                <Link href={`/admin/cohorts/${c.id}`} className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Users2 className="h-5 w-5" />
                </Link>
                {c.system_default ? (
                  <Badge
                    variant="secondary"
                    className="inline-flex items-center gap-1 border"
                    title="The default cohort cannot be deleted; every new user is added to it automatically."
                  >
                    <Lock className="h-3 w-3" /> Default
                  </Badge>
                ) : (
                  <Button
                    variant="ghost" size="sm"
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => remove(c)}
                    aria-label={`Delete ${c.name}`}
                    title="Delete cohort"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Link href={`/admin/cohorts/${c.id}`} className="relative mt-3 block">
                <h3 className="font-display text-lg font-semibold leading-snug">{c.name}</h3>
                {c.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                )}
              </Link>
              <div className="relative mt-4 flex items-center gap-3 border-t pt-3 text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Users2 className="h-3.5 w-3.5" />
                  <span className="font-semibold text-foreground tabular-nums">{c.member_count}</span> members
                </span>
                <span className="text-border">·</span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span className="font-semibold text-foreground tabular-nums">{c.duty_count}</span> duties
                </span>
              </div>
              <Link
                href={`/admin/cohorts/${c.id}`}
                className="relative mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
              >
                Manage members <ArrowRight className="h-3 w-3" />
              </Link>
            </article>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create new cohort</DialogTitle></DialogHeader>
          <form onSubmit={createCohort} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cohort-name">Name</Label>
              <Input
                id="cohort-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Bioscience Faculty"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cohort-desc">Description (optional)</Label>
              <Input
                id="cohort-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short note about this group"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-secondary/30 p-3 text-sm">
              <Checkbox
                checked={form.add_all_users}
                onCheckedChange={(v) => setForm({ ...form, add_all_users: v === true })}
              />
              <div>
                <div className="font-medium">Add all existing users now</div>
                <div className="text-xs text-muted-foreground">
                  Every current faculty user becomes a member. You can refine the list afterwards.
                </div>
              </div>
            </label>
            <DialogFooter>
              <Button type="submit" disabled={creating || !form.name.trim()}>
                {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : 'Create cohort'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
