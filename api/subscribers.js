// Vercel serverless function — export the mailing list as CSV.
//
//   GET /api/subscribers?key=ADMIN_KEY            active subscribers
//   GET /api/subscribers?key=ADMIN_KEY&all=1      everyone, including unsubscribed
//   GET /api/subscribers?key=ADMIN_KEY&format=json
//
// This is the "read the list" path we chose instead of building a sender:
// download the CSV, open it in Excel, or import it into Mailchimp/Brevo when
// it is time to actually send something.
//
// Required env:
//   DATABASE_URL
//   ADMIN_KEY   — REQUIRED. Without it this endpoint refuses every request,
//                 so a deploy that forgets to set it cannot leak the list.

import { neon } from '@neondatabase/serverless';
import { timingSafeEqual } from 'node:crypto';

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

const COLUMNS = [
  'id', 'email', 'name', 'phone', 'language', 'status',
  'interests', 'languages_spoken', 'gender', 'age_group', 'marital_status',
  'parental_status', 'location_status', 'zip', 'neighborhood',
  'profession', 'willing_to_host', 'heard_from', 'notes',
  'consent_at', 'consent_source', 'profile_completed_at',
  'created_at', 'updated_at', 'unsubscribed_at',
];

// Constant-time compare so the key can't be recovered by timing the response.
function keyMatches(provided, expected) {
  const a = Buffer.from(String(provided || ''));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function csvCell(value) {
  if (value == null) return '';
  // Postgres arrays arrive as JS arrays; flatten them to a readable list
  // rather than letting JSON syntax leak into a spreadsheet column.
  const s = Array.isArray(value)
    ? value.join('; ')
    : value instanceof Date
      ? value.toISOString()
      : String(value);
  // A leading =, +, - or @ makes Excel and Sheets treat the cell as a formula.
  // Prefix with a single quote so an address like "=cmd@x" can't execute.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export default async function handler(req, res) {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    res.status(503).json({
      error: 'Export disabled: ADMIN_KEY is not set on this deployment',
    });
    return;
  }
  if (!keyMatches(req.query?.key, adminKey)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  if (!sql) {
    res.status(500).json({ error: 'Database not configured (DATABASE_URL missing)' });
    return;
  }

  try {
    const includeAll = req.query?.all === '1';
    let rows;
    try {
      rows = includeAll
        ? await sql`SELECT * FROM subscribers ORDER BY created_at DESC`
        : await sql`SELECT * FROM subscribers WHERE status = 'subscribed' ORDER BY created_at DESC`;
    } catch (err) {
      // 42P01 = undefined_table. Only api/subscribe.js creates the schema, so
      // before the first ever sign-up there is no table — that is an empty
      // list, not a server error.
      const missingTable =
        err?.code === '42P01' || /relation .* does not exist/i.test(err?.message || '');
      if (!missingTable) throw err;
      rows = [];
    }

    res.setHeader('Cache-Control', 'no-store');

    if (req.query?.format === 'json') {
      res.status(200).json({ count: rows.length, subscribers: rows });
      return;
    }

    const header = COLUMNS.join(',');
    const body = rows
      .map((row) => COLUMNS.map((c) => csvCell(row[c])).join(','))
      .join('\n');

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="lev-echad-subscribers-${stamp}.csv"`,
    );
    // BOM so Excel opens the Hebrew columns as UTF-8 instead of mojibake.
    res.status(200).send(`﻿${header}\n${body}\n`);
  } catch (err) {
    console.error('Subscribers export error:', err);
    res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
