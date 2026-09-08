import { verifyToken } from './auth.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, name: payload.name, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || String(req.user.role).toLowerCase() !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// ---------------------------------------------------------------------------
// Login brute-force guard.
//
// The login route is the one unauthenticated write in the API, and passwords in
// this system are chosen by admins (bulk imports even share a default), so
// guessing is cheap without a limit. Fixed window, in memory, keyed by client
// IP: the app runs as a single process, so this needs no dependency and no
// store. Behind a proxy, set TRUST_PROXY so req.ip is the real client.
const loginAttempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

// Keep the map from growing without bound on a long-lived process.
setInterval(() => {
  const now = Date.now();
  for (const [key, rec] of loginAttempts) {
    if (now > rec.reset) loginAttempts.delete(key);
  }
}, WINDOW_MS).unref();

export function loginRateLimit(req, res, next) {
  const key = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const rec = loginAttempts.get(key);

  if (!rec || now > rec.reset) {
    loginAttempts.set(key, { count: 1, reset: now + WINDOW_MS });
    return next();
  }

  rec.count += 1;
  if (rec.count > MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((rec.reset - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: `Too many login attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
    });
  }
  next();
}

// A successful login clears the counter, so a user who mistyped a few times and
// then got in is not left throttled.
export function clearLoginAttempts(req) {
  loginAttempts.delete(req.ip || req.socket?.remoteAddress || 'unknown');
}
