'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, UserPlus } from 'lucide-react';

type User = {
  id: number;
  employeeid: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  department: string | null;
};

const ROLES = [
  'Admin', 'Assistant Professor', 'Associate Professor', 'Professor',
  'Research Scholar', 'Special Role 1', 'Special Role 2', 'Special Role 3', 'Special Role 4',
];

const EMPTY: Partial<User> & { password?: string; confirm_password?: string; new_password?: string; confirm_new_password?: string } = {
  employeeid: '', name: '', email: '', phone: '', role: '', department: '',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });

  async function load() {
    const data = await api<{ users: User[] }>('/api/users');
    setUsers(data.users);
  }

  useEffect(() => { load().catch((e) => setMessage({ text: e.message, type: 'error' })); }, []);

  const filtered = users.filter((u) => {
    const s = search.toLowerCase().trim();
    if (!s) return true;
    return [u.name, u.email, u.employeeid].some((v) => (v || '').toLowerCase().includes(s));
  });

  function openAdd() { setForm({ ...EMPTY, password: '', confirm_password: '' }); setAddOpen(true); }
  function openEdit(u: User) { setForm({ ...u, new_password: '', confirm_new_password: '' }); setEditing(u); }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (form.password !== form.confirm_password) return setMessage({ text: 'Passwords do not match.', type: 'error' });
    try {
      await api('/api/users', { method: 'POST', body: JSON.stringify(form) });
      setMessage({ text: 'User added successfully.', type: 'success' });
      setAddOpen(false);
      await load();
    } catch (e) { setMessage({ text: (e as Error).message, type: 'error' }); }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setMessage(null);
    try {
      await api(`/api/users/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      setMessage({ text: 'User details updated successfully.', type: 'success' });
      setEditing(null);
      await load();
    } catch (e) { setMessage({ text: (e as Error).message, type: 'error' }); }
  }

  async function remove(u: User) {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    try {
      await api(`/api/users/${u.id}`, { method: 'DELETE' });
      setMessage({ text: 'User deleted successfully.', type: 'success' });
      await load();
    } catch (e) { setMessage({ text: (e as Error).message, type: 'error' }); }
  }

  return (
    <>
      {message && <Alert variant={message.type === 'success' ? 'success' : 'destructive'}>{message.text}</Alert>}

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">User management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} {search ? 'matching' : 'total'} {filtered.length === 1 ? 'user' : 'users'}
          </p>
        </div>
        <Button onClick={openAdd}><UserPlus className="h-4 w-4" /> Add user</Button>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, email, or employee ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((u) => (
          <Card key={u.id} className="surface surface-hover overflow-hidden">
            <CardHeader className="flex flex-row items-start gap-3 space-y-0">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-info text-base font-semibold text-primary-foreground shadow-sm ring-2 ring-white">
                {u.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-base">{u.name}</CardTitle>
                <Badge variant="secondary" className="mt-1">{u.role}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Employee ID</span><span className="font-medium tabular-nums">{u.employeeid}</span></div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">Email</span><span className="truncate font-medium">{u.email || '(None)'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium tabular-nums">{u.phone || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Dept</span><span className="font-medium">{u.department || '—'}</span></div>
              <div className="flex gap-2 pt-3">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(u)}>Edit</Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={() => remove(u)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
          <UserForm form={form} setForm={setForm} mode="add" onSubmit={submitAdd} />
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <UserForm form={form} setForm={setForm} mode="edit" onSubmit={submitEdit} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function UserForm({
  form, setForm, mode, onSubmit,
}: {
  form: any;
  setForm: (f: any) => void;
  mode: 'add' | 'edit';
  onSubmit: (e: React.FormEvent) => void;
}) {
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label>Employee ID</Label><Input required value={form.employeeid || ''} onChange={set('employeeid')} /></div>
        <div className="space-y-1"><Label>Name</Label><Input required value={form.name || ''} onChange={set('name')} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label>Email (optional)</Label><Input type="email" value={form.email || ''} onChange={set('email')} /></div>
        <div className="space-y-1"><Label>Phone</Label><Input required value={form.phone || ''} onChange={set('phone')} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Role</Label>
          <Select value={form.role || ''} onValueChange={(v) => setForm({ ...form, role: v })}>
            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label>Department</Label><Input value={form.department || ''} onChange={set('department')} /></div>
      </div>
      {mode === 'add' ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label>Password</Label><Input type="password" required value={form.password || ''} onChange={set('password')} /></div>
          <div className="space-y-1"><Label>Confirm Password</Label><Input type="password" required value={form.confirm_password || ''} onChange={set('confirm_password')} /></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label>New Password (optional)</Label><Input type="password" value={form.new_password || ''} onChange={set('new_password')} /></div>
          <div className="space-y-1"><Label>Confirm New Password</Label><Input type="password" value={form.confirm_new_password || ''} onChange={set('confirm_new_password')} /></div>
        </div>
      )}
      <DialogFooter>
        <Button type="submit">{mode === 'add' ? 'Add User' : 'Save Changes'}</Button>
      </DialogFooter>
    </form>
  );
}
