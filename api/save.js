const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { projectId, data } = req.body;
  
  if (!projectId || !data) {
    return res.status(400).json({ error: 'Missing projectId or data' });
  }
  
  try {
    // Save stringified JSON or object directly to KV
    await kv.set(`baogia_${projectId}`, data);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
