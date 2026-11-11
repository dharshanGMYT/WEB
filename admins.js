const L = require('./_lib');

module.exports = L.wrap(async (req, res) => {
  const u = await L.who(req);
  if (!u) return res.status(401).json({ error: 'Not signed in.' });
  if (u.role === 'user') return res.status(403).json({ error: 'Admins only.' });

  if (req.method === 'GET') {
    const list = ((await L.redis('SMEMBERS', 'tz:admins')) || []).sort();
    return res.json({ admins: [{ email: L.OWNER, role: 'owner' }].concat(list.map((email) => ({ email, role: 'admin' }))) });
  }
  if (u.role !== 'owner') return res.status(403).json({ error: 'Only the owner can change admins.' });

  if (req.method === 'POST') {
    const b = L.body(req);
    const email = L.cleanEmail(b.email);
    const pw = String(b.password || '');
    if (!email) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (email === L.OWNER) return res.status(400).json({ error: 'That is the owner email.' });
    if (pw.length < 6 || pw.length > 200) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    await L.redis('HSET', 'tz:users', email, JSON.stringify(L.hashPw(pw)));
    await L.redis('SADD', 'tz:admins', email);
    return res.json({ ok: true });
  }
  if (req.method === 'DELETE') {
    const email = L.cleanEmail((req.query && req.query.email) || '');
    if (!email) return res.status(400).json({ error: 'Missing email.' });
    await L.redis('SREM', 'tz:admins', email);
    return res.json({ ok: true });
  }
  res.status(405).json({ error: 'Method not allowed' });
});
