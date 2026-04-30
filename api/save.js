const Redis = require('ioredis');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { projectId, data } = req.body;
  
  if (!projectId || !data) {
    return res.status(400).json({ error: 'Missing projectId or data' });
  }
  
  try {
    const url = process.env.REDIS_URL;
    if (!url) return res.status(500).json({ error: 'REDIS_URL environment variable is missing.' });
    
    const redis = new Redis(url);
    const session = await redis.get(`session_${token}`);
    if (session !== "admin") {
      redis.quit();
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    await redis.set(`baogia_${projectId}`, typeof data === 'string' ? data : JSON.stringify(data));
    redis.quit();
    
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
