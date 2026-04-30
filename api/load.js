const Redis = require('ioredis');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { projectId } = req.query;
  
  if (!projectId) {
    return res.status(400).json({ error: 'Missing projectId' });
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

    const data = await redis.get(`baogia_${projectId}`);
    redis.quit();
    
    let parsedData = data;
    if (data && typeof data === 'string') {
        try { parsedData = JSON.parse(data); } catch(e){}
    }
    
    res.status(200).json({ data: parsedData || {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
