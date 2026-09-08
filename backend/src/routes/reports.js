import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin, asyncHandler } from '../middleware.js';
import { sendCsv } from '../utils/csv.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const USER_COLS = 'u.id, u.name, u.email, u.phone, u.department, u.employeeid, u.role';

async function runReport(type, dutyId, slotId) {
  if (type === 'slot_attendees') {
    const [rows] = await pool.query(
      `SELECT ${USER_COLS} FROM preferences p JOIN users u ON p.userid = u.id WHERE p.slotid = ? ORDER BY u.name`,
      [slotId]
    );
    return { rows, kind: 'users' };
  }
  if (type === 'duty_opted') {
    const [rows] = await pool.query(
      `SELECT DISTINCT ${USER_COLS} FROM preferences p JOIN slot s ON p.slotid = s.id JOIN users u ON p.userid = u.id WHERE s.duty = ? ORDER BY u.name`,
      [dutyId]
    );
    return { rows, kind: 'users' };
  }
  if (type === 'duty_not_opted') {
    // "Did not opt" only means something for people who could have: the members
    // of the duty's cohort. Listing every user in the database (admins, and
    // everyone the duty was never offered to) reports them as delinquent for a
    // duty they could not see. NOT EXISTS rather than NOT IN — preferences.userid
    // is nullable, and a single NULL makes NOT IN return nothing at all.
    const [rows] = await pool.query(
      `SELECT ${USER_COLS}
       FROM users u
       JOIN duties d ON d.id = ?
       JOIN cohort_members m ON m.cohort_id = d.cohort_id AND m.user_id = u.id
       WHERE NOT EXISTS (
         SELECT 1 FROM preferences p JOIN slot s ON p.slotid = s.id
         WHERE s.duty = d.id AND p.userid = u.id
       )
       ORDER BY u.name`,
      [dutyId]
    );
    return { rows, kind: 'users' };
  }
  if (type === 'duty_slotwise') {
    const [rows] = await pool.query(
      `SELECT s.id AS slot_id, s.slottext, s.slotdate, s.slottime, u.id AS user_id,
        u.name, u.email, u.phone, u.department, u.employeeid, u.role
       FROM slot s LEFT JOIN preferences p ON p.slotid = s.id LEFT JOIN users u ON p.userid = u.id
       WHERE s.duty = ? ORDER BY s.slotdate, s.slottime, u.name`,
      [dutyId]
    );
    return { rows, kind: 'slotwise' };
  }
  if (type === 'duty_userwise') {
    const [rows] = await pool.query(
      `SELECT u.id AS user_id, u.name, u.email, u.phone, u.department, u.employeeid, u.role,
        s.id AS slot_id, s.slottext, s.slotdate, s.slottime
       FROM preferences p JOIN slot s ON p.slotid = s.id JOIN users u ON p.userid = u.id
       WHERE s.duty = ? ORDER BY u.name, s.slotdate, s.slottime`,
      [dutyId]
    );
    return { rows, kind: 'userwise' };
  }
  return null;
}

router.get('/', asyncHandler(async (req, res) => {
  const type = String(req.query.type || '');
  const duty = Number(req.query.duty || 0);
  const slot = Number(req.query.slot || 0);
  const csv = req.query.csv === '1';

  const result = await runReport(type, duty, slot);
  if (!result) return res.status(400).json({ error: 'Invalid report type.' });

  if (!csv) return res.json({ kind: result.kind, rows: result.rows });

  if (result.kind === 'slotwise') {
    sendCsv(res, `duty_${duty}_slotwise.csv`,
      ['SlotID', 'Slot', 'SlotDate', 'SlotTime', 'UserID', 'Name', 'Email', 'Phone', 'Department', 'EmployeeID', 'Role'],
      result.rows.map((r) => [r.slot_id, r.slottext, r.slotdate, r.slottime, r.user_id, r.name, r.email, r.phone, r.department, r.employeeid, r.role])
    );
    return;
  }
  if (result.kind === 'userwise') {
    sendCsv(res, `duty_${duty}_userwise.csv`,
      ['UserID', 'Name', 'Email', 'Phone', 'Department', 'EmployeeID', 'Role', 'SlotID', 'Slot', 'SlotDate', 'SlotTime'],
      result.rows.map((r) => [r.user_id, r.name, r.email, r.phone, r.department, r.employeeid, r.role, r.slot_id, r.slottext, r.slotdate, r.slottime])
    );
    return;
  }
  const filename =
    type === 'slot_attendees' ? `slot_${slot}_attendees.csv` :
    type === 'duty_opted' ? `duty_${duty}_opted.csv` :
    `duty_${duty}_not_opted.csv`;
  sendCsv(res, filename,
    ['ID', 'Name', 'Email', 'Phone', 'Department', 'EmployeeID', 'Role'],
    result.rows.map((r) => [r.id, r.name, r.email, r.phone, r.department, r.employeeid, r.role])
  );
}));

export default router;
