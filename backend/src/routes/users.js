import { Router } from 'express';
import { pool, addToSystemCohort } from '../db.js';
import { hashPassword } from '../auth.js';
import { requireAuth, requireAdmin, asyncHandler } from '../middleware.js';

const router = Router();
router.use(requireAuth, requireAdmin);

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

// users.employeeid is UNIQUE in the schema — catch the collision so the admin
// gets a usable message instead of a raw driver error as a 500.
const DUP_EMPLOYEE_ID = 'An account with this employee ID already exists.';

const PHONE_RE = /^[0-9+\-() ]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/users
//   With no query: full list ordered by id (used by /admin/users).
//   With ?q=…: substring match on name/email/employeeid, capped for typeahead use.
router.get('/', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q) {
    const like = `%${q}%`;
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const [rows] = await pool.query(
      `SELECT id, employeeid, name, email, phone, role, department FROM users
       WHERE name LIKE ? OR email LIKE ? OR employeeid LIKE ?
       ORDER BY name LIMIT ?`,
      [like, like, like, limit]
    );
    return res.json({ users: rows });
  }
  const [rows] = await pool.query(
    'SELECT id, employeeid, name, email, phone, role, department FROM users ORDER BY id'
  );
  res.json({ users: rows });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { employeeid, name, email, phone, password, role, department } = req.body || {};
  if (!employeeid || !name || !phone || !password || !role) {
    return res.status(400).json({ error: 'Employee ID, Name, Phone, Password, and Role are required.' });
  }
  if (email && !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Invalid email format.' });
  if (!PHONE_RE.test(phone)) return res.status(400).json({ error: 'Invalid phone number format.' });
  if (!VALID_ROLES.has(role)) return res.status(400).json({ error: 'Invalid role.' });
  const hashed = await hashPassword(password);
  let result;
  try {
    [result] = await pool.query(
      'INSERT INTO users (employeeid, name, email, phone, pass, role, department) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [employeeid, name, email || null, phone, hashed, role, department || null]
    );
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: DUP_EMPLOYEE_ID });
    throw e;
  }
  // Every new user joins the system-default cohort automatically
  await addToSystemCohort(result.insertId);
  res.status(201).json({ id: result.insertId });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { employeeid, name, email, phone, role, new_password, confirm_new_password, department } = req.body || {};
  if (!id || !employeeid || !name || !phone || !role) {
    return res.status(400).json({ error: 'Employee ID, Name, Phone, and Role are required.' });
  }
  if (email && !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Invalid email format.' });
  if (!PHONE_RE.test(phone)) return res.status(400).json({ error: 'Invalid phone number format.' });
  if (!VALID_ROLES.has(role)) return res.status(400).json({ error: 'Invalid role.' });
  try {
    if (new_password || confirm_new_password) {
      if (new_password !== confirm_new_password) return res.status(400).json({ error: 'New passwords do not match.' });
      if (new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters.' });
      const hashed = await hashPassword(new_password);
      await pool.query(
        'UPDATE users SET employeeid = ?, name = ?, email = ?, phone = ?, role = ?, department = ?, pass = ? WHERE id = ?',
        [employeeid, name, email || null, phone, role, department || null, hashed, id]
      );
    } else {
      await pool.query(
        'UPDATE users SET employeeid = ?, name = ?, email = ?, phone = ?, role = ?, department = ? WHERE id = ?',
        [employeeid, name, email || null, phone, role, department || null, id]
      );
    }
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: DUP_EMPLOYEE_ID });
    throw e;
  }
  res.json({ message: 'User updated.' });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid user id.' });
  if (id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account.' });
  // Cascade-clean: no FKs in the legacy schema, so wipe dependent rows ourselves
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM preferences WHERE userid = ?', [id]);
    await conn.query('DELETE FROM cohort_members WHERE user_id = ?', [id]);
    await conn.query('DELETE FROM allocations WHERE user_id = ?', [id]);
    await conn.query('DELETE FROM attendance WHERE user_id = ?', [id]);
    const [result] = await conn.query('DELETE FROM users WHERE id = ?', [id]);
    if (!result.affectedRows) {
      await conn.rollback();
      return res.status(404).json({ error: 'Not found.' });
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  res.json({ message: 'User deleted.' });
}));

export default router;
