// Vercel Serverless Function: /api/chat
// Calls OpenAI securely using server-side secret OPENAI_API_KEY

export const config = {
  runtime: 'edge',
};

const SYSTEM_PROMPT = `You are Shauli, a helpful and humorous assistant specializing in Jewish life in Pittsburgh, Pennsylvania. You made aliyah in reverse - from Petach Tikva to Pittsburgh 15 years ago. Be warm, concise, and rely only on the provided knowledge base.`;

import pittsburghJewishKnowledgeBase from '../src/data/pittsburghJewishInfo';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const question = (body?.question ?? '').toString();
    if (!question) {
      return new Response(JSON.stringify({ error: 'Missing question' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
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
      return new Response(JSON.stringify({ error: `OpenAI error ${openaiRes.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await openaiRes.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


