const L = require('./_lib');

module.exports = L.wrap(async (req, res) => {
  const u = await L.who(req);
  if (!u) return res.status(401).json({ error: 'Not signed in.' });
  res.json(u);
});
