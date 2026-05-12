// Vercel serverless function — receives sign-ups, writes to Neon Postgres,
// sends email + WhatsApp notifications to the organizer, and a confirmation
// email to the signing-up user.
//
// Required env (auto-set by the Neon Vercel integration):
//   DATABASE_URL
//
// Optional env (set in Vercel dashboard if you want notifications):
//   NOTIFY_EMAIL_ENDPOINT   — Formspree endpoint for organizer notifications,
//                             e.g. https://formspree.io/f/mnjwlryl
//   WHATSAPP_PHONE          — recipient WhatsApp number with country code,
//                             e.g. +14126261823
//   WHATSAPP_APIKEY         — CallMeBot APIKEY (obtained by messaging their bot)
//   EMAILJS_SERVICE_ID      — defaults to 'service_l47oh6c' (the contact form one)
//   EMAILJS_TEMPLATE_ID     — defaults to 'template_3a68j0o' (the contact form one)
//   EMAILJS_USER_ID         — defaults to '9uN_4d08ybrG6_IhR'  (the contact form one)
//   EMAILJS_ACCESS_TOKEN    — needed if EmailJS strict mode is on (private key)
//   SIGNUP_SECRET           — if set, requests must include this same value
//                             in `secret` field

import { neon } from '@neondatabase/serverless';

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

// Public-facing location for calendar/confirmation emails: we deliberately
// share only the neighborhood, not the street address. The exact address is
// shared by Shosh after a first-time intro (SMS/WhatsApp to 412-626-1823).
const VENUE_AREA = 'Squirrel Hill, Pittsburgh, 15217';
const DEFAULT_TIME = '6:30 PM';
const ORGANIZER_PHONE = '412-626-1823';
const ORGANIZER_EMAIL = 'mashshosh@gmail.com';

// EmailJS defaults reuse the same account/template the existing contact form
// already uses. Override via env vars if you create a dedicated signup template.
const EMAILJS_SERVICE_ID  = process.env.EMAILJS_SERVICE_ID  || 'service_l47oh6c';
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || 'template_3a68j0o';
const EMAILJS_USER_ID     = process.env.EMAILJS_USER_ID     || '9uN_4d08ybrG6_IhR';
const EMAILJS_ACCESS_TOKEN = process.env.EMAILJS_ACCESS_TOKEN;

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady || !sql) return;
  // Base table — created on first ever run.
  await sql`
    CREATE TABLE IF NOT EXISTS signups (
      id           SERIAL PRIMARY KEY,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      event_name   TEXT NOT NULL,
      event_date   TEXT,
      name         TEXT NOT NULL,
      email        TEXT NOT NULL,
      phone        TEXT NOT NULL,
      guests       INTEGER NOT NULL DEFAULT 1,
      notes        TEXT
    )
  `;
  // Additive columns — idempotent. Existing rows get NULL defaults.
  await sql`ALTER TABLE signups ADD COLUMN IF NOT EXISTS language        TEXT`;
  await sql`ALTER TABLE signups ADD COLUMN IF NOT EXISTS referrer        TEXT`;
  await sql`ALTER TABLE signups ADD COLUMN IF NOT EXISTS user_agent      TEXT`;
  await sql`ALTER TABLE signups ADD COLUMN IF NOT EXISTS status          TEXT DEFAULT 'pending'`;
  await sql`ALTER TABLE signups ADD COLUMN IF NOT EXISTS attended        BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE signups ADD COLUMN IF NOT EXISTS donation_amount NUMERIC(10,2)`;
  await sql`ALTER TABLE signups ADD COLUMN IF NOT EXISTS donation_method TEXT`;
  schemaReady = true;
}

function clipText(value, max) {
  if (value == null) return '';
  const s = String(value);
  return s.length > max ? s.slice(0, max) : s;
}

// Best-effort parse of an event date string into a Date at 6:30 PM ET.
// Accepts forms like "May 15", "May 15, 2026", "2026-05-15".
// Returns null if it can't get a sensible date.
function parseEventStart(eventDate) {
  if (!eventDate) return null;
  const year = new Date().getFullYear();
  // Try as-is first; if no year, append the current one.
  let d = new Date(eventDate);
  if (isNaN(d.getTime())) d = new Date(`${eventDate}, ${year}`);
  if (isNaN(d.getTime())) return null;
  // Pin to 18:30 local time.
  d.setHours(18, 30, 0, 0);
  return d;
}

// Format a Date as YYYYMMDDTHHMMSSZ (Google/iCal compact UTC form).
function toCalendarStamp(d) {
  return d.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

function buildCalendarLink({ eventName, eventDate }) {
  const start = parseEventStart(eventDate);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${eventName} — Lev Echad`,
    location: VENUE_AREA,
    details:
      `Lev Echad community event. We meet in ${VENUE_AREA}. ` +
      `Time: ${DEFAULT_TIME}. ` +
      `First-time visitors: text or WhatsApp Shosh at ${ORGANIZER_PHONE} ` +
      `for the exact address and a short intro.`,
  });
  if (start) {
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    params.set('dates', `${toCalendarStamp(start)}/${toCalendarStamp(end)}`);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildSummaryText(payload) {
  return [
    'New Lev Echad sign-up:',
    '',
    `Event: ${payload.eventName}${payload.eventDate ? ` (${payload.eventDate})` : ''}`,
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone}`,
    `Guests: ${payload.guests}`,
    `Notes: ${payload.notes || '(none)'}`,
    `Language: ${payload.language || 'unknown'}`,
  ].join('\n');
}

