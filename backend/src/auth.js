import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

// Secrets that are public knowledge — they ship in .env.example, in this repo's
// history, or in every tutorial. A token signed with one of these can be forged
// by anyone, so they are never usable, not even as a fallback.
const PUBLIC_SECRETS = new Set([
  'replace-me-with-a-long-random-string',
  'dev-secret-change-me',
  'changeme',
  'change-me',
  'secret',
  'jwt-secret',
]);

const MIN_SECRET_LENGTH = 32;

// Returns a human-readable problem with the configured secret, or null if it is
// fit to sign with. index.js calls this at boot and refuses to start on it.
export function jwtSecretProblem() {
  const s = process.env.JWT_SECRET || '';
  if (!s) return 'JWT_SECRET is not set.';
  if (PUBLIC_SECRETS.has(s)) return 'JWT_SECRET is still the placeholder from .env.example — it is public knowledge.';
  if (s.length < MIN_SECRET_LENGTH) return `JWT_SECRET is ${s.length} characters; use at least ${MIN_SECRET_LENGTH}.`;
  return null;
}

// No fallback value. Signing with a known secret is worse than not signing at
// all, because it looks like it works.
const SECRET = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not configured.');
  return s;
};
const EXPIRES = () => process.env.JWT_EXPIRES_IN || '7d';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, name: user.name, role: user.role },
    SECRET(),
    { expiresIn: EXPIRES() }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET());
}

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Verifies a plaintext password against a stored hash, supporting both the
// legacy sha256 column values (64 hex chars) and modern bcrypt ($2…).
// Returns { ok, needsUpgrade } so callers can transparently re-hash with bcrypt.
export async function verifyPassword(plain, stored) {
  if (!stored) return { ok: false, needsUpgrade: false };
  if (stored.startsWith('$2')) {
    const ok = await bcrypt.compare(plain, stored);
    return { ok, needsUpgrade: false };
  }
  // legacy sha256
  const ok = sha256(plain) === stored;
  return { ok, needsUpgrade: ok };
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}
