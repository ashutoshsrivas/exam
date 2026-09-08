import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin, asyncHandler } from '../middleware.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/', asyncHandler(async (_req, res) => {
  const [[u]] = await pool.query('SELECT COUNT(*) AS n FROM users');
  const [[d]] = await pool.query('SELECT COUNT(*) AS n FROM duties');
  const [[dOpen]] = await pool.query('SELECT COUNT(*) AS n FROM duties WHERE accepting_bookings = 1');
  const [[s]] = await pool.query('SELECT COUNT(*) AS n FROM slot');
  const [[p]] = await pool.query('SELECT COUNT(*) AS n FROM preferences');
  const [[r]] = await pool.query('SELECT COUNT(*) AS n FROM rooms');

  res.json({
    users: Number(u.n),
    duties: Number(d.n),
    duties_open: Number(dOpen.n),
    slots: Number(s.n),
    preferences: Number(p.n),
    rooms: Number(r.n),
  });
}));

export default router;
