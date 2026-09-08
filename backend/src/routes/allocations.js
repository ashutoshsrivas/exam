import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin, asyncHandler } from '../middleware.js';

const router = Router();
router.use(requireAuth, requireAdmin);

/**
 * Per-slot allocator.
 *
 * Inputs:
 *   - faculty: [{ id, name, role, reserved_count }]
 *       reserved_count = lifetime count of times this user was in reserved
 *       across allocations OTHER than the duty we are regenerating.
 *   - rooms:   [{ id, name, need }]   need = invigilators per room.
 *
 * Rules:
 *   - If faculty count > total room capacity, the tail becomes "reserved"
 *     (room_id = null). Selection is biased toward people who have been
 *     reserved more often historically, so over many duties the load levels.
 *   - Within the assigned slice we round-robin people by role and rooms
 *     by capacity, so each room ends up with a balanced mix.
 */
function allocateSlot(faculty, rooms) {
  const capacity = rooms.reduce((s, r) => s + Number(r.need || 0), 0);

  // Most-reserved float to the FRONT — those people get rooms this time.
  // The TAIL of the sorted list goes to reserved.
  const sorted = [...faculty].sort((a, b) => {
    if (b.reserved_count !== a.reserved_count) return b.reserved_count - a.reserved_count;
    return (a.name || '').localeCompare(b.name || '');
  });

  const reserveCount = Math.max(0, sorted.length - capacity);
  const toAssign = sorted.slice(0, sorted.length - reserveCount);
  const reserved = sorted.slice(sorted.length - reserveCount);

  // Group assigned faculty by role and interleave so adjacent positions
  // belong to different roles (which then land in different rooms below).
  const byRole = new Map();
  for (const f of toAssign) {
    if (!byRole.has(f.role)) byRole.set(f.role, []);
    byRole.get(f.role).push(f);
  }
  for (const arr of byRole.values()) {
    arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }
  const interleaved = [];
  let more = true;
  while (more) {
    more = false;
    for (const arr of byRole.values()) {
      if (arr.length) { interleaved.push(arr.shift()); more = true; }
    }
  }

  // Build positions by round-robining across rooms, one capacity unit per pass.
  // E.g. rooms [LT01:2, LT02:3] -> [LT01, LT02, LT01, LT02, LT02].
  const remaining = rooms.map((r) => ({ id: r.id, left: Number(r.need || 0) }));
  const positions = [];
  let stillRoom = true;
  while (stillRoom) {
    stillRoom = false;
    for (const r of remaining) {
      if (r.left > 0) { positions.push(r.id); r.left -= 1; stillRoom = true; }
    }
  }

  const assignments = interleaved.map((u, i) => ({ user_id: u.id, room_id: positions[i] }));
  const reservedAssignments = reserved.map((u) => ({ user_id: u.id, room_id: null }));
  return [...assignments, ...reservedAssignments];
}

