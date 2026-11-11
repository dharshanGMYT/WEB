// Shared helpers for the TZ Studio API (runs on Vercel serverless functions)
const crypto = require('crypto');

const RURL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const RTOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const OWNER = (process.env.OWNER_EMAIL || 'satheeshsai73@gmail.com').trim().toLowerCase();

// Talk to the Redis database (Upstash) over its REST API
async function redis(...cmd) {
  if (!RURL || !RTOK) throw new Error('DB_NOT_CONFIGURED');
  const r = await fetch(RURL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + RTOK, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error('AUTH_NOT_CONFIGURED');
  return s;
}

function sign(email) {
  const body = Buffer.from(JSON.stringify({ e: email, x: Date.now() + 7 * 864e5 })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return body + '.' + sig;
}

function verify(token) {
  try {
    const [body, sig] = String(token).split('.');
    const good = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
    if (!sig || sig.length !== good.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.x > Date.now() ? p.e : null;
  } catch (e) {
    return null;
  }
}

function hashPw(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { salt, hash: crypto.scryptSync(pw, salt, 64).toString('hex') };
}
function checkPw(pw, u) {
  const h = crypto.scryptSync(pw, u.salt, 64);
  const want = Buffer.from(u.hash, 'hex');
  return h.length === want.length && crypto.timingSafeEqual(h, want);
}
function same(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

function cleanEmail(e) {
  e = String(e || '').trim().toLowerCase();
  return e.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : '';
}

async function roleOf(email) {
  if (email === OWNER) return 'owner';
  return (await redis('SISMEMBER', 'tz:admins', email)) ? 'admin' : 'user';
}

// Who is calling? Returns { email, role } or null
async function who(req) {
  const h = (req.headers && (req.headers.authorization || req.headers.Authorization)) || '';
  const email = verify(h.replace(/^Bearer\s+/i, ''));
  if (!email) return null;
  if (email !== OWNER && !(await redis('HEXISTS', 'tz:users', email))) return null;
  return { email, role: await roleOf(email) };
}

function body(req) {
  let b = req.body;
  if (typeof b === 'string') {
    try { b = JSON.parse(b); } catch (e) { b = {}; }
  }
  return b && typeof b === 'object' ? b : {};
}

function wrap(fn) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      await fn(req, res);
    } catch (e) {
      const m = String(e && e.message);
      if (m === 'DB_NOT_CONFIGURED') return res.status(503).json({ error: 'The database is not connected yet.' });
      if (m === 'AUTH_NOT_CONFIGURED') return res.status(500).json({ error: 'AUTH_SECRET is not set on the server.' });
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  };
}

module.exports = { redis, OWNER, sign, verify, hashPw, checkPw, same, cleanEmail, roleOf, who, body, wrap };
