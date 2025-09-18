// Vercel Serverless Function: /api/chat - Updated
// Calls OpenAI securely using server-side secret OPENAI_API_KEY

// import { VercelRequest, VercelResponse } from '@vercel/node';
// import pittsburghJewishKnowledgeBase from '../src/data/pittsburghJewishInfo';
const pittsburghJewishKnowledgeBase = "Pittsburgh Jewish community information available";

const SYSTEM_PROMPT = `You are Shauli, a helpful and humorous assistant specializing in Jewish life in Pittsburgh, Pennsylvania. You made aliyah in reverse - from Petach Tikva to Pittsburgh 15 years ago. Be warm, concise, and rely only on the provided knowledge base.`;

export default async function handler(req, res) {
  console.log('API called:', req.method, req.url);
  
  // Enable CORS
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
    
    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Missing question' });
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Server not configured' });
      return;
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
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
          { role: 'system', content: `${SYSTEM_PROMPT}\n\nKNOWLEDGE BASE:\n${pittsburghJewishKnowledgeBase}` },
          { role: 'user', content: question },
        ],
      }),
    });

    if (!openaiRes.ok) {
      res.status(502).json({ error: `OpenAI error ${openaiRes.status}` });
      return;
    }

    const data = await openaiRes.json();
    const content = data?.choices?.[0]?.message?.content || '';
    
    res.status(200).json({ content });
  } catch (err) {
    console.error('Chat API error:', err);
    res.status(500).json({ error: 'Unexpected error' });
  }
}


