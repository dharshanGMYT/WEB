const L = require('./_lib');

module.exports = L.wrap(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const b = L.body(req);
  const email = L.cleanEmail(b.email);
  const pw = String(b.password || '');
  if (!email || !pw) return res.status(400).json({ error: 'Enter your email and password.' });

  const failKey = 'tz:fail:' + email;
  const fails = Number((await L.redis('GET', failKey)) || 0);
  if (fails >= 10) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });

  let ok = false;
  if (email === L.OWNER) {
    const p = process.env.OWNER_PASSWORD || '';
    ok = !!p && L.same(pw, p);
  } else {
    const u = await L.redis('HGET', 'tz:users', email);
    if (u) ok = L.checkPw(pw, JSON.parse(u));
  }
  if (!ok) {
    const n = await L.redis('INCR', failKey);
    if (n === 1) await L.redis('EXPIRE', failKey, 900);
    return res.status(401).json({ error: 'Wrong email or password.' });
  }
  await L.redis('DEL', failKey);
  res.json({ token: L.sign(email), email, role: await L.roleOf(email) });
});
