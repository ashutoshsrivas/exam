import { Router } from 'express';
import { pool, addToSystemCohort } from '../db.js';
import { hashPassword } from '../auth.js';
import { requireAuth, requireAdmin, asyncHandler } from '../middleware.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const DEFAULT_PASSWORD = '12345678';
const VALID_ROLES = new Set([
  'Admin',
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'Research Scholar',
  'Special Role 1',
  'Special Role 2',
  'Special Role 3',
  'Special Role 4',
]);
const PHONE_RE = /^[0-9+\-() ]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Accept common variants/abbreviations and normalize to one of VALID_ROLES.
// Returns null if no reasonable match.
const ROLE_ALIASES = new Map([
  ['admin', 'Admin'],
  ['administrator', 'Admin'],
  ['professor', 'Professor'],
  ['prof', 'Professor'],
  ['assistant professor', 'Assistant Professor'],
  ['asst professor', 'Assistant Professor'],
  ['asst. professor', 'Assistant Professor'],
  ['assistant prof', 'Assistant Professor'],
  ['asst prof', 'Assistant Professor'],
  ['asst. prof', 'Assistant Professor'],
  ['ap', 'Assistant Professor'],
  ['associate professor', 'Associate Professor'],
  ['assoc professor', 'Associate Professor'],
  ['assoc. professor', 'Associate Professor'],
  ['associate prof', 'Associate Professor'],
  ['assoc prof', 'Associate Professor'],
  ['assoc. prof', 'Associate Professor'],
  ['research scholar', 'Research Scholar'],
  ['scholar', 'Research Scholar'],
  ['phd scholar', 'Research Scholar'],
  ['rs', 'Research Scholar'],
  ['special role 1', 'Special Role 1'],
  ['special role 2', 'Special Role 2'],
  ['special role 3', 'Special Role 3'],
  ['special role 4', 'Special Role 4'],
  ['special1', 'Special Role 1'],
  ['special2', 'Special Role 2'],
  ['special3', 'Special Role 3'],
  ['special4', 'Special Role 4'],
]);

function normalizeRole(raw) {
  if (!raw) return null;
  const key = String(raw)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  if (ROLE_ALIASES.has(key)) return ROLE_ALIASES.get(key);
  // Also try matching the canonical set case-insensitively
  for (const r of VALID_ROLES) {
    if (r.toLowerCase() === key) return r;
  }
  return null;
}