router.post('/generate', asyncHandler(async (req, res) => {
  const dutyId = Number(req.body?.duty_id || 0);
  const roomIds = Array.isArray(req.body?.room_ids) ? req.body.room_ids.map(Number).filter(Boolean) : [];
  if (!dutyId) return res.status(400).json({ error: 'Missing duty_id.' });
  if (!roomIds.length) return res.status(400).json({ error: 'Select at least one room.' });

  const [duty] = await pool.query('SELECT id FROM duties WHERE id = ? LIMIT 1', [dutyId]);
  if (!duty.length) return res.status(404).json({ error: 'Duty not found.' });

  const [rooms] = await pool.query(
    `SELECT id, name, need FROM rooms WHERE id IN (${roomIds.map(() => '?').join(',')}) AND need > 0`,
    roomIds
  );
  if (!rooms.length) return res.status(400).json({ error: 'None of the selected rooms have a positive capacity.' });

  const [slots] = await pool.query(
    'SELECT id, slottext, slottime, slotdate, requirement FROM slot WHERE duty = ? ORDER BY slotdate, slottime',
    [dutyId]
  );
  if (!slots.length) return res.status(400).json({ error: 'This duty has no slots yet.' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Pull lifetime reserved counts FIRST (including this duty's previous run, if
    // any). That is the signal — if a user was reserved last time, they get
    // priority for a room this time. Only then do we wipe the duty's old rows.
    const [historyRows] = await conn.query(
      `SELECT user_id, COUNT(*) AS n
       FROM allocations
       WHERE room_id IS NULL
       GROUP BY user_id`
    );
    const reservedHistory = new Map(historyRows.map((r) => [Number(r.user_id), Number(r.n)]));

    await conn.query('DELETE FROM allocations WHERE duty_id = ?', [dutyId]);

    let totalAssigned = 0;
    let totalReserved = 0;

    for (const slot of slots) {
      const [faculty] = await conn.query(
        `SELECT u.id, u.name, u.role
         FROM preferences p JOIN users u ON u.id = p.userid
         WHERE p.slotid = ?`,
        [slot.id]
      );
      if (!faculty.length) continue;

      const annotated = faculty.map((f) => ({
        id: Number(f.id),
        name: f.name,
        role: f.role,
        reserved_count: reservedHistory.get(Number(f.id)) || 0,
      }));

      const result = allocateSlot(annotated, rooms);

      if (result.length) {
        const values = result.map(() => '(?, ?, ?, ?)').join(',');
        const params = result.flatMap((r) => [dutyId, slot.id, r.user_id, r.room_id]);
        await conn.query(
          `INSERT INTO allocations (duty_id, slot_id, user_id, room_id) VALUES ${values}`,
          params
        );
      }

      for (const r of result) {
        if (r.room_id == null) totalReserved += 1;
        else totalAssigned += 1;
      }
    }

    await conn.commit();
    res.json({
      duty_id: dutyId,
      rooms_used: rooms.length,
      slots: slots.length,
      assigned: totalAssigned,
      reserved: totalReserved,
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

router.get('/', asyncHandler(async (req, res) => {
  const dutyId = Number(req.query.duty || 0);
  if (!dutyId) return res.status(400).json({ error: 'Missing duty.' });

  const [dutyRow] = await pool.query(
    'SELECT id, title, academicsession, type FROM duties WHERE id = ? LIMIT 1',
    [dutyId]
  );
  if (!dutyRow.length) return res.status(404).json({ error: 'Duty not found.' });

  const [rows] = await pool.query(
    `SELECT a.slot_id, a.user_id, a.room_id, a.generated_at,
       s.slottext, s.slottime, s.slotdate, s.requirement,
       u.name AS user_name, u.role AS user_role, u.employeeid, u.email, u.department,
       r.name AS room_name, r.need AS room_need
     FROM allocations a
     JOIN slot s ON s.id = a.slot_id
     JOIN users u ON u.id = a.user_id
     LEFT JOIN rooms r ON r.id = a.room_id
     WHERE a.duty_id = ?
     ORDER BY s.slotdate, s.slottime, a.slot_id, r.name, u.name`,
    [dutyId]
  );

  // Group: slots -> rooms -> users (+ reserved bucket)
  const slotMap = new Map();
  let generatedAt = null;
  for (const r of rows) {
    if (!generatedAt) generatedAt = r.generated_at;
    if (!slotMap.has(r.slot_id)) {
      slotMap.set(r.slot_id, {
        slot: {
          id: r.slot_id,
          slottext: r.slottext,
          slottime: r.slottime,
          slotdate: r.slotdate,
          requirement: Number(r.requirement),
        },
        rooms: new Map(),
        reserved: [],
      });
    }
    const entry = slotMap.get(r.slot_id);
    const user = {
      id: r.user_id,
      name: r.user_name,
      role: r.user_role,
      employeeid: r.employeeid,
      email: r.email,
      department: r.department,
    };
    if (r.room_id == null) {
      entry.reserved.push(user);
    } else {
      if (!entry.rooms.has(r.room_id)) {
        entry.rooms.set(r.room_id, {
          room: { id: r.room_id, name: r.room_name, need: Number(r.room_need) },
          users: [],
        });
      }
      entry.rooms.get(r.room_id).users.push(user);
    }
  }

  const slots = Array.from(slotMap.values()).map((e) => ({
    slot: e.slot,
    rooms: Array.from(e.rooms.values()),
    reserved: e.reserved,
  }));

  res.json({
    duty: dutyRow[0],
    generated_at: generatedAt,
    slots,
  });
}));

export default router;
