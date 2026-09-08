import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin, asyncHandler } from '../middleware.js';
import { canSeeDuty, isAdmin } from '../utils/access.js';

const router = Router();
router.use(requireAuth);

// list slots for a duty, including applicant counts.
// Admins see every slot (with `hidden` field); everyone else gets only visible slots.
router.get('/', asyncHandler(async (req, res) => {
  const duty = Number(req.query.duty || 0);
  if (!duty) return res.json({ slots: [] });
  // Same cohort gate as /api/duties — otherwise a faculty member could read the
  // slots of a duty they were never targeted with just by guessing its id.
  if (!(await canSeeDuty(req.user, duty))) return res.json({ slots: [] });
  const filter = isAdmin(req.user) ? '' : 'AND s.hidden = 0';
  const [rows] = await pool.query(
    `SELECT s.id, s.duty, s.slottext, s.slottime, s.slotdate, s.requirement, s.hidden,
       (SELECT COUNT(*) FROM preferences p WHERE p.slotid = s.id) AS applicants
     FROM slot s WHERE s.duty = ? ${filter} ORDER BY s.slotdate, s.slottime`,
    [duty]
  );
  res.json({
    slots: rows.map((r) => ({ ...r, applicants: Number(r.applicants), hidden: Number(r.hidden) })),
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await pool.query(
    `SELECT s.id, s.slottext, s.slottime, s.slotdate, s.requirement, s.hidden, s.duty,
       d.title AS duty_title, d.academicsession, d.type
     FROM slot s LEFT JOIN duties d ON s.duty = d.id WHERE s.id = ? LIMIT 1`,
    [id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Slot not found.' });
  if (!(await canSeeDuty(req.user, rows[0].duty))) return res.status(404).json({ error: 'Slot not found.' });
  if (!isAdmin(req.user) && Number(rows[0].hidden) === 1) {
    return res.status(404).json({ error: 'Slot not found.' });
  }
  res.json({ slot: { ...rows[0], hidden: Number(rows[0].hidden) } });
}));

router.patch('/:id/visibility', requireAdmin, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const hidden = req.body?.hidden ? 1 : 0;
  const [result] = await pool.query('UPDATE slot SET hidden = ? WHERE id = ?', [hidden, id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Slot not found.' });
  res.json({ hidden });
}));

// participants for a slot — admin only: the rows carry personal contact details
// of everyone who booked, and the only caller is the admin applicants page.
router.get('/:id/participants', requireAdmin, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.department, u.employeeid
     FROM preferences p JOIN users u ON p.userid = u.id WHERE p.slotid = ? ORDER BY u.name`,
    [id]
  );
  res.json({ participants: rows });
}));

router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const { duty, slottext, slottime, slotdate, requirement } = req.body || {};
  const req_n = Number(requirement);
  if (!duty || !slottext || !slottime || !slotdate || Number.isNaN(req_n) || req_n < 0) {
    return res.status(400).json({ error: 'All fields are required and requirement must be non-negative.' });
  }
  const [dutyRow] = await pool.query('SELECT id FROM duties WHERE id = ? LIMIT 1', [Number(duty)]);
  if (!dutyRow.length) return res.status(404).json({ error: 'Duty not found.' });
  const [result] = await pool.query(
    'INSERT INTO slot (duty, slottext, slottime, slotdate, requirement) VALUES (?, ?, ?, ?, ?)',
    [Number(duty), slottext, slottime, slotdate, req_n]
  );
  res.status(201).json({ id: result.insertId });
}));

router.put('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { slottext, slottime, slotdate, requirement } = req.body || {};
  const req_n = Number(requirement);
  if (!slottext || !slottime || !slotdate || Number.isNaN(req_n) || req_n < 0) {
    return res.status(400).json({ error: 'All fields are required and requirement must be non-negative.' });
  }
  await pool.query(
    'UPDATE slot SET slottext = ?, slottime = ?, slotdate = ?, requirement = ? WHERE id = ?',
    [slottext, slottime, slotdate, req_n, id]
  );
  res.json({ message: 'Slot updated.' });
}));

// The legacy schema has no foreign keys, so every dependent row has to be
// cleared here or it survives as an orphan pointing at a slot that is gone.
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM preferences WHERE slotid = ?', [id]);
    await conn.query('DELETE FROM attendance WHERE slot_id = ?', [id]);
    await conn.query('DELETE FROM allocations WHERE slot_id = ?', [id]);
    const [result] = await conn.query('DELETE FROM slot WHERE id = ?', [id]);
    if (!result.affectedRows) {
      await conn.rollback();
      return res.status(404).json({ error: 'Slot not found.' });
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  res.json({ message: 'Slot deleted.' });
}));

// auto-generate: dates × templates
router.post('/generate', requireAdmin, asyncHandler(async (req, res) => {
  const { duty, dates, templates } = req.body || {};
  const dutyId = Number(duty);
  if (!dutyId) return res.status(400).json({ error: 'Missing duty.' });
  if (!Array.isArray(dates) || dates.length === 0) return res.status(400).json({ error: 'Please add at least one date.' });
  if (!Array.isArray(templates) || templates.length === 0) return res.status(400).json({ error: 'Please provide slot details.' });

  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  const cleanDates = [...new Set(dates.filter((d) => typeof d === 'string' && isoDate.test(d)))];
  if (!cleanDates.length) return res.status(400).json({ error: 'No valid dates.' });

  const cleanTemplates = [];
  for (const t of templates) {
    const text = (t?.slottext ?? t?.text ?? '').toString().trim();
    const time = (t?.slottime ?? t?.time ?? '').toString().trim();
    const reqN = Number(t?.requirement);
    if (!text || !time || Number.isNaN(reqN) || reqN < 0) {
      return res.status(400).json({ error: 'All slot fields are required and requirement must be non-negative.' });
    }
    cleanTemplates.push({ text, time, requirement: reqN });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let generated = 0;
    for (const d of cleanDates) {
      for (const t of cleanTemplates) {
        await conn.query(
          'INSERT INTO slot (duty, slottext, slottime, slotdate, requirement) VALUES (?, ?, ?, ?, ?)',
          [dutyId, t.text, t.time, d, t.requirement]
        );
        generated++;
      }
    }
    await conn.commit();
    res.json({ generated, dates: cleanDates.length });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

export default router;
