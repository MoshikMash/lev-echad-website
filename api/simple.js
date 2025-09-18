// Ultra-simple test
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      res.status(500).json({ error: 'No API key' });
      return;
    }
    
    res.status(200).json({ 
      message: 'API key exists',
      keyLength: apiKey.length,
      keyStart: apiKey.substring(0, 10) + '...'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
