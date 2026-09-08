import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin, asyncHandler } from '../middleware.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// GET /api/attendance?slot=N — grouped per room
router.get('/', asyncHandler(async (req, res) => {
  const slot = Number(req.query.slot || 0);
  if (!slot) return res.status(400).json({ error: 'Missing slot.' });

  const [slotRow] = await pool.query(
    `SELECT s.id, s.slottext, s.slottime, s.slotdate, s.duty,
       d.title AS duty_title, d.academicsession
     FROM slot s LEFT JOIN duties d ON d.id = s.duty
     WHERE s.id = ? LIMIT 1`,
    [slot]
  );
  if (!slotRow[0]) return res.status(404).json({ error: 'Slot not found.' });

  const [rooms] = await pool.query('SELECT id, name, need FROM rooms ORDER BY name');

  const [entries] = await pool.query(
    `SELECT a.slot_id, a.room_id, a.seat_index, a.user_id, a.marked_at,
       u.name, u.role, u.employeeid, u.email, u.department
     FROM attendance a JOIN users u ON u.id = a.user_id
     WHERE a.slot_id = ?
     ORDER BY a.room_id, a.seat_index`,
    [slot]
  );

  // Group by room -> { seat_index: userLike }
  const seatMap = new Map();
  for (const e of entries) {
    if (!seatMap.has(e.room_id)) seatMap.set(e.room_id, {});
    seatMap.get(e.room_id)[e.seat_index] = {
      user_id: e.user_id,
      name: e.name,
      role: e.role,
      employeeid: e.employeeid,
      email: e.email,
      department: e.department,
      marked_at: e.marked_at,
    };
  }

  res.json({
    slot: slotRow[0],
    rooms: rooms.map((r) => ({
      room: { ...r, need: Number(r.need || 0) },
      seats: seatMap.get(r.id) || {},
    })),
  });
}));

// PUT /api/attendance — upsert or clear a seat
// Body: { slot_id, room_id, seat_index, user_id }  (user_id null/0 clears)
router.put('/', asyncHandler(async (req, res) => {
  const slotId = Number(req.body?.slot_id || 0);
  const roomId = Number(req.body?.room_id || 0);
  const seatIndex = Number(req.body?.seat_index);
  const userId = req.body?.user_id ? Number(req.body.user_id) : null;

  if (!slotId || !roomId || Number.isNaN(seatIndex) || seatIndex < 0) {
    return res.status(400).json({ error: 'Missing slot_id, room_id, or seat_index.' });
  }

  // Clear
  if (!userId) {
    await pool.query(
      'DELETE FROM attendance WHERE slot_id = ? AND room_id = ? AND seat_index = ?',
      [slotId, roomId, seatIndex]
    );
    return res.json({ cleared: true });
  }

  // Verify slot + room + user exist
  const [[s]] = await pool.query('SELECT COUNT(*) AS n FROM slot WHERE id = ?', [slotId]);
  if (!s.n) return res.status(400).json({ error: 'Slot not found.' });
  const [[u]] = await pool.query('SELECT COUNT(*) AS n FROM users WHERE id = ?', [userId]);
  if (!u.n) return res.status(400).json({ error: 'User not found.' });
  const [[r]] = await pool.query('SELECT COUNT(*) AS n FROM rooms WHERE id = ?', [roomId]);
  if (!r.n) return res.status(400).json({ error: 'Room not found.' });

  // The table carries two unique keys — uniq_seat (slot,room,seat) and
  // uniq_user_per_slot (slot,user). The upsert below must only ever be able to
  // collide on the first, so the "already marked elsewhere" case is settled
  // here, inside the same transaction. Getting this wrong is silent: a collision
  // on uniq_user_per_slot updates the user's OTHER row and leaves this seat
  // empty, while still reporting success.
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query(
      'SELECT room_id, seat_index FROM attendance WHERE slot_id = ? AND user_id = ? FOR UPDATE',
      [slotId, userId]
    );
    const other = existing[0];
    if (other && !(other.room_id === roomId && other.seat_index === seatIndex)) {
      // Look the name up separately — joining rooms here would hide the conflict
      // whenever that room has since been deleted.
      const [[roomRow]] = await conn.query('SELECT name FROM rooms WHERE id = ? LIMIT 1', [other.room_id]);
      await conn.rollback();
      return res.status(409).json({
        error: `This user is already marked in ${roomRow?.name || `room #${other.room_id}`} (seat ${other.seat_index + 1}) for this slot.`,
        conflict: { room_id: other.room_id, seat_index: other.seat_index, room_name: roomRow?.name || null },
      });
    }

    // Only uniq_seat can fire now, so this replaces whoever was in the seat.
    await conn.query(
      `INSERT INTO attendance (slot_id, room_id, seat_index, user_id, marked_by)
         VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         user_id = VALUES(user_id),
         marked_at = CURRENT_TIMESTAMP,
         marked_by = VALUES(marked_by)`,
      [slotId, roomId, seatIndex, userId, req.user.id]
    );

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  const [[full]] = await pool.query(
    `SELECT u.id AS user_id, u.name, u.role, u.employeeid, u.email, u.department
     FROM users u WHERE u.id = ? LIMIT 1`,
    [userId]
  );
  res.json({ saved: true, entry: full });
}));

export default router;
