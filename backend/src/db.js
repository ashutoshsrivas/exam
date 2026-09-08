import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'exam',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: false,
});

export async function ensureSchema() {
  const [phone] = await pool.query("SHOW COLUMNS FROM users LIKE 'phone'");
  if (!phone.length) {
    await pool.query("ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL AFTER email");
  }
  const [hidden] = await pool.query("SHOW COLUMNS FROM slot LIKE 'hidden'");
  if (!hidden.length) {
    await pool.query("ALTER TABLE slot ADD COLUMN hidden TINYINT(1) NOT NULL DEFAULT 0");
  }

  // Cohorts: named groups of users that duties can target
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cohorts (
      id INT NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      description VARCHAR(500) DEFAULT NULL,
      createdat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_cohort_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cohort_members (
      cohort_id INT NOT NULL,
      user_id INT NOT NULL,
      addedat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (cohort_id, user_id),
      KEY idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  const [cohortCol] = await pool.query("SHOW COLUMNS FROM duties LIKE 'cohort_id'");
  if (!cohortCol.length) {
    await pool.query("ALTER TABLE duties ADD COLUMN cohort_id INT DEFAULT NULL");
  }

  // Attendance: who was ACTUALLY present in each seat of each room per slot.
  // Distinct from allocations (planned) — this is the ground-truth roll-call.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INT NOT NULL AUTO_INCREMENT,
      slot_id INT NOT NULL,
      room_id INT NOT NULL,
      seat_index INT NOT NULL,
      user_id INT NOT NULL,
      marked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      marked_by INT DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_seat (slot_id, room_id, seat_index),
      UNIQUE KEY uniq_user_per_slot (slot_id, user_id),
      KEY idx_slot (slot_id),
      KEY idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  // Allocations: who is invigilating which slot, in which room. room_id NULL
  // means "reserved" (not on the public list, kept as backup). Unique key ensures
  // a user is only allocated once per slot in a duty.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS allocations (
      id INT NOT NULL AUTO_INCREMENT,
      duty_id INT NOT NULL,
      slot_id INT NOT NULL,
      user_id INT NOT NULL,
      room_id INT DEFAULT NULL,
      generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_alloc (duty_id, slot_id, user_id),
      KEY idx_duty (duty_id),
      KEY idx_user (user_id),
      KEY idx_room (room_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  // preferences carries no constraint in the legacy schema, so a retry or a
  // concurrent save could store the same user twice for one slot — which would
  // then double-count against slot.requirement. Collapse any existing duplicates
  // (keeping the earliest row) before adding the key that prevents new ones.
  const [prefIdx] = await pool.query("SHOW INDEX FROM preferences WHERE Key_name = 'uniq_pref'");
  if (!prefIdx.length) {
    await pool.query(
      `DELETE p FROM preferences p
       JOIN preferences q ON q.slotid = p.slotid AND q.userid = p.userid AND q.id < p.id`
    );
    await pool.query('ALTER TABLE preferences ADD UNIQUE KEY uniq_pref (slotid, userid)');
  }
  // uniq_pref leads with slotid, so a "rows for this user" lookup still had to
  // scan the table — and under FOR UPDATE that means locking all of it, which
  // deadlocks the moment two people book at once. Index userid separately.
  const [prefUserIdx] = await pool.query("SHOW INDEX FROM preferences WHERE Key_name = 'idx_pref_user'");
  if (!prefUserIdx.length) {
    await pool.query('ALTER TABLE preferences ADD KEY idx_pref_user (userid)');
  }

  // The system_default cohort is the one every new user is auto-added to and
  // which cannot be deleted. We mark it with a flag instead of by name so the
  // admin can rename it without breaking either guarantee.
  const [systemCol] = await pool.query("SHOW COLUMNS FROM cohorts LIKE 'system_default'");
  if (!systemCol.length) {
    await pool.query("ALTER TABLE cohorts ADD COLUMN system_default TINYINT(1) NOT NULL DEFAULT 0");
  }

  // One-time migration: if no cohorts exist yet, create "All users" + assign every
  // existing user + back-fill it onto duties that currently have no cohort. This
  // preserves the legacy "everyone sees every duty" behavior the system had before.
  const [[{ n: cohortCount }]] = await pool.query('SELECT COUNT(*) AS n FROM cohorts');
  if (cohortCount === 0) {
    const [result] = await pool.query(
      'INSERT INTO cohorts (name, description, system_default) VALUES (?, ?, 1)',
      ['All users', 'Auto-created on first boot. Every new user is automatically added here; this cohort cannot be deleted.']
    );
    const cohortId = result.insertId;
    await pool.query(
      'INSERT INTO cohort_members (cohort_id, user_id) SELECT ?, id FROM users',
      [cohortId]
    );
    await pool.query(
      'UPDATE duties SET cohort_id = ? WHERE cohort_id IS NULL',
      [cohortId]
    );
  } else {
    // Existing install — make sure exactly one cohort carries the system flag.
    // If none does, promote the "All users" one (or the oldest one if it was renamed).
    const [[{ n: flagged }]] = await pool.query('SELECT COUNT(*) AS n FROM cohorts WHERE system_default = 1');
    if (flagged === 0) {
      const [pick] = await pool.query(
        "SELECT id FROM cohorts WHERE name = 'All users' ORDER BY id LIMIT 1"
      );
      const promoteId = pick[0]?.id;
      if (promoteId) {
        await pool.query('UPDATE cohorts SET system_default = 1 WHERE id = ?', [promoteId]);
      }
    }
  }
}

// Helper: every user-create path should call this so new accounts land in the
// system-default cohort automatically. Idempotent — INSERT IGNORE skips if the
// user is already a member or if no system cohort exists.
export async function addToSystemCohort(userId, conn = pool) {
  if (!userId) return;
  await conn.query(
    `INSERT IGNORE INTO cohort_members (cohort_id, user_id)
     SELECT id, ? FROM cohorts WHERE system_default = 1 LIMIT 1`,
    [userId]
  );
}
