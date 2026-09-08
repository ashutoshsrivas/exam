import { Router } from 'express';
import { pool } from '../db.js';
import { signToken, verifyPassword, hashPassword } from '../auth.js';
import { requireAuth, asyncHandler, loginRateLimit, clearLoginAttempts } from '../middleware.js';

const router = Router();

router.post('/login', loginRateLimit, asyncHandler(async (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) return res.status(400).json({ error: 'Missing credentials' });

  // name is not unique in the schema, so a bare "match any of the three" could
  // resolve to an arbitrary row. Rank the unique identifiers first and settle
  // ties by id, so the same input always resolves to the same account.
  const [rows] = await pool.query(
    `SELECT id, name, email, employeeid, pass, role FROM users
     WHERE employeeid = ? OR email = ? OR name = ?
     ORDER BY (employeeid = ?) DESC, (email = ?) DESC, id
     LIMIT 1`,
    [identifier, identifier, identifier, identifier, identifier]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'User not found' });

  const { ok, needsUpgrade } = await verifyPassword(password, user.pass);
  if (!ok) return res.status(401).json({ error: 'Invalid password' });

  if (needsUpgrade) {
    const newHash = await hashPassword(password);
    await pool.query('UPDATE users SET pass = ? WHERE id = ?', [newHash, user.id]);
  }

  clearLoginAttempts(req);
  const token = signToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      employeeid: user.employeeid,
      role: user.role,
    },
  });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, employeeid, phone, role, department FROM users WHERE id = ? LIMIT 1',
    [req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json({ user: rows[0] });
}));

router.post('/change-password', requireAuth, asyncHandler(async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body || {};
  if (!current_password || !new_password || !confirm_password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (new_password !== confirm_password) {
    return res.status(400).json({ error: 'New passwords do not match.' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  const [rows] = await pool.query('SELECT pass FROM users WHERE id = ? LIMIT 1', [req.user.id]);
  const stored = rows[0]?.pass || '';
  const { ok } = await verifyPassword(current_password, stored);
  if (!ok) return res.status(400).json({ error: 'Current password is incorrect.' });
  const hashed = await hashPassword(new_password);
  await pool.query('UPDATE users SET pass = ? WHERE id = ?', [hashed, req.user.id]);
  res.json({ message: 'Password updated successfully.' });
}));

export default router;
