'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Briefcase, Download, FileSpreadsheet, Loader2, Plus, Search, Trash2,
  UploadCloud, UserMinus, UserPlus, Users2, X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Member = {
  id: number;
  employeeid: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  department: string | null;
};
type CohortDetail = {
  cohort: { id: number; name: string; description: string | null; createdat: string };
  members: Member[];
  duties: { id: number; title: string; academicsession: string; type: string; accepting_bookings: number }[];
};
type AnyUser = Member;

const ROLES = [
  'Assistant Professor', 'Associate Professor', 'Professor',
  'Research Scholar', 'Special Role 1', 'Special Role 2', 'Special Role 3', 'Special Role 4', 'Admin',
];

const SAMPLE_HEADERS = ['employeeid', 'name', 'email', 'phone', 'role', 'department', 'password'];

export default function CohortDetailPage() {
  const params = useParams<{ id: string }>();
  const cohortId = Number(params?.id);
  const router = useRouter();

  const [data, setData] = useState<CohortDetail | null>(null);
  const [allUsers, setAllUsers] = useState<AnyUser[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [search, setSearch] = useState('');

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSelected, setPickerSelected] = useState<Set<number>>(new Set());
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerBusy, setPickerBusy] = useState(false);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualBusy, setManualBusy] = useState(false);
  const [manualRows, setManualRows] = useState<Array<Record<string, string>>>([emptyManualRow()]);

  const [importOpen, setImportOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<Array<Record<string, string>> | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const reload = useCallback(async () => {
    try {
      const d = await api<CohortDetail>(`/api/cohorts/${cohortId}`);
      setData(d);
    } catch (e) {
      setMessage({ text: (e as Error).message, type: 'error' });
    }
  }, [cohortId]);

  useEffect(() => {
    if (!cohortId) return;
    reload();
    api<{ users: AnyUser[] }>('/api/users')
      .then((u) => setAllUsers(u.users))
      .catch(() => setAllUsers([]));
  }, [cohortId, reload]);

  const memberIds = useMemo(() => new Set((data?.members ?? []).map((m) => m.id)), [data]);

  const candidates = useMemo(() => {
    const term = pickerSearch.toLowerCase().trim();
    return allUsers
      .filter((u) => !memberIds.has(u.id))
      .filter((u) => !term || [u.name, u.email, u.employeeid, u.role, u.department].some((v) => (v || '').toLowerCase().includes(term)));
  }, [allUsers, memberIds, pickerSearch]);

  const filteredMembers = useMemo(() => {
    if (!data) return [];
    const term = search.toLowerCase().trim();
    if (!term) return data.members;
    return data.members.filter((m) =>
      [m.name, m.email, m.employeeid, m.role, m.department].some((v) => (v || '').toLowerCase().includes(term)),
    );
  }, [data, search]);

  async function addAllUsers() {
    if (!confirm('Add every current faculty user to this cohort?')) return;
    try {
      const res = await api<{ added: number }>(`/api/cohorts/${cohortId}/members`, {
        method: 'POST',
        body: JSON.stringify({ add_all_users: true }),
      });
      setMessage({ text: `Added ${res.added} new member${res.added === 1 ? '' : 's'}.`, type: 'success' });
      await reload();
    } catch (e) { setMessage({ text: (e as Error).message, type: 'error' }); }
  }

  async function addSelected() {
    if (!pickerSelected.size) return;
    setPickerBusy(true);
    try {
      const res = await api<{ added: number }>(`/api/cohorts/${cohortId}/members`, {
        method: 'POST',
        body: JSON.stringify({ user_ids: Array.from(pickerSelected) }),
      });
      setMessage({ text: `Added ${res.added} member${res.added === 1 ? '' : 's'}.`, type: 'success' });
      setPickerOpen(false);
      setPickerSelected(new Set());
      setPickerSearch('');
      await reload();
    } catch (e) {
      setMessage({ text: (e as Error).message, type: 'error' });
    } finally { setPickerBusy(false); }
  }

  async function removeMember(m: Member) {
    if (!confirm(`Remove ${m.name} from this cohort?`)) return;
    try {
      await api(`/api/cohorts/${cohortId}/members/${m.id}`, { method: 'DELETE' });
      setMessage({ text: 'Member removed.', type: 'success' });
      await reload();
    } catch (e) { setMessage({ text: (e as Error).message, type: 'error' }); }
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    setManualBusy(true);
    try {
      const users = manualRows.map(cleanRow).filter((r) => r.employeeid && r.name && r.role);
      if (!users.length) throw new Error('Please fill in at least one full row.');
      const res = await api<ImportResult>(`/api/cohorts/${cohortId}/members/import-users`, {
        method: 'POST',
        body: JSON.stringify({ users }),
      });
      setMessage({ text: summarizeImport(res), type: res.failed ? 'info' : 'success' });
      setManualOpen(false);
      setManualRows([emptyManualRow()]);
      await reload();
    } catch (e) {
      setMessage({ text: (e as Error).message, type: 'error' });
    } finally { setManualBusy(false); }
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        const normalized = rows.map(normalizeImportRow);
        if (!normalized.length) {
          setMessage({ text: 'The sheet appears to be empty.', type: 'error' });
          return;
        }
        setImportPreview(normalized);
      } catch (err) {
        setMessage({ text: `Could not read file: ${(err as Error).message}`, type: 'error' });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function submitImport() {
    if (!importPreview?.length) return;
    setImportBusy(true);
    try {
      // Send EVERY parsed row to the backend so it can report per-row errors;
      // don't drop rows client-side just because a cell looks blank.
      const users = importPreview.map(cleanRow);
      const res = await api<ImportResult>(`/api/cohorts/${cohortId}/members/import-users`, {
        method: 'POST',
        body: JSON.stringify({ users }),
      });
      setImportResult(res);
      setImportPreview(null);
      if (!res.failed) {
        // All good — set a one-line success toast and let the user dismiss the dialog
        setMessage({ text: summarizeImport(res), type: 'success' });
      }
      await reload();
    } catch (e) {
      setMessage({ text: (e as Error).message, type: 'error' });
    } finally { setImportBusy(false); }
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      SAMPLE_HEADERS,
      ['E12345', 'Dr Sample Faculty', 'sample@univ.edu', '9999900000', 'Assistant Professor', 'CS', ''],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'cohort_users_template.xlsx');
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const { cohort, members, duties } = data;

  return (
    <>
      <header className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
          <Link href="/admin/cohorts"><ArrowLeft className="h-4 w-4" /> All cohorts</Link>
        </Button>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">{cohort.name}</h1>
            {cohort.description && <p className="mt-1 text-sm text-muted-foreground">{cohort.description}</p>}
            <div className="mt-2 flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Users2 className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground tabular-nums">{members.length}</span> members
              </span>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground tabular-nums">{duties.length}</span> duties assigned
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setPickerOpen(true)} variant="outline"><UserPlus className="h-4 w-4" /> Add existing</Button>
            <Button onClick={addAllUsers} variant="outline"><Users2 className="h-4 w-4" /> Add all users</Button>
            <Button onClick={() => setManualOpen(true)} variant="outline"><Plus className="h-4 w-4" /> Add manually</Button>
            <Button onClick={() => setImportOpen(true)}><FileSpreadsheet className="h-4 w-4" /> Import Excel</Button>
          </div>
        </div>
      </header>

      {message && <Alert variant={message.type === 'success' ? 'success' : message.type === 'info' ? 'info' : 'destructive'}>{message.text}</Alert>}

      {duties.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duties using this cohort</div>
            <div className="flex flex-wrap gap-2">
              {duties.map((d) => (
                <Link key={d.id} href={`/admin/duties`}>
                  <Badge variant={d.accepting_bookings ? 'success' : 'destructive'} className="cursor-pointer">
                    {d.title}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search members by name, email, employee ID, role, or department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <Users2 className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">{search ? 'No matches' : 'No members yet'}</p>
              <p className="text-sm text-muted-foreground">
                {search ? 'Try a different search term.' : 'Add existing users, create them manually, or import from Excel.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((m) => (
            <Card key={m.id} className="surface surface-hover overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-info text-sm font-semibold text-primary-foreground shadow-sm ring-2 ring-white">
                    {(m.name || '?')[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{m.name}</div>
                    <Badge variant="secondary" className="mt-1">{m.role}</Badge>
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeMember(m)}
                    title="Remove from cohort"
                    aria-label={`Remove ${m.name}`}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
                <dl className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Emp ID</dt><dd className="font-medium tabular-nums">{m.employeeid || '—'}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Email</dt><dd className="truncate font-medium">{m.email || '(None)'}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Dept</dt><dd className="font-medium">{m.department || '—'}</dd></div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pick existing users */}
      <Dialog open={pickerOpen} onOpenChange={(o) => { setPickerOpen(o); if (!o) { setPickerSelected(new Set()); setPickerSearch(''); } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add existing users</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {candidates.length} user{candidates.length === 1 ? '' : 's'} not yet in this cohort.
            </p>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search…"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
              />
            </div>
            <div className="max-h-[420px] space-y-1 overflow-y-auto rounded-lg border bg-white p-2">
              {candidates.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {pickerSearch ? 'No users match that search.' : 'Every existing user is already a member.'}
                </div>
              ) : (
                candidates.map((u) => {
                  const checked = pickerSelected.has(u.id);
                  return (
                    <label
                      key={u.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors',
                        checked ? 'bg-primary/10' : 'hover:bg-accent',
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => setPickerSelected((cur) => {
                          const next = new Set(cur);
                          if (v) next.add(u.id); else next.delete(u.id);
                          return next;
                        })}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{u.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {[u.employeeid, u.email, u.department].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{u.role}</Badge>
                    </label>
                  );
                })
              )}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{pickerSelected.size} selected</span>
              {pickerSelected.size > 0 && (
                <button type="button" onClick={() => setPickerSelected(new Set())} className="text-muted-foreground underline-offset-2 hover:text-destructive hover:underline">
                  Clear
                </button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={addSelected} disabled={pickerSelected.size === 0 || pickerBusy}>
              {pickerBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</> : <>Add {pickerSelected.size} user{pickerSelected.size === 1 ? '' : 's'}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual add */}
      <Dialog open={manualOpen} onOpenChange={(o) => { setManualOpen(o); if (!o) setManualRows([emptyManualRow()]); }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add new users manually</DialogTitle>
            <p className="text-sm text-muted-foreground">
              We&apos;ll create any new user (matching existing employee IDs is skipped) and add them all to this cohort.
              New users start with password <code className="rounded bg-muted px-1 py-0.5 text-xs">12345678</code>.
            </p>
          </DialogHeader>
          <form onSubmit={submitManual} className="space-y-3">
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {manualRows.map((row, idx) => (
                <div key={idx} className="rounded-lg border bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">User {idx + 1}</span>
                    {manualRows.length > 1 && (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => setManualRows(manualRows.filter((_, i) => i !== idx))}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Employee ID *" value={row.employeeid} onChange={(e) => updateManualRow(setManualRows, idx, 'employeeid', e.target.value)} />
                    <Input placeholder="Name *" value={row.name} onChange={(e) => updateManualRow(setManualRows, idx, 'name', e.target.value)} />
                    <Input placeholder="Email (optional)" type="email" value={row.email} onChange={(e) => updateManualRow(setManualRows, idx, 'email', e.target.value)} />
                    <Input placeholder="Phone" value={row.phone} onChange={(e) => updateManualRow(setManualRows, idx, 'phone', e.target.value)} />
                    <Select value={row.role || ''} onValueChange={(v) => updateManualRow(setManualRows, idx, 'role', v)}>
                      <SelectTrigger><SelectValue placeholder="Role *" /></SelectTrigger>
                      <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input placeholder="Department (optional)" value={row.department} onChange={(e) => updateManualRow(setManualRows, idx, 'department', e.target.value)} />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setManualRows([...manualRows, emptyManualRow()])}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-primary"
              >
                + Add another row
              </button>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={manualBusy}>
                {manualBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Save users'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Excel import */}
      <Dialog
        open={importOpen}
        onOpenChange={(o) => { setImportOpen(o); if (!o) { setImportPreview(null); setImportResult(null); } }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import users from Excel</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Upload an .xlsx with these columns: <strong>employeeid, name, email, phone, role, department, password</strong>.
              Required: employeeid, name, role. Default password is <code className="rounded bg-muted px-1 py-0.5 text-xs">12345678</code>.
              Existing users (by employee ID) are matched and added — never duplicated.
            </p>
          </DialogHeader>

          {importResult ? (
            <div className="space-y-3">
              <Alert variant={importResult.failed && !importResult.member_added ? 'destructive' : importResult.failed ? 'warning' : 'success'}>
                <div className="font-medium">{summarizeImport(importResult)}</div>
                <div className="mt-1 text-xs opacity-90">
                  {importResult.created} new user{importResult.created === 1 ? '' : 's'} created ·
                  {' '}{importResult.matched} existing user{importResult.matched === 1 ? '' : 's'} matched ·
                  {' '}{importResult.member_added} added to this cohort ·
                  {' '}{importResult.failed} row{importResult.failed === 1 ? '' : 's'} skipped
                </div>
              </Alert>

              {importResult.errors.length > 0 && (
                <div className="rounded-lg border bg-white">
                  <div className="border-b bg-secondary/40 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Rows that could not be imported ({importResult.errors.length})
                  </div>
                  <div className="max-h-[280px] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-white text-left text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 font-medium">Row</th>
                          <th className="px-3 py-2 font-medium">Employee ID</th>
                          <th className="px-3 py-2 font-medium">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.errors.map((e, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-1.5 tabular-nums text-muted-foreground">{e.row}</td>
                            <td className="px-3 py-1.5 font-mono">{e.employeeid || '—'}</td>
                            <td className="px-3 py-1.5 text-destructive">{e.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setImportResult(null); }}>
                  Import another file
                </Button>
                <Button onClick={() => { setImportOpen(false); setImportResult(null); }}>Done</Button>
              </div>
            </div>
          ) : !importPreview ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className="grid place-items-center rounded-xl border-2 border-dashed bg-secondary/30 px-6 py-12 text-center"
            >
              <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="mt-3 font-medium">Drop an .xlsx file here</p>
              <p className="text-xs text-muted-foreground">or use the buttons below</p>
              <input
                ref={importInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <div className="mt-4 flex gap-2">
                <Button type="button" onClick={() => importInputRef.current?.click()}>
                  <UploadCloud className="h-4 w-4" /> Choose file
                </Button>
                <Button type="button" variant="outline" onClick={downloadTemplate}>
                  <Download className="h-4 w-4" /> Template
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Alert variant="info">
                Parsed <strong>{importPreview.length}</strong> row{importPreview.length === 1 ? '' : 's'}. Review and import,
                or replace the file.
              </Alert>
              <div className="max-h-[300px] overflow-auto rounded-lg border bg-white">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-secondary/70 text-left">
                    <tr>
                      {SAMPLE_HEADERS.map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.slice(0, 100).map((row, i) => (
                      <tr key={i} className="border-t">
                        {SAMPLE_HEADERS.map((h) => (
                          <td key={h} className="px-2 py-1.5">{row[h] || ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importPreview.length > 100 && (
                  <p className="border-t bg-secondary/30 px-2 py-1.5 text-center text-[11px] text-muted-foreground">
                    Showing 100 of {importPreview.length} rows — all rows will be processed on import.
                  </p>
                )}
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="outline" size="sm" onClick={() => setImportPreview(null)}>
                  Choose different file
                </Button>
                <Button onClick={submitImport} disabled={importBusy}>
                  {importBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</> : <>Import {importPreview.length} rows</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

type ImportResult = { created: number; matched: number; member_added: number; failed: number; errors: { row: number; message: string; employeeid?: string }[] };

function emptyManualRow(): Record<string, string> {
  return { employeeid: '', name: '', email: '', phone: '', role: '', department: '' };
}
function updateManualRow(setter: React.Dispatch<React.SetStateAction<Array<Record<string, string>>>>, idx: number, key: string, value: string) {
  setter((cur) => cur.map((r, i) => i === idx ? { ...r, [key]: value } : r));
}
function cleanRow(row: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, (v ?? '').toString().trim()]));
}
function normalizeImportRow(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  // Map flexibly: any key that contains the canonical word maps to it.
  const map: [string, string[]][] = [
    ['employeeid', ['employeeid', 'employee id', 'empid', 'emp id', 'employee_id']],
    ['name', ['name', 'full name', 'fullname']],
    ['email', ['email', 'e-mail', 'mail']],
    ['phone', ['phone', 'mobile', 'contact']],
    ['role', ['role', 'designation', 'position']],
    ['department', ['department', 'dept']],
    ['password', ['password', 'pass']],
  ];
  const lowered: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) lowered[k.toString().toLowerCase().trim()] = v;
  for (const [canonical, aliases] of map) {
    for (const a of aliases) {
      if (lowered[a] !== undefined && lowered[a] !== '') { out[canonical] = String(lowered[a]); break; }
    }
    if (!(canonical in out)) out[canonical] = '';
  }
  return out;
}
function summarizeImport(r: ImportResult) {
  const parts = [];
  if (r.created) parts.push(`${r.created} created`);
  if (r.matched) parts.push(`${r.matched} matched`);
  parts.push(`${r.member_added} added to cohort`);
  if (r.failed) parts.push(`${r.failed} skipped`);
  return parts.join(' · ');
}
