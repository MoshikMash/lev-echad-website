// Vercel serverless function — receives sign-ups, writes to Neon Postgres,
// sends email + WhatsApp notifications.
//
// Required env (auto-set by the Neon Vercel integration):
//   DATABASE_URL
//
// Optional env (set in Vercel dashboard if you want notifications):
//   NOTIFY_EMAIL_ENDPOINT   — Formspree endpoint, e.g. https://formspree.io/f/mnjwlryl
//   NOTIFY_EMAIL_TO         — destination email shown in subject/body
//   WHATSAPP_PHONE          — recipient WhatsApp number with country code, e.g. +14126261823
//   WHATSAPP_APIKEY         — CallMeBot APIKEY (obtained by messaging their bot)
//   SIGNUP_SECRET           — if set, requests must include this same value in `secret` field

import { neon } from '@neondatabase/serverless';

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

// Create the signups table on first call. Idempotent.
let ensured = false;
async function ensureTable() {
  if (ensured || !sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS signups (
      id          SERIAL PRIMARY KEY,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      event_name  TEXT NOT NULL,
      event_date  TEXT,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL,
      phone       TEXT NOT NULL,
      guests      INTEGER NOT NULL DEFAULT 1,
      notes       TEXT
    )
  `;
  ensured = true;
}

function buildSummary({ eventName, eventDate, name, email, phone, guests, notes }) {
  return [
    'New Lev Echad sign-up:',
    '',
    `Event: ${eventName}${eventDate ? ` (${eventDate})` : ''}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Guests: ${guests}`,
    `Notes: ${notes || '(none)'}`,
  ].join('\n');
}

async function notifyEmail(payload) {
  const url = process.env.NOTIFY_EMAIL_ENDPOINT;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: `🍽️ Lev Echad sign-up: ${payload.name} (${payload.eventName})`,
        ...payload,
        summary: buildSummary(payload),
      }),
    });
  } catch (err) {
    console.error('Email notify failed:', err);
  }
}

async function notifyWhatsApp(payload) {
  const phone = process.env.WHATSAPP_PHONE;
  const apikey = process.env.WHATSAPP_APIKEY;
  if (!phone || !apikey) return;
  try {
    const url =
      'https://api.callmebot.com/whatsapp.php' +
      `?phone=${encodeURIComponent(phone)}` +
      `&text=${encodeURIComponent(buildSummary(payload))}` +
      `&apikey=${encodeURIComponent(apikey)}`;
    await fetch(url);
  } catch (err) {
    console.error('WhatsApp notify failed:', err);
  }
}

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
  if (!sql) {
    res.status(500).json({ error: 'Database not configured (DATABASE_URL missing)' });
    return;
  }

  try {
    const {
      eventName = '',
      eventDate = '',
      name = '',
      email = '',
      phone = '',
      guests = 1,
      notes = '',
      secret = '',
    } = req.body || {};

    // Optional anti-spam check — only enforced if SIGNUP_SECRET is set.
    if (process.env.SIGNUP_SECRET && secret !== process.env.SIGNUP_SECRET) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (!name.trim() || !email.trim() || !phone.trim() || !eventName.trim()) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    await ensureTable();

    const guestCount = Math.max(1, Math.min(20, Number(guests) || 1));

    await sql`
      INSERT INTO signups (event_name, event_date, name, email, phone, guests, notes)
      VALUES (${eventName}, ${eventDate}, ${name}, ${email}, ${phone}, ${guestCount}, ${notes})
    `;

    const payload = {
      eventName,
      eventDate,
      name,
      email,
      phone,
      guests: guestCount,
      notes,
    };

    // Fire notifications in parallel; don't block the response on them.
    await Promise.all([notifyEmail(payload), notifyWhatsApp(payload)]);

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
