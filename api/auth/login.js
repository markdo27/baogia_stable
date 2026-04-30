const Redis = require('ioredis');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  
  if (password !== adminPassword) {
    return res.status(401).json({ error: 'Sai mật khẩu!' });
  }
  
  try {
    const url = process.env.REDIS_URL;
    if (!url) return res.status(500).json({ error: 'Database not configured in Vercel.' });
    
    const redis = new Redis(url);
    const token = crypto.randomUUID();
    
    // Store token in Redis, expires in 30 days
    await redis.set(`session_${token}`, "admin", "EX", 30 * 24 * 60 * 60);
    redis.quit();
    
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
