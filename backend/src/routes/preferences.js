import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, asyncHandler } from '../middleware.js';
import { canSeeDuty } from '../utils/access.js';

const router = Router();
router.use(requireAuth);

const ROLE_LIMIT_COLUMN = {
  'Professor': 'professor',
  'Assistant Professor': 'assistantprofessor',
  'Associate Professor': 'associateprofessor',
  'Research Scholar': 'researchscholar',
  'Special Role 1': 'specialrole1',
  'Special Role 2': 'specialrole2',
  'Special Role 3': 'specialrole3',
  'Special Role 4': 'specialrole4',
};

// Returns the duties column holding this role's quota, or null when the role
// has no quota column at all (Admin, or anything mistyped//unknown). Falling
// back to 'researchscholar' — as this used to — silently handed an unrecognised
// role someone else's allowance.
function limitColumnFor(role) {
  if (ROLE_LIMIT_COLUMN[role]) return ROLE_LIMIT_COLUMN[role];
  const normalized = String(role || '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return ROLE_LIMIT_COLUMN[normalized] || null;
}

// list my preferences for a duty
router.get('/', asyncHandler(async (req, res) => {
  const duty = Number(req.query.duty || 0);
  if (!duty) return res.json({ preferences: [] });
  const [rows] = await pool.query(
    `SELECT p.slotid FROM preferences p JOIN slot s ON p.slotid = s.id WHERE p.userid = ? AND s.duty = ?`,
    [req.user.id, duty]
  );
  res.json({ preferences: rows.map((r) => Number(r.slotid)) });
}));

// list all of my bookings, grouped by duty
router.get('/mine', asyncHandler(async (req, res) => {
  const [duties] = await pool.query(
    `SELECT DISTINCT d.id, d.title, d.academicsession, d.type, d.accepting_bookings, d.createdat
     FROM duties d
     INNER JOIN slot s ON s.duty = d.id
     INNER JOIN preferences p ON p.slotid = s.id
     WHERE p.userid = ?
     ORDER BY d.createdat DESC`,
    [req.user.id]
  );
  const out = [];
  for (const d of duties) {
    const [slots] = await pool.query(
      `SELECT s.id, s.slottext, s.slottime, s.slotdate
       FROM slot s INNER JOIN preferences p ON p.slotid = s.id
       WHERE s.duty = ? AND p.userid = ?
       ORDER BY s.slotdate, s.slottime`,
      [d.id, req.user.id]
    );
    out.push({ ...d, selected_slots: slots });
  }
  res.json({ bookings: out });
}));

// save preferences for a duty
router.post('/', asyncHandler(async (req, res) => {
  const duty = Number(req.body?.duty || 0);
  const slotIds = Array.isArray(req.body?.slot_ids) ? [...new Set(req.body.slot_ids.map(Number).filter(Boolean))] : [];
  if (!duty) return res.status(400).json({ error: 'Missing duty.' });

  // The duty listing is cohort-gated; booking has to be too, or a faculty
  // member could post preferences for a duty they were never targeted with.
  if (!(await canSeeDuty(req.user, duty))) {
    return res.status(404).json({ error: 'Duty not found.' });
  }

  const [dutyRows] = await pool.query(
    `SELECT professor, assistantprofessor, associateprofessor, researchscholar,
       specialrole1, specialrole2, specialrole3, specialrole4, accepting_bookings
     FROM duties WHERE id = ? LIMIT 1`,
    [duty]
  );
  const dutyRow = dutyRows[0];
  if (!dutyRow) return res.status(404).json({ error: 'Duty not found.' });
  if (Number(dutyRow.accepting_bookings) !== 1) {
    return res.status(400).json({ error: 'This duty is no longer accepting slot bookings.' });
  }

  // re-read user role from DB (matches PHP behavior)
  const [userRows] = await pool.query('SELECT role FROM users WHERE id = ? LIMIT 1', [req.user.id]);
  const role = userRows[0]?.role || req.user.role;
  const limitColumn = limitColumnFor(role);
  if (!limitColumn) {
    return res.status(400).json({ error: `Your role (${role}) has no slot quota for this duty.` });
  }
  // Clamp: a stored negative would otherwise pass both checks below and lift
  // the limit entirely.
  const roleLimit = Math.max(0, Number(dutyRow[limitColumn]) || 0);

  // Everything from here on runs in one transaction. The lock check and the
  // per-slot capacity check both used to sit outside it, so two people saving
  // at the same moment could each see the last seat as free and take it.
  //
  // Concurrent bookings contend for the same rows by design, and InnoDB
  // resolves some of that contention by killing one of the transactions. That
  // is a retryable outcome, not a failure: on the second pass the winner's rows
  // are committed and this request gets the real answer ("slot is full")
  // instead of a driver error.
  for (let attempt = 0; ; attempt++) {
    try {
      return await saveSelection(req, res, { duty, slotIds, roleLimit });
    } catch (e) {
      if (RETRYABLE.has(e.code) && attempt < 2) continue;
      throw e;
    }
  }
}));

const RETRYABLE = new Set(['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT']);

async function saveSelection(req, res, { duty, slotIds, roleLimit }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // lock check — FOR UPDATE so a concurrent double-submit from the same user
    // serialises behind us instead of inserting a second set of rows
    const [existing] = await conn.query(
      `SELECT p.id FROM preferences p JOIN slot s ON p.slotid = s.id
       WHERE p.userid = ? AND s.duty = ? FOR UPDATE`,
      [req.user.id, duty]
    );
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Preferences cannot be changed once saved.' });
    }

    // get valid (visible) slots for this duty — hidden slots can't be newly booked
    const [slotRows] = await conn.query(
      'SELECT id, slottext, requirement FROM slot WHERE duty = ? AND hidden = 0',
      [duty]
    );
    const slotMap = new Map(slotRows.map((s) => [Number(s.id), s]));
    const valid = slotIds.filter((id) => slotMap.has(id));

    if (roleLimit > 0 && valid.length !== roleLimit) {
      await conn.rollback();
      return res.status(400).json({ error: `Please select exactly ${roleLimit} slot(s) before saving.` });
    }
    if (roleLimit === 0 && valid.length > 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'You are not allowed to select slots for this duty.' });
    }

    // capacity check per selected slot. We hold no rows of our own for this
    // duty (checked above), so every counted row belongs to somebody else.
    // Ascending slot order keeps every booker taking locks in the same
    // sequence, which is what stops two multi-slot saves from deadlocking.
    for (const sid of [...valid].sort((a, b) => a - b)) {
      const slot = slotMap.get(sid);
      const reqN = Number(slot.requirement) || 0;
      if (reqN <= 0) {
        await conn.rollback();
        return res.status(400).json({ error: 'Selected slot is not available.' });
      }
      // Select the rows rather than COUNT(*) — a locking read of the actual
      // rows is unambiguous across MySQL/MariaDB versions, and a slot only ever
      // holds `requirement`-many.
      const [takenRows] = await conn.query(
        'SELECT id FROM preferences WHERE slotid = ? FOR UPDATE',
        [sid]
      );
      if (takenRows.length >= reqN) {
        await conn.rollback();
        return res.status(400).json({ error: `Slot "${slot.slottext}" is already full. Please choose another.` });
      }
    }

    for (const sid of valid) {
      await conn.query('INSERT INTO preferences (slotid, userid) VALUES (?, ?)', [sid, req.user.id]);
    }
    await conn.commit();
    return res.json({ saved: valid.length, role_limit: roleLimit });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export default router;