function buildUserConfirmationText(payload) {
  const dateLine = payload.eventDate
    ? `Date: ${payload.eventDate}`
    : `Date: as scheduled`;
  return [
    `Hi ${payload.name},`,
    '',
    `You're signed up for ${payload.eventName} at Lev Echad. Looking forward to seeing you!`,
    '',
    `Event details:`,
    `  ${dateLine}`,
    `  Time: ${DEFAULT_TIME}`,
    `  Where: we meet in ${VENUE_AREA}`,
    `  Guests in your party: ${payload.guests}`,
    payload.notes ? `  Your notes: ${payload.notes}` : '',
    '',
    `After you sign up, Shosh sends all the further details personally —`,
    `the exact address, parking, what to bring, and anything else you need.`,
    '',
    `If this is your first time joining us, please reach out to Shosh by SMS`,
    `or WhatsApp at ${ORGANIZER_PHONE} for a short introduction before the event.`,
    '',
    `Add to your calendar (one click): ${payload.calendarLink}`,
    '',
    `This confirmation was sent from ${ORGANIZER_EMAIL} — please add us to`,
    `your contacts so future updates don't end up in spam.`,
    '',
    `Need to change anything? Just reply to this email or text Shosh at ${ORGANIZER_PHONE}.`,
    '',
    `Warmly,`,
    `Shosh & the Lev Echad team`,
    `https://www.levechadpgh.org`,
  ].filter(Boolean).join('\n');
}

async function notifyOrganizerEmail(payload) {
  const url = process.env.NOTIFY_EMAIL_ENDPOINT;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: `🍽️ Lev Echad sign-up: ${payload.name} (${payload.eventName})`,
        ...payload,
        summary: buildSummaryText(payload),
      }),
    });
  } catch (err) {
    console.error('Organizer email failed:', err);
  }
}

async function notifyOrganizerWhatsApp(payload) {
  const phone = process.env.WHATSAPP_PHONE;
  const apikey = process.env.WHATSAPP_APIKEY;
  if (!phone || !apikey) {
    console.warn('WhatsApp skipped: WHATSAPP_PHONE or WHATSAPP_APIKEY not set');
    return;
  }
  // CallMeBot returns HTTP 200 even when the APIKEY is invalid or the
  // recipient phone was never activated — the rejection lives in the
  // response body. Log it so a failed delivery shows up in Vercel logs
  // (the request URL with the APIKEY is intentionally not logged).
  try {
    const url =
      'https://api.callmebot.com/whatsapp.php' +
      `?phone=${encodeURIComponent(phone)}` +
      `&text=${encodeURIComponent(buildSummaryText(payload))}` +
      `&apikey=${encodeURIComponent(apikey)}`;
    const res = await fetch(url);
    const body = (await res.text().catch(() => '')).slice(0, 500);
    const phoneShape = `${phone.startsWith('+') ? '+' : ''}len${phone.length}`;
    console.log(
      `WhatsApp CallMeBot status=${res.status} phone=${phoneShape} body=${body}`,
    );
  } catch (err) {
    console.error('WhatsApp failed:', err);
  }
}

async function sendUserConfirmation(payload) {
  // Don't try if we have no recipient.
  if (!payload.email) return;
  const message = buildUserConfirmationText(payload);
  const subject = `You're signed up — ${payload.eventName} at Lev Echad`;

  try {
    const body = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_USER_ID,
      template_params: {
        // The existing contact-form template accepts these names; we reuse them
        // so the user gets *something* even without a dedicated signup template.
        // Create a dedicated EmailJS template later for nicer formatting.
        to_name: payload.name,
        to_email: payload.email,
        from_name: 'Lev Echad',
        subject,
        message,
        reply_to: 'mashshosh@gmail.com',
        user_name: payload.name,
        user_email: payload.email,
        user_message: message,
      },
    };
    if (EMAILJS_ACCESS_TOKEN) body.accessToken = EMAILJS_ACCESS_TOKEN;

    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error('User confirmation failed:', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error('User confirmation failed:', err);
  }
}

// Exported for local testing. The Vercel runtime only invokes the default
// export, so these named exports have no production effect.
export const __test = { buildCalendarLink, buildUserConfirmationText, buildSummaryText };

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
      language = '',
      secret = '',
    } = req.body || {};

    if (process.env.SIGNUP_SECRET && secret !== process.env.SIGNUP_SECRET) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (!name.trim() || !email.trim() || !phone.trim() || !eventName.trim()) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Trim and bound everything before storage / outbound use.
    const cleaned = {
      eventName:  clipText(eventName,  120),
      eventDate:  clipText(eventDate,  120),
      name:       clipText(name,       120),
      email:      clipText(email,      200),
      phone:      clipText(phone,      40),
      guests:     Math.max(1, Math.min(20, Number(guests) || 1)),
      notes:      clipText(notes,      1000),
      language:   clipText(language,   8),
      referrer:   clipText(req.headers?.referer || req.headers?.referrer || '', 500),
      userAgent:  clipText(req.headers?.['user-agent'] || '', 500),
    };

    await ensureSchema();

    await sql`
      INSERT INTO signups
        (event_name, event_date, name, email, phone, guests, notes, language, referrer, user_agent)
      VALUES
        (${cleaned.eventName}, ${cleaned.eventDate}, ${cleaned.name}, ${cleaned.email},
         ${cleaned.phone}, ${cleaned.guests}, ${cleaned.notes}, ${cleaned.language},
         ${cleaned.referrer}, ${cleaned.userAgent})
    `;

    const calendarLink = buildCalendarLink(cleaned);

    const payload = { ...cleaned, calendarLink };

    // Fire all three notifications in parallel. The DB write is already done;
    // any notification failures are logged but don't fail the response.
    await Promise.all([
      notifyOrganizerEmail(payload),
      notifyOrganizerWhatsApp(payload),
      sendUserConfirmation(payload),
    ]);

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
