import { pool } from '../db.js';

export function isAdmin(user) {
  return String(user?.role || '').toLowerCase() === 'admin';
}

// Cohort gate. Admins see every duty; a faculty member only sees a duty whose
// cohort they belong to (a duty with cohort_id IS NULL is admin-only, and the
// JOIN below drops it). Every faculty-reachable read/write that names a duty —
// directly or through a slot — must go through this, or the cohort model that
// /api/duties enforces can be bypassed by asking for the slots instead.
export async function canSeeDuty(user, dutyId) {
  const id = Number(dutyId || 0);
  if (!id) return false;
  if (isAdmin(user)) return true;
  const [rows] = await pool.query(
    `SELECT 1 FROM duties d
     JOIN cohort_members m ON m.cohort_id = d.cohort_id AND m.user_id = ?
     WHERE d.id = ? LIMIT 1`,
    [user.id, id]
  );
  return rows.length > 0;
}

// Same check, addressed by slot instead of duty. Returns the slot's duty id, or
// null when the slot is missing or out of the user's reach.
export async function dutyOfVisibleSlot(user, slotId) {
  const id = Number(slotId || 0);
  if (!id) return null;
  const [rows] = await pool.query('SELECT duty FROM slot WHERE id = ? LIMIT 1', [id]);
  if (!rows[0]) return null;
  const duty = rows[0].duty;
  return (await canSeeDuty(user, duty)) ? duty : null;
}
