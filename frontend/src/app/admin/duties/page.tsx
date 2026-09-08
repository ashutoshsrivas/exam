'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Lock, LockOpen, Pencil, Plus, Trash2, Users2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

type Duty = {
  id: number;
  title: string;
  academicsession: string;
  type: string;
  professor: number;
  assistantprofessor: number;
  associateprofessor: number;
  researchscholar: number;
  specialrole1: number;
  specialrole2: number;
  specialrole3: number;
  specialrole4: number;
  accepting_bookings: number;
  createdat: string;
  cohort_id: number | null;
  cohort_name: string | null;
};
type CohortOption = { id: number; name: string; member_count: number };

const EMPTY = {
  title: '', academicsession: '', type: '',
  professor: 0, assistant: 0, associate: 0, research: 0,
  special1: 0, special2: 0, special3: 0, special4: 0,
  cohort_id: '' as string | number,
};

export default function DutiesPage() {
  const [duties, setDuties] = useState<Duty[]>([]);
  const [cohorts, setCohorts] = useState<CohortOption[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Duty | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  async function load() {
    const [d, c] = await Promise.all([
      api<{ duties: Duty[] }>('/api/duties'),
      api<{ cohorts: CohortOption[] }>('/api/cohorts'),
    ]);
    setDuties(d.duties);
    setCohorts(c.cohorts);
  }

  useEffect(() => { load().catch((e) => setMessage({ text: e.message, type: 'error' })); }, []);

  function openAdd() { setForm({ ...EMPTY }); setAddOpen(true); }
  function openEdit(d: Duty) {
    setForm({
      title: d.title, academicsession: d.academicsession, type: d.type,
      professor: d.professor, assistant: d.assistantprofessor, associate: d.associateprofessor,
      research: d.researchscholar, special1: d.specialrole1, special2: d.specialrole2,
      special3: d.specialrole3, special4: d.specialrole4,
      cohort_id: d.cohort_id ?? '',
    });
    setEditing(d);
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/api/duties', { method: 'POST', body: JSON.stringify(form) });
      setMessage({ text: 'Duty added successfully.', type: 'success' });
      setAddOpen(false);
      await load();
    } catch (e) { setMessage({ text: (e as Error).message, type: 'error' }); }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      await api(`/api/duties/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      setMessage({ text: 'Duty updated successfully.', type: 'success' });
      setEditing(null);
      await load();
    } catch (e) { setMessage({ text: (e as Error).message, type: 'error' }); }
  }

  async function remove(d: Duty) {
    if (!confirm('Are you sure you want to delete this duty?')) return;
    try {
      await api(`/api/duties/${d.id}`, { method: 'DELETE' });
      setMessage({ text: 'Duty deleted successfully.', type: 'success' });
      await load();
    } catch (e) { setMessage({ text: (e as Error).message, type: 'error' }); }
  }

  async function toggle(d: Duty) {
    try {
      await api(`/api/duties/${d.id}/booking-status`, {
        method: 'PATCH',
        body: JSON.stringify({ accepting_bookings: !d.accepting_bookings }),
      });
      setMessage({ text: `Booking status ${d.accepting_bookings ? 'closed' : 'opened'} successfully.`, type: 'success' });
      await load();
    } catch (e) { setMessage({ text: (e as Error).message, type: 'error' }); }
  }

  return (
    <>
      {message && <Alert variant={message.type === 'success' ? 'success' : 'destructive'}>{message.text}</Alert>}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Duty management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {duties.length} dut{duties.length === 1 ? 'y' : 'ies'} configured.
          </p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add duty</Button>
      </header>
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead className="w-12">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Cohort</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {duties.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">#{d.id}</TableCell>
                <TableCell className="font-medium">{d.title}</TableCell>
                <TableCell className="text-muted-foreground">{d.academicsession}</TableCell>
                <TableCell className="text-muted-foreground">{d.type}</TableCell>
                <TableCell>
                  {d.cohort_id ? (
                    <Link href={`/admin/cohorts/${d.cohort_id}`}>
                      <Badge variant="secondary" className="cursor-pointer">
                        <Users2 className="h-3 w-3" /> {d.cohort_name}
                      </Badge>
                    </Link>
                  ) : (
                    <Badge variant="destructive" title="No cohort — duty is hidden from faculty">
                      <AlertCircle className="h-3 w-3" /> None
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {d.accepting_bookings
                    ? <Badge variant="success">Open</Badge>
                    : <Badge variant="destructive">Closed</Badge>}
                </TableCell>
                <TableCell className="text-muted-foreground">{d.createdat ? new Date(d.createdat).toLocaleDateString() : ''}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(d)} title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => toggle(d)} title={d.accepting_bookings ? 'Close bookings' : 'Open bookings'}>
                      {d.accepting_bookings ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(d)} title="Delete" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Duty</DialogTitle></DialogHeader>
          <DutyForm form={form} setForm={setForm} cohorts={cohorts} onSubmit={submitAdd} submitLabel="Add Duty" />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Duty</DialogTitle></DialogHeader>
          <DutyForm form={form} setForm={setForm} cohorts={cohorts} onSubmit={submitEdit} submitLabel="Update Duty" />
        </DialogContent>
      </Dialog>
    </>
  );
}

function DutyForm({
  form, setForm, cohorts, onSubmit, submitLabel,
}: {
  form: typeof EMPTY;
  setForm: (f: typeof EMPTY) => void;
  cohorts: CohortOption[];
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}) {
  const setStr = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  const setNum = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: Number(e.target.value) });
  const limits: [keyof typeof EMPTY, string][] = [
    ['professor', 'Professor'], ['assistant', 'Assistant Professor'], ['associate', 'Associate Professor'],
    ['research', 'Research Scholar'], ['special1', 'Special Role 1'], ['special2', 'Special Role 2'],
    ['special3', 'Special Role 3'], ['special4', 'Special Role 4'],
  ];
  const cohortValue = form.cohort_id === '' || form.cohort_id === null || form.cohort_id === undefined ? 'none' : String(form.cohort_id);
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1"><Label>Title</Label><Input required value={form.title} onChange={setStr('title')} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label>Academic Session</Label><Input required value={form.academicsession} onChange={setStr('academicsession')} /></div>
        <div className="space-y-1"><Label>Type</Label><Input required value={form.type} onChange={setStr('type')} /></div>
      </div>
      <div className="space-y-1">
        <Label>Cohort</Label>
        <Select
          value={cohortValue}
          onValueChange={(v) => setForm({ ...form, cohort_id: v === 'none' ? '' : Number(v) })}
        >
          <SelectTrigger><SelectValue placeholder="Select cohort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— No cohort (hidden from faculty)</SelectItem>
            {cohorts.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name} · {c.member_count} member{c.member_count === 1 ? '' : 's'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Only members of the selected cohort will see this duty. Leave as “No cohort” to hide it from everyone.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {limits.filter(([k]) => k !== 'cohort_id').map(([k, label]) => (
          <div key={k} className="space-y-1">
            <Label>{label} Limit</Label>
            <Input type="number" min={0} required value={form[k] as number} onChange={setNum(k)} />
          </div>
        ))}
      </div>
      <DialogFooter><Button type="submit">{submitLabel}</Button></DialogFooter>
    </form>
  );
}
