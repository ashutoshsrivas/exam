'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { api, apiDownload } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type SlotInfo = {
  slottext: string; slottime: string; slotdate: string; requirement: number; duty: number;
  duty_title: string; academicsession: string; type: string;
};
type Participant = {
  id: number; name: string; email: string | null; phone: string | null; role: string;
  department: string | null; employeeid: string | null;
};

export default function SlotApplicantsPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const slotId = Number(params?.id);
  const dutyParam = Number(search.get('duty') || 0);

  const [slot, setSlot] = useState<SlotInfo | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slotId) return;
    Promise.all([
      api<{ slot: SlotInfo }>(`/api/slots/${slotId}`),
      api<{ participants: Participant[] }>(`/api/slots/${slotId}/participants`),
    ])
      .then(([s, p]) => { setSlot(s.slot); setParticipants(p.participants); })
      .catch((e) => setError((e as Error).message));
  }, [slotId]);

  const backDuty = dutyParam || slot?.duty || 0;

  function downloadCsv() {
    apiDownload(`/api/reports?type=slot_attendees&slot=${slotId}&csv=1`, `slot_${slotId}_attendees.csv`)
      .catch((e) => setError((e as Error).message));
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
          <Link href={backDuty ? `/admin/slots?duty=${backDuty}` : '/admin/slots'}>← Back to Slots</Link>
        </Button>
        {participants.length > 0 && <Button size="sm" onClick={downloadCsv}>Export CSV</Button>}
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {slot && (
        <Card>
          <CardHeader>
            <CardTitle>{slot.slottext}</CardTitle>
            <CardDescription>
              {slot.duty_title} – {slot.academicsession} · {slot.slotdate} @ {slot.slottime}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <Alert variant="info">No attendees have selected this slot yet.</Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead><TableHead>Department</TableHead><TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.id}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.email || '—'}</TableCell>
                      <TableCell>{p.phone || '—'}</TableCell>
                      <TableCell>{p.department || '—'}</TableCell>
                      <TableCell>{p.role}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