router.get('/', asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT c.id, c.name, c.description, c.createdat, c.system_default,
      (SELECT COUNT(*) FROM cohort_members m WHERE m.cohort_id = c.id) AS member_count,
      (SELECT COUNT(*) FROM duties d WHERE d.cohort_id = c.id) AS duty_count
    FROM cohorts c
    ORDER BY c.system_default DESC, c.createdat DESC
  `);
  res.json({
    cohorts: rows.map((r) => ({
      ...r,
      system_default: Number(r.system_default),
      member_count: Number(r.member_count),
      duty_count: Number(r.duty_count),
    })),
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await pool.query(
    'SELECT id, name, description, createdat, system_default FROM cohorts WHERE id = ? LIMIT 1',
    [id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Cohort not found.' });
  rows[0].system_default = Number(rows[0].system_default);
  const [members] = await pool.query(
    `SELECT u.id, u.employeeid, u.name, u.email, u.phone, u.role, u.department, m.addedat
     FROM cohort_members m JOIN users u ON u.id = m.user_id
     WHERE m.cohort_id = ?
     ORDER BY u.name`,
    [id]
  );
  const [duties] = await pool.query(
    `SELECT id, title, academicsession, type, accepting_bookings FROM duties WHERE cohort_id = ? ORDER BY createdat DESC`,
    [id]
  );
  res.json({ cohort: rows[0], members, duties });
}));

router.post('/', asyncHandler(async (req, res) => {
  const name = (req.body?.name || '').trim();
  const description = (req.body?.description || '').trim() || null;
  const userIds = Array.isArray(req.body?.user_ids) ? req.body.user_ids.map(Number).filter(Boolean) : [];
  const addAll = !!req.body?.add_all_users;
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  try {
    const [insert] = await pool.query('INSERT INTO cohorts (name, description) VALUES (?, ?)', [name, description]);
    const cohortId = insert.insertId;
    if (addAll) {
      await pool.query('INSERT INTO cohort_members (cohort_id, user_id) SELECT ?, id FROM users', [cohortId]);
    } else if (userIds.length) {
      const values = userIds.map(() => '(?, ?)').join(',');
      const params = userIds.flatMap((u) => [cohortId, u]);
      await pool.query(`INSERT IGNORE INTO cohort_members (cohort_id, user_id) VALUES ${values}`, params);
    }
    res.status(201).json({ id: cohortId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'A cohort with this name already exists.' });
    throw e;
  }
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const name = (req.body?.name || '').trim();
  const description = (req.body?.description || '').trim() || null;
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  try {
    await pool.query('UPDATE cohorts SET name = ?, description = ? WHERE id = ?', [name, description, id]);
    res.json({ message: 'Cohort updated.' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'A cohort with this name already exists.' });
    throw e;
  }
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [check] = await pool.query('SELECT system_default FROM cohorts WHERE id = ? LIMIT 1', [id]);
  if (!check[0]) return res.status(404).json({ error: 'Cohort not found.' });
  if (Number(check[0].system_default) === 1) {
    return res.status(400).json({
      error: 'The default cohort is protected and cannot be deleted. Every new user is automatically added to it.',
    });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE duties SET cohort_id = NULL WHERE cohort_id = ?', [id]);
    await conn.query('DELETE FROM cohort_members WHERE cohort_id = ?', [id]);
    await conn.query('DELETE FROM cohorts WHERE id = ?', [id]);
    await conn.commit();
    res.json({ message: 'Cohort deleted.' });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// Add existing users to a cohort by user_ids, or add ALL users (?all=1)
router.post('/:id/members', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const addAll = !!req.body?.add_all_users;
  const userIds = Array.isArray(req.body?.user_ids) ? req.body.user_ids.map(Number).filter(Boolean) : [];
  if (addAll) {
    const [result] = await pool.query(
      'INSERT IGNORE INTO cohort_members (cohort_id, user_id) SELECT ?, id FROM users',
      [id]
    );
    return res.json({ added: result.affectedRows });
  }
  if (!userIds.length) return res.status(400).json({ error: 'No user IDs supplied.' });
  const values = userIds.map(() => '(?, ?)').join(',');
  const params = userIds.flatMap((u) => [id, u]);
  const [result] = await pool.query(`INSERT IGNORE INTO cohort_members (cohort_id, user_id) VALUES ${values}`, params);
  res.json({ added: result.affectedRows });
}));

router.delete('/:id/members/:userId', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const userId = Number(req.params.userId);
  const [result] = await pool.query(
    'DELETE FROM cohort_members WHERE cohort_id = ? AND user_id = ?',
    [id, userId]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Member not in cohort.' });
  res.json({ message: 'Member removed.' });
}));

// Bulk create-or-match users by employeeid, then add to cohort.
// Body: { users: [{ employeeid, name, email?, phone, role, department?, password? }] }
// Returns: { created, matched, failed, member_added, errors }
router.post('/:id/members/import-users', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const incoming = Array.isArray(req.body?.users) ? req.body.users : [];
  if (!incoming.length) return res.status(400).json({ error: 'No user rows supplied.' });

  // Cohort exists?
  const [cohort] = await pool.query('SELECT id FROM cohorts WHERE id = ? LIMIT 1', [id]);
  if (!cohort.length) return res.status(404).json({ error: 'Cohort not found.' });

  const conn = await pool.getConnection();
  let created = 0;
  let matched = 0;
  let memberAdded = 0;
  const errors = [];

  try {
    await conn.beginTransaction();

    for (let idx = 0; idx < incoming.length; idx++) {
      const raw = incoming[idx] || {};
      const employeeid = String(raw.employeeid || '').trim();
      const name = String(raw.name || '').trim();
      const email = String(raw.email || '').trim() || null;
      // Phones in spreadsheets often come with extra characters (".", "/", x for ext, etc.)
      // Strip anything outside the regex's accepted set; PHONE_RE then only fails on length.
      const rawPhone = String(raw.phone || '').trim();
      const phone = rawPhone.replace(/[^0-9+\-() ]/g, '').replace(/\s+/g, ' ').trim();
      const rawRole = String(raw.role || '').trim();
      const role = normalizeRole(rawRole);
      const department = String(raw.department || '').trim() || null;
      const password = String(raw.password || '').trim() || DEFAULT_PASSWORD;

      // Validation (gentler than the strict users endpoint so bulk imports survive partial rows)
      if (!employeeid) { errors.push({ row: idx + 1, message: 'Missing employee ID' }); continue; }
      if (!name) { errors.push({ row: idx + 1, employeeid, message: 'Missing name' }); continue; }
      if (!rawRole) { errors.push({ row: idx + 1, employeeid, message: 'Missing role' }); continue; }
      if (!role) { errors.push({ row: idx + 1, employeeid, message: `Unknown role "${rawRole}" — expected one of: Admin, Professor, Associate Professor, Assistant Professor, Research Scholar, Special Role 1–4` }); continue; }
      if (email && !EMAIL_RE.test(email)) { errors.push({ row: idx + 1, employeeid, message: `Invalid email "${email}"` }); continue; }
      if (phone && !PHONE_RE.test(phone)) { errors.push({ row: idx + 1, employeeid, message: `Invalid phone "${rawPhone}"` }); continue; }

      // Match-or-create by employeeid (case-sensitive — matches PHP behavior)
      const [existing] = await conn.query('SELECT id FROM users WHERE employeeid = ? LIMIT 1', [employeeid]);
      let userId;
      if (existing[0]) {
        userId = existing[0].id;
        matched++;
      } else {
        const hashed = await hashPassword(password);
        const [insert] = await conn.query(
          'INSERT INTO users (employeeid, name, email, phone, pass, role, department) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [employeeid, name, email, phone || null, hashed, role, department]
        );
        userId = insert.insertId;
        created++;
        // New user → always joins the system-default cohort too
        await addToSystemCohort(userId, conn);
      }

      const [add] = await conn.query(
        'INSERT IGNORE INTO cohort_members (cohort_id, user_id) VALUES (?, ?)',
        [id, userId]
      );
      memberAdded += add.affectedRows;
    }

    await conn.commit();
    res.json({
      created,
      matched,
      member_added: memberAdded,
      failed: errors.length,
      errors,
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

export default router;
