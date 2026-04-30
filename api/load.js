const { createClient } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  const { projectId } = req.query;
  
  if (!projectId) {
    return res.status(400).json({ error: 'Missing projectId' });
  }
  
  try {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!url || !token) {
      return res.status(500).json({ error: 'Database environment variables are missing in Vercel settings.' });
    }
    
    const client = createClient({ url, token });
    const data = await client.get(`baogia_${projectId}`);
    
    res.status(200).json({ data: data || {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
