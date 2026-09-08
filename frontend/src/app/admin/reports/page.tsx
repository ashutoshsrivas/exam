'use client';

import { useEffect, useState } from 'react';
import { api, apiDownload } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Duty = { id: number; title: string; academicsession: string };
type Slot = { id: number; slottext: string; slotdate: string; slottime: string };

export default function ReportsPage() {
  const [duties, setDuties] = useState<Duty[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [duty, setDuty] = useState('');
  const [slot, setSlot] = useState('');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'users' | 'slotwise' | 'userwise' | ''>('');
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => { api<{ duties: Duty[] }>('/api/duties').then((d) => setDuties(d.duties)).catch((e) => setError((e as Error).message)); }, []);

  useEffect(() => {
    if (!duty) { setSlots([]); return; }
    api<{ slots: Slot[] }>(`/api/slots?duty=${duty}`).then((d) => setSlots(d.slots)).catch((e) => setError((e as Error).message));
  }, [duty]);

  async function run(type: string, withSlot = false) {
    setError(''); setRows([]); setTitle(''); setKind('');
    if (!duty) return setError('Select a duty.');
    if (withSlot && !slot) return setError('Select a slot.');
    try {
      const url = `/api/reports?type=${type}&duty=${duty}${withSlot ? `&slot=${slot}` : ''}`;
      const data = await api<{ kind: any; rows: any[] }>(url);
      setKind(data.kind);
      setRows(data.rows);
      setTitle(reportTitle(type, duty, slot));
    } catch (e) { setError((e as Error).message); }
  }

  function download(type: string, withSlot = false) {
    if (!duty) return setError('Select a duty.');
    if (withSlot && !slot) return setError('Select a slot.');
    const url = `/api/reports?type=${type}&duty=${duty}${withSlot ? `&slot=${slot}` : ''}&csv=1`;
    const filename = filenameFor(type, duty, slot);
    apiDownload(url, filename).catch((e) => setError((e as Error).message));
  }

  return (
    <>
      {error && <Alert variant="destructive">{error}</Alert>}

      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Run on-screen reports or download CSV exports.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Duty reports</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={duty} onValueChange={(v) => { setDuty(v); setSlot(''); }}>
              <SelectTrigger><SelectValue placeholder="-- Select Duty --" /></SelectTrigger>
              <SelectContent>{duties.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.title} ({d.academicsession})</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              <Button disabled={!duty} onClick={() => run('duty_opted')}>View Users Opted</Button>
              <Button variant="outline" disabled={!duty} onClick={() => download('duty_opted')}>Download Opted CSV</Button>
              <Button disabled={!duty} onClick={() => run('duty_not_opted')}>View Users NOT Opted</Button>
              <Button variant="outline" disabled={!duty} onClick={() => download('duty_not_opted')}>Download NOT Opted CSV</Button>
              <Button variant="outline" disabled={!duty} onClick={() => download('duty_slotwise')}>Download Slotwise List</Button>
              <Button variant="outline" disabled={!duty} onClick={() => download('duty_userwise')}>Download Userwise List</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Slot reports</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={slot} onValueChange={setSlot} disabled={!duty}>
              <SelectTrigger><SelectValue placeholder="-- Select Slot --" /></SelectTrigger>
              <SelectContent>{slots.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.slottext} ({s.slotdate} {s.slottime})</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              <Button disabled={!slot} onClick={() => run('slot_attendees', true)}>View Slot Attendees</Button>
              <Button variant="outline" disabled={!slot} onClick={() => download('slot_attendees', true)}>Download Slot CSV</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {title && (
        <Card>
          <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <Alert variant="info">No records found for this report.</Alert>
            ) : (
              <ResultsTable kind={kind} rows={rows} />
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}

function ResultsTable({ kind, rows }: { kind: string; rows: any[] }) {
  if (kind === 'slotwise') {
    return (
      <Table>
        <TableHeader><TableRow>
          <TableHead>Slot ID</TableHead><TableHead>Slot</TableHead><TableHead>Date</TableHead><TableHead>Time</TableHead>
          <TableHead>User ID</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>
          <TableHead>Dept</TableHead><TableHead>Emp ID</TableHead><TableHead>Role</TableHead>
        </TableRow></TableHeader>
        <TableBody>{rows.map((r, i) => (
          <TableRow key={i}>
            <TableCell>{r.slot_id}</TableCell><TableCell>{r.slottext}</TableCell><TableCell>{r.slotdate}</TableCell><TableCell>{r.slottime}</TableCell>
            <TableCell>{r.user_id ?? ''}</TableCell><TableCell>{r.name ?? ''}</TableCell><TableCell>{r.email ?? ''}</TableCell>
            <TableCell>{r.phone ?? ''}</TableCell><TableCell>{r.department ?? ''}</TableCell><TableCell>{r.employeeid ?? ''}</TableCell><TableCell>{r.role ?? ''}</TableCell>
          </TableRow>
        ))}</TableBody>
      </Table>
    );
  }
  if (kind === 'userwise') {
    return (
      <Table>
        <TableHeader><TableRow>
          <TableHead>User ID</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>
          <TableHead>Dept</TableHead><TableHead>Emp ID</TableHead><TableHead>Role</TableHead>
          <TableHead>Slot ID</TableHead><TableHead>Slot</TableHead><TableHead>Date</TableHead><TableHead>Time</TableHead>
        </TableRow></TableHeader>
        <TableBody>{rows.map((r, i) => (
          <TableRow key={i}>
            <TableCell>{r.user_id}</TableCell><TableCell>{r.name}</TableCell><TableCell>{r.email}</TableCell><TableCell>{r.phone ?? ''}</TableCell>
            <TableCell>{r.department ?? ''}</TableCell><TableCell>{r.employeeid}</TableCell><TableCell>{r.role}</TableCell>
            <TableCell>{r.slot_id}</TableCell><TableCell>{r.slottext}</TableCell><TableCell>{r.slotdate}</TableCell><TableCell>{r.slottime}</TableCell>
          </TableRow>
        ))}</TableBody>
      </Table>
    );
  }
  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>
        <TableHead>Dept</TableHead><TableHead>Emp ID</TableHead><TableHead>Role</TableHead>
      </TableRow></TableHeader>
      <TableBody>{rows.map((r, i) => (
        <TableRow key={i}>
          <TableCell>{r.id}</TableCell><TableCell>{r.name}</TableCell><TableCell>{r.email}</TableCell>
          <TableCell>{r.phone ?? ''}</TableCell><TableCell>{r.department ?? ''}</TableCell><TableCell>{r.employeeid}</TableCell><TableCell>{r.role}</TableCell>
        </TableRow>
      ))}</TableBody>
    </Table>
  );
}

function reportTitle(type: string, duty: string, slot: string) {
  if (type === 'slot_attendees') return `Attendees for slot ID ${slot}`;
  if (type === 'duty_opted') return `Users who opted any slot for duty ID ${duty}`;
  if (type === 'duty_not_opted') return `Users who DID NOT opt any slot for duty ID ${duty}`;
  if (type === 'duty_slotwise') return `Slotwise list for duty ID ${duty}`;
  if (type === 'duty_userwise') return `Userwise list for duty ID ${duty}`;
  return '';
}

function filenameFor(type: string, duty: string, slot: string) {
  if (type === 'slot_attendees') return `slot_${slot}_attendees.csv`;
  if (type === 'duty_opted') return `duty_${duty}_opted.csv`;
  if (type === 'duty_not_opted') return `duty_${duty}_not_opted.csv`;
  if (type === 'duty_slotwise') return `duty_${duty}_slotwise.csv`;
  return `duty_${duty}_userwise.csv`;
}
