import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { ensureSchema } from './db.js';
import { jwtSecretProblem } from './auth.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import dutiesRoutes from './routes/duties.js';
import slotsRoutes from './routes/slots.js';
import roomsRoutes from './routes/rooms.js';
import preferencesRoutes from './routes/preferences.js';
import reportsRoutes from './routes/reports.js';
import statsRoutes from './routes/stats.js';
import cohortsRoutes from './routes/cohorts.js';
import allocationsRoutes from './routes/allocations.js';
import attendanceRoutes from './routes/attendance.js';

// Fail closed: anything other than an explicit development run must have a real
// signing secret before it accepts a single request.
const secretProblem = jwtSecretProblem();
if (secretProblem) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`\n  WARNING: ${secretProblem}\n  Fine on localhost, but set a real JWT_SECRET before deploying.`);
    console.warn('  Generate one with:  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"\n');
  } else {
    console.error(`\nRefusing to start: ${secretProblem}`);
    console.error('Generate one with:  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"');
    console.error('Then set JWT_SECRET in the environment (or run with NODE_ENV=development for local work).\n');
    process.exit(1);
  }
}

const app = express();
// Behind nginx/a load balancer, req.ip is the proxy's address unless Express is
// told to read X-Forwarded-For — and the login limiter buckets by req.ip.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
app.use(cors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/duties', dutiesRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/cohorts', cohortsRoutes);
app.use('/api/allocations', allocationsRoutes);
app.use('/api/attendance', attendanceRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = Number(process.env.PORT || 4000);
ensureSchema()
  .catch((e) => console.warn('ensureSchema failed (continuing):', e.message))
  .finally(() => {
    app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
  });
