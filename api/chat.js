// Secure Vercel Serverless Function
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  
  try {
    const { question } = req.body || {};
    
    if (!question) {
      res.status(400).json({ error: 'Missing question' });
      return;
    }
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Server not configured' });
      return;
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: 500,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: 'You are Shauli, a helpful and humorous assistant specializing in Jewish life in Pittsburgh, Pennsylvania. You made aliyah in reverse - from Petach Tikva to Pittsburgh 15 years ago. Be warm, conversational, and helpful with information about Jewish schools, synagogues, neighborhoods, kosher food, healthcare, and community life in Pittsburgh.'
          },
          {
            role: 'user',
            content: question
          }
        ],
      }),
    });

    if (!response.ok) {
      res.status(502).json({ error: `OpenAI error ${response.status}` });
      return;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    
    res.status(200).json({ content });
  } catch (err) {
    res.status(500).json({ error: 'Unexpected error' });
  }
}