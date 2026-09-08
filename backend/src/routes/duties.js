import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin, asyncHandler } from '../middleware.js';

const router = Router();
router.use(requireAuth);

const SELECT_COLS = `d.id, d.title, d.academicsession, d.type, d.professor, d.assistantprofessor,
  d.associateprofessor, d.researchscholar, d.specialrole1, d.specialrole2, d.specialrole3, d.specialrole4,
  d.accepting_bookings, d.createdat, d.cohort_id, c.name AS cohort_name`;

// list duties — admin sees all, non-admin only sees those in cohorts they belong to AND accepting bookings.
// A duty with cohort_id IS NULL is visible to nobody (admin-only).
router.get('/', asyncHandler(async (req, res) => {
  const onlyOpen = req.query.accepting === '1';
  const isAdmin = String(req.user.role).toLowerCase() === 'admin';

  let sql = `SELECT ${SELECT_COLS} FROM duties d LEFT JOIN cohorts c ON c.id = d.cohort_id`;
  const where = [];
  const params = [];
  if (!isAdmin) {
    where.push('d.accepting_bookings = 1');
    where.push('d.cohort_id IS NOT NULL');
    where.push('d.cohort_id IN (SELECT cohort_id FROM cohort_members WHERE user_id = ?)');
    params.push(req.user.id);
  } else if (onlyOpen) {
    where.push('d.accepting_bookings = 1');
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY d.createdat DESC';

  const [rows] = await pool.query(sql, params);
  if (!rows.length) return res.json({ duties: [] });
  const ids = rows.map((r) => r.id);
  const [counts] = await pool.query(
    `SELECT duty AS id, COUNT(*) AS slot_count FROM slot WHERE duty IN (${ids.map(() => '?').join(',')}) GROUP BY duty`,
    ids
  );
  const countMap = new Map(counts.map((c) => [c.id, Number(c.slot_count)]));
  res.json({ duties: rows.map((r) => ({ ...r, slot_count: countMap.get(r.id) || 0 })) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await pool.query(
    `SELECT ${SELECT_COLS} FROM duties d LEFT JOIN cohorts c ON c.id = d.cohort_id WHERE d.id = ?`,
    [id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  // Authorize: a non-admin can only fetch a duty in one of their cohorts
  const isAdmin = String(req.user.role).toLowerCase() === 'admin';
  if (!isAdmin) {
    if (!rows[0].cohort_id) return res.status(404).json({ error: 'Not found' });
    const [member] = await pool.query(
      'SELECT 1 FROM cohort_members WHERE cohort_id = ? AND user_id = ? LIMIT 1',
      [rows[0].cohort_id, req.user.id]
    );
    if (!member.length) return res.status(404).json({ error: 'Not found' });
  }
  res.json({ duty: rows[0] });
}));

// A quota is a whole, non-negative count. Anything else (a negative number, a
// non-numeric body field) is clamped to 0 rather than reaching the duty row —
// a stored negative used to satisfy neither branch of the check in
// preferences.js, which silently removed the limit for that role.
function limit(...candidates) {
  const raw = candidates.find((v) => v !== undefined && v !== null && v !== '');
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function parseLimits(body) {
  return {
    professor: limit(body.professor),
    assistantprofessor: limit(body.assistant, body.assistantprofessor),
    associateprofessor: limit(body.associate, body.associateprofessor),
    researchscholar: limit(body.research, body.researchscholar),
    specialrole1: limit(body.special1, body.specialrole1),
    specialrole2: limit(body.special2, body.specialrole2),
    specialrole3: limit(body.special3, body.specialrole3),
    specialrole4: limit(body.special4, body.specialrole4),
  };
}

function parseCohortId(body) {
  if (body.cohort_id === undefined || body.cohort_id === '' || body.cohort_id === null) return null;
  const n = Number(body.cohort_id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const { title, academicsession, type } = req.body || {};
  if (!title || !academicsession || !type) return res.status(400).json({ error: 'All fields are required.' });
  const l = parseLimits(req.body);
  const cohortId = parseCohortId(req.body);
  const [result] = await pool.query(
    `INSERT INTO duties (title, academicsession, type, professor, assistantprofessor, associateprofessor,
      researchscholar, specialrole1, specialrole2, specialrole3, specialrole4, cohort_id, createdat)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [title, academicsession, type, l.professor, l.assistantprofessor, l.associateprofessor,
      l.researchscholar, l.specialrole1, l.specialrole2, l.specialrole3, l.specialrole4, cohortId]
  );
  res.status(201).json({ id: result.insertId });
}));

router.put('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { title, academicsession, type } = req.body || {};
  if (!title || !academicsession || !type) return res.status(400).json({ error: 'All fields are required.' });
  const l = parseLimits(req.body);
  const cohortId = parseCohortId(req.body);
  await pool.query(
    `UPDATE duties SET title = ?, academicsession = ?, type = ?, professor = ?, assistantprofessor = ?,
      associateprofessor = ?, researchscholar = ?, specialrole1 = ?, specialrole2 = ?, specialrole3 = ?,
      specialrole4 = ?, cohort_id = ? WHERE id = ?`,
    [title, academicsession, type, l.professor, l.assistantprofessor, l.associateprofessor,
      l.researchscholar, l.specialrole1, l.specialrole2, l.specialrole3, l.specialrole4, cohortId, id]
  );
  res.json({ message: 'Duty updated.' });
}));

// No foreign keys in the legacy schema — clear the whole subtree (slots and
// everything hanging off them) here, or those rows outlive the duty and keep
// inflating /api/stats and the reports.
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE p FROM preferences p JOIN slot s ON s.id = p.slotid WHERE s.duty = ?', [id]);
    await conn.query('DELETE a FROM attendance a JOIN slot s ON s.id = a.slot_id WHERE s.duty = ?', [id]);
    await conn.query('DELETE FROM allocations WHERE duty_id = ?', [id]);
    await conn.query('DELETE FROM slot WHERE duty = ?', [id]);
    const [result] = await conn.query('DELETE FROM duties WHERE id = ?', [id]);
    if (!result.affectedRows) {
      await conn.rollback();
      return res.status(404).json({ error: 'Duty not found.' });
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  res.json({ message: 'Duty deleted.' });
}));

router.patch('/:id/booking-status', requireAdmin, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { accepting_bookings } = req.body || {};
  const value = accepting_bookings ? 1 : 0;
  await pool.query('UPDATE duties SET accepting_bookings = ? WHERE id = ?', [value, id]);
  res.json({ accepting_bookings: value });
}));

export default router;
