import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin, asyncHandler } from '../middleware.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/', asyncHandler(async (_req, res) => {
  const [rows] = await pool.query('SELECT id, name, need FROM rooms ORDER BY id DESC');
  res.json({ rooms: rows });
}));

// rooms.name is UNIQUE in the schema; without this the driver error surfaces
// as a raw 500 instead of something the admin can act on.
const DUP_NAME = 'A room with this name already exists.';

// Capacity is a whole, non-negative count — a negative would flow straight into
// the allocator's capacity sum and shrink it.
const capacity = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

router.post('/', asyncHandler(async (req, res) => {
  const { name, need } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  try {
    const [result] = await pool.query('INSERT INTO rooms (name, need) VALUES (?, ?)', [name, capacity(need)]);
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: DUP_NAME });
    throw e;
  }
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { name, need } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  try {
    const [result] = await pool.query('UPDATE rooms SET name = ?, need = ? WHERE id = ?', [name, capacity(need), id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Room not found.' });
    res.json({ message: 'Room updated.' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: DUP_NAME });
    throw e;
  }
}));

// No foreign keys, so rows in allocations/attendance would keep pointing at a
// deleted room. Allocations are regenerable — those people fall back to the
// reserved tray. Attendance is the historical roll-call and cannot be
// reconstructed, so a room that has any is kept rather than silently gutted.
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [[marked]] = await pool.query('SELECT COUNT(*) AS n FROM attendance WHERE room_id = ?', [id]);
  if (Number(marked.n) > 0) {
    return res.status(400).json({
      error: `This room holds ${marked.n} attendance record${Number(marked.n) === 1 ? '' : 's'}. Clear those seats first — deleting the room would lose them.`,
    });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE allocations SET room_id = NULL WHERE room_id = ?', [id]);
    const [result] = await conn.query('DELETE FROM rooms WHERE id = ?', [id]);
    if (!result.affectedRows) {
      await conn.rollback();
      return res.status(404).json({ error: 'Room not found.' });
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  res.json({ message: 'Room deleted.' });
}));

export default router;
