const L = require('./_lib');

module.exports = L.wrap(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const ep = String(L.body(req).ep || '');
  if (!/^[\w-]{1,64}$/.test(ep)) return res.status(400).json({ error: 'Bad id.' });
  await L.redis('HINCRBY', 'tz:views', ep, 1);
  res.json({ ok: true });
});
