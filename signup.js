const L = require('./_lib');

module.exports = L.wrap(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const b = L.body(req);
  const email = L.cleanEmail(b.email);
  const pw = String(b.password || '');
  if (!email) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (pw.length < 6 || pw.length > 200) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  // Owner and admin emails can never be claimed through sign-up
  if (email === L.OWNER || (await L.redis('SISMEMBER', 'tz:admins', email))) {
    return res.status(403).json({ error: 'This email is reserved. Use Sign in.' });
  }
  if (await L.redis('HEXISTS', 'tz:users', email)) {
    return res.status(409).json({ error: 'An account with this email already exists. Use Sign in.' });
  }
  await L.redis('HSET', 'tz:users', email, JSON.stringify(L.hashPw(pw)));
  res.json({ token: L.sign(email), email, role: 'user' });
});
