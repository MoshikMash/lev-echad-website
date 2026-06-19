// Organizer-only batch endpoint for recording sign-ups taken offline
// (e.g., a name texted to Shosh on WhatsApp). Writes into the same
// `signups` table the public form uses — but skips every notification
// (no confirmation email to the named person, no WhatsApp ping to Shosh
// for each row) so adding 10 names doesn't flood Shosh with 10 pings
// she just typed in herself.
//
// Required env:
//   DATABASE_URL          — Neon Postgres connection (already set by
//                           the Vercel/Neon integration)
//   ADMIN_SIGNUP_SECRET   — shared secret required on every call. Set
//                           in Vercel → Project Settings → Environment
//                           Variables. If unset, the endpoint is disabled.
//
// Request: POST application/json to /api/admin-signup
//   Pass the secret either in the body as `secret` or as the
//   `X-Admin-Secret` header. Body shape:
//     {
//       "secret":    "<ADMIN_SIGNUP_SECRET>",
//       "eventName": "Shabbat Dinner",
//       "eventDate": "June 19, 2026",
//       "note":      "Added manually by organizer",   // optional, applied to all rows
//       "entries": [
//         { "name": "Menuchi Kaplan", "guests": 1 },
//         { "name": "Gil Oren",       "guests": 3 }
//       ]
//     }
//
// Response: { "ok": true, "inserted": [{ name, guests }, ...] }

import { neon } from '@neondatabase/serverless';

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

// Mirrors the slug rules in api/signup.js so admin-added rows share an
// event_key with form-submitted rows for the same (event, date).
function makeEventKey(eventName, eventDate) {
  const joined = [eventName, eventDate].filter(Boolean).join(' ').toLowerCase();
  return joined
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function clipText(value, max) {
  if (value == null) return '';
  const s = String(value);
  return s.length > max ? s.slice(0, max) : s;
}

// Exported for the smoke test (api/admin-signup.test.mjs). Vercel only
// calls the default export, so these have no production effect.
export const __test = { makeEventKey, clipText };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Secret');

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

  const required = process.env.ADMIN_SIGNUP_SECRET;
  if (!required) {
    res.status(500).json({ error: 'Admin endpoint disabled (ADMIN_SIGNUP_SECRET not set)' });
    return;
  }
  const provided =
    req.headers['x-admin-secret'] || (req.body && req.body.secret) || '';
  if (provided !== required) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  try {
    const {
      eventName = 'Shabbat Dinner',
      eventDate = '',
      entries = [],
      note = 'Added manually by organizer',
    } = req.body || {};

    if (!Array.isArray(entries) || entries.length === 0) {
      res.status(400).json({ error: 'entries[] must be a non-empty array' });
      return;
    }

    const baseEventName     = clipText(eventName, 120);
    const cleanedDate       = clipText(eventDate, 120);
    const eventNameWithDate = cleanedDate ? `${baseEventName} — ${cleanedDate}` : baseEventName;
    const eventKey          = makeEventKey(baseEventName, cleanedDate);
    const cleanedNote       = clipText(note, 1000);

    const inserted = [];
    for (const entry of entries) {
      const name = clipText(entry?.name, 120).trim();
      if (!name) continue;
      const guests = Math.max(1, Math.min(20, Number(entry?.guests) || 1));
      await sql`
        INSERT INTO signups
          (event_key, event_name, event_date, name, email, phone, guests, notes, language)
        VALUES
          (${eventKey}, ${eventNameWithDate}, ${cleanedDate}, ${name},
           '', '', ${guests}, ${cleanedNote}, 'en')
      `;
      inserted.push({ name, guests });
    }

    res.status(200).json({ ok: true, inserted });
  } catch (err) {
    console.error('Admin signup error:', err);
    res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
