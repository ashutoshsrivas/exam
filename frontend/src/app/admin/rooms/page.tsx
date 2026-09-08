'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Pencil, Plus, Trash2 } from 'lucide-react';

type Room = { id: number; name: string; need: number | null };

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState({ name: '', need: 0 });

  async function load() {
    const d = await api<{ rooms: Room[] }>('/api/rooms');
    setRooms(d.rooms);
  }

  useEffect(() => { load().catch((e) => setMessage({ text: e.message, type: 'error' })); }, []);

  function openAdd() { setForm({ name: '', need: 0 }); setAddOpen(true); }
  function openEdit(r: Room) { setForm({ name: r.name, need: r.need || 0 }); setEditing(r); }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/api/rooms', { method: 'POST', body: JSON.stringify(form) });
      setMessage({ text: 'Room added successfully.', type: 'success' });
      setAddOpen(false);
      await load();
    } catch (e) { setMessage({ text: (e as Error).message, type: 'error' }); }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      await api(`/api/rooms/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      setMessage({ text: 'Room updated successfully.', type: 'success' });
      setEditing(null);
      await load();
    } catch (e) { setMessage({ text: (e as Error).message, type: 'error' }); }
  }

  async function remove(r: Room) {
    if (!confirm('Delete this room permanently?')) return;
    try {
      await api(`/api/rooms/${r.id}`, { method: 'DELETE' });
      setMessage({ text: 'Room deleted successfully.', type: 'success' });
      await load();
    } catch (e) { setMessage({ text: (e as Error).message, type: 'error' }); }
  }

  return (
    <>
      {message && <Alert variant={message.type === 'success' ? 'success' : 'destructive'}>{message.text}</Alert>}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Rooms</h1>
          <p className="mt-1 text-sm text-muted-foreground">{rooms.length} room{rooms.length === 1 ? '' : 's'} configured.</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add room</Button>
      </header>
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Need</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">#{r.id}</TableCell>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="tabular-nums">{r.need ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)} title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(r)} title="Delete" className="text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Room</DialogTitle></DialogHeader>
          <RoomForm form={form} setForm={setForm} onSubmit={submitAdd} label="Add Room" />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Room</DialogTitle></DialogHeader>
          <RoomForm form={form} setForm={setForm} onSubmit={submitEdit} label="Update Room" />
        </DialogContent>
      </Dialog>
    </>
  );
}

function RoomForm({
  form, setForm, onSubmit, label,
}: {
  form: { name: string; need: number };
  setForm: (f: { name: string; need: number }) => void;
  onSubmit: (e: React.FormEvent) => void;
  label: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1"><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div className="space-y-1"><Label>Need</Label><Input type="number" min={0} value={form.need} onChange={(e) => setForm({ ...form, need: Number(e.target.value) })} /></div>
      <DialogFooter><Button type="submit">{label}</Button></DialogFooter>
    </form>
  );
}
