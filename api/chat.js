// Vercel Serverless Function: /api/chat - Simplified
export default async function handler(req, res) {
  console.log('API called:', req.method, req.url);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    console.log('Getting question...');
    const question = req.method === 'GET' ? req.query?.question : req.body?.question;
    
    if (!question) {
      console.log('No question provided');
      res.status(400).json({ error: 'Missing question' });
      return;
    }
    
    console.log('Question:', question);
    console.log('Checking API key...');
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log('No API key found');
      res.status(500).json({ error: 'Server not configured' });
      return;
    }
    
    console.log('API key exists, calling OpenAI...');
    
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: 300,
        temperature: 0.7,
        messages: [
          { 
            role: 'system', 
            content: 'You are Shauli, a helpful assistant for Jewish life in Pittsburgh. Be warm and conversational.' 
          },
          { role: 'user', content: question }
        ],
      }),
    });

    console.log('OpenAI response status:', openaiRes.status);
    
    if (!openaiRes.ok) {
      console.log('OpenAI error:', openaiRes.status);
      res.status(502).json({ error: `OpenAI error ${openaiRes.status}` });
      return;
    }

    const data = await openaiRes.json();
    console.log('OpenAI success');
    
    const content = data?.choices?.[0]?.message?.content || 'No response generated';
    
    res.status(200).json({ content });
  } catch (err) {
    console.error('Function error:', err);
    res.status(500).json({ error: 'Function crashed', details: err.message });
  }
}