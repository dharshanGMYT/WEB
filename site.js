const L = require('./_lib');

module.exports = L.wrap(async (req, res) => {
  if (req.method === 'GET') {
    const d = await L.redis('GET', 'tz:site');
    const flat = (await L.redis('HGETALL', 'tz:views')) || [];
    const views = {};
    for (let i = 0; i + 1 < flat.length; i += 2) views[flat[i]] = Number(flat[i + 1]);
    return res.json({ data: d ? JSON.parse(d) : null, views });
  }
  if (req.method === 'PUT') {
    const u = await L.who(req);
    if (!u) return res.status(401).json({ error: 'Not signed in.' });
    if (u.role === 'user') return res.status(403).json({ error: 'Admins only.' });
    const data = L.body(req).data;
    if (!data || !Array.isArray(data.eps) || !Array.isArray(data.series) || typeof data.brand !== 'object') {
      return res.status(400).json({ error: 'Invalid data.' });
    }
    const text = JSON.stringify(data);
    if (text.length > 900000) {
      return res.status(413).json({ error: 'Too much data (limit about 900 KB). Remove some custom images.' });
    }
    await L.redis('SET', 'tz:site', text);
    return res.json({ ok: true });
  }
  res.status(405).json({ error: 'Method not allowed' });
});
