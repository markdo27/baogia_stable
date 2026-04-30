const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  const { projectId } = req.query;
  
  if (!projectId) {
    return res.status(400).json({ error: 'Missing projectId' });
  }
  
  try {
    const data = await kv.get(`baogia_${projectId}`);
    res.status(200).json({ data: data || {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
