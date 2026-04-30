const Redis = require('ioredis');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { token } = req.body;
  if (!token) return res.status(401).json({ valid: false });
  
  try {
    const url = process.env.REDIS_URL;
    if (!url) return res.status(500).json({ error: 'Database not configured' });
    
    const redis = new Redis(url);
    const session = await redis.get(`session_${token}`);
    redis.quit();
    
    if (session === "admin") {
      res.status(200).json({ valid: true });
    } else {
      res.status(401).json({ valid: false });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
