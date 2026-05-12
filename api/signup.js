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
const DEFAULT_TIME = '7:30 PM';
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
  await sql`ALTER TABLE signups ADD COLUMN IF NOT EXISTS language   TEXT`;
  await sql`ALTER TABLE signups ADD COLUMN IF NOT EXISTS referrer   TEXT`;
  await sql`ALTER TABLE signups ADD COLUMN IF NOT EXISTS user_agent TEXT`;
  // Stable slug per event-instance (event_name + event_date), so the same
  // Shabbat Dinner on different dates groups as separate events.
  await sql`ALTER TABLE signups ADD COLUMN IF NOT EXISTS event_key  TEXT`;
  // Drop columns we never populate — they were added speculatively for a
  // future organizer workflow that didn't materialize. DROP IF EXISTS is
  // idempotent and safe to leave in this migration.
  await sql`ALTER TABLE signups DROP COLUMN IF EXISTS status`;
  await sql`ALTER TABLE signups DROP COLUMN IF EXISTS attended`;
  await sql`ALTER TABLE signups DROP COLUMN IF EXISTS donation_amount`;
  await sql`ALTER TABLE signups DROP COLUMN IF EXISTS donation_method`;
  schemaReady = true;
}

// Slugify "Shabbat Dinner" + "May 15, 2026" → "shabbat-dinner-may-15-2026".
// Stable across reruns so signups for the same event-instance share a key.
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

// Returns true if the given Date falls within US Eastern Daylight Time
// (second Sunday of March through first Sunday of November).
function isEDT(d) {
  const y = d.getUTCFullYear();
  // 2nd Sunday March (US DST start, 2:00 AM local)
  const marchFirst = new Date(Date.UTC(y, 2, 1));
  const dstStart = new Date(Date.UTC(y, 2, 1 + ((7 - marchFirst.getUTCDay()) % 7) + 7));
  // 1st Sunday November (US DST end, 2:00 AM local)
  const novFirst = new Date(Date.UTC(y, 10, 1));
  const dstEnd = new Date(Date.UTC(y, 10, 1 + ((7 - novFirst.getUTCDay()) % 7)));
  return d >= dstStart && d < dstEnd;
}

// Best-effort parse of an event date string into a Date at 7:30 PM Eastern.
// Vercel functions run in UTC, so we explicitly compute the UTC equivalent
// of 19:30 ET (23:30 UTC during EDT, 00:30 UTC next-day during EST) instead
// of using setHours which would set the time in the function's wall-clock TZ.
// Accepts forms like "May 15", "May 15, 2026", "2026-05-15".
function parseEventStart(eventDate) {
  if (!eventDate) return null;
  const year = new Date().getFullYear();
  let d = new Date(eventDate);
  if (isNaN(d.getTime())) d = new Date(`${eventDate}, ${year}`);
  if (isNaN(d.getTime())) return null;
  const offsetHours = isEDT(d) ? 4 : 5;
  d.setUTCHours(19 + offsetHours, 30, 0, 0);
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
  // payload.eventName already includes the date (e.g. "Shabbat Dinner —
  // May 15, 2026"), so we don't append eventDate again.
  return [
    'New Lev Echad sign-up:',
    '',
    `Event: ${payload.eventName}`,
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone}`,
    `Guests: ${payload.guests}`,
    `Notes: ${payload.notes || '(none)'}`,
    `Language: ${payload.language || 'unknown'}`,
  ].join('\n');
}

// The EmailJS template (Contact Us / template_3a68j0o) wraps everything we
// send with hardcoded text we can't edit on the free tier:
//
//   "Dear {{to_name}}, Thank you for contacting Lev Echad!
//    Here's a copy of your message:
//      [OUR MESSAGE]
//    We'll get back to you soon!  Best regards, The Lev Echad Team"
//
// Open warmly so the body itself feels welcoming, even if the wrapper's
// intro is a little awkward. The closing "We'll get back to you soon!"
// then echoes our "Shosh will be in touch personally" line naturally.
function buildUserConfirmationText(payload) {
  const dateLine = payload.eventDate || 'as scheduled';
  return [
    `🎉 We're so happy you're joining us!`,
    '',
    `You signed up for ${payload.eventName}, and we can't wait to`,
    `welcome you to the Lev Echad community.`,
    '',
    `Your details:`,
    `  Name: ${payload.name}`,
    `  Guests joining you: ${payload.guests}`,
    payload.notes ? `  Your notes: ${payload.notes}` : null,
    '',
    `What's next:`,
    '',
    `  📅 ${dateLine}, ${DEFAULT_TIME} Eastern`,
    `  📍 We meet in ${VENUE_AREA}`,
    `  🎁 You don't need to bring anything — just yourself`,
    `  📞 First time joining us? Please text or WhatsApp Shosh at`,
    `     ${ORGANIZER_PHONE} for a quick hello before the event`,
    '',
    `Add to your calendar (one click):`,
    `${payload.calendarLink}`,
    '',
    `Shosh will be in touch personally with the exact address and any`,
    `other details you need. We're so glad you'll be with us —`,
    `looking forward to seeing you soon!`,
    '',
    `💝 Know someone who could use a warm community? Feel free to`,
    `forward this email or bring a friend — newcomers are always`,
    `welcome. Just let Shosh know if you're bringing extra guests.`,
  ].filter((line) => line !== null).join('\n');
}

// HTML version of the confirmation. Pretty formatting with proper line
// breaks, bolded labels, and a calendar button. Used as the `html` field in
// the EmailJS template_params so a dedicated signup template can render it.
function buildUserConfirmationHtml(payload) {
  const dateLine = payload.eventDate || 'as scheduled';
  const notesLine = payload.notes
    ? `<tr><td style="padding:4px 0;color:#6b7280;width:140px;">Your notes</td><td style="padding:4px 0;">${escapeHtml(payload.notes)}</td></tr>`
    : '';
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;line-height:1.55;">
  <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:14px;padding:32px;border:1px solid #e5e7eb;">
    <h1 style="margin:0 0 8px 0;font-size:22px;color:#1d4ed8;">You're signed up — see you soon! 💙</h1>
    <p style="margin:0 0 20px 0;">Hi <strong>${escapeHtml(payload.name)}</strong>,</p>
    <p style="margin:0 0 20px 0;">You're confirmed for <strong>${escapeHtml(payload.eventName)}</strong> at Lev Echad. We can't wait to host you.</p>

    <h2 style="margin:24px 0 8px 0;font-size:16px;color:#111827;">Event details</h2>
    <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-size:15px;">
      <tr><td style="padding:4px 0;color:#6b7280;width:140px;">Date</td><td style="padding:4px 0;">${escapeHtml(dateLine)}</td></tr>
      <tr><td style="padding:4px 0;color:#6b7280;">Time</td><td style="padding:4px 0;">${DEFAULT_TIME} (Eastern)</td></tr>
      <tr><td style="padding:4px 0;color:#6b7280;">Where</td><td style="padding:4px 0;">we meet in ${VENUE_AREA}</td></tr>
      <tr><td style="padding:4px 0;color:#6b7280;">Guests</td><td style="padding:4px 0;">${payload.guests}</td></tr>
      ${notesLine}
    </table>

    <p style="margin:24px 0 16px 0;">Just come — you don't need to bring anything. Shosh will reach out personally with the exact address and any other details you need.</p>

    <p style="margin:0 0 16px 0;background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 14px;border-radius:6px;">
      <strong>First time joining us?</strong> Please text or WhatsApp Shosh at <a href="sms:+1${ORGANIZER_PHONE.replace(/-/g,'')}" style="color:#92400e;">${ORGANIZER_PHONE}</a> for a short introduction before the event.
    </p>

    <p style="margin:24px 0;text-align:center;">
      <a href="${payload.calendarLink}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">📅 Add to your calendar</a>
    </p>

    <p style="margin:20px 0 0 0;font-size:14px;color:#6b7280;">
      Need to change anything? Just reply to this email or text Shosh at ${ORGANIZER_PHONE}.
    </p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

    <p style="margin:0;font-size:14px;color:#374151;">
      Warmly,<br/>
      <strong>Shosh & the Lev Echad team</strong><br/>
      <a href="https://www.levechadpgh.org" style="color:#2563eb;">levechadpgh.org</a>
    </p>
  </div>
</body></html>`;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// One EmailJS path for both organizer notification and user confirmation.
// EmailJS replies with HTTP 4xx + a short error string if the API rejects
// the request (e.g. "API access from non-browser environments is disabled"),
// and "OK" on success — we log both so the next signup shows the outcome.
async function sendEmailJS({ toName, toEmail, subject, message, html, replyTo, label }) {
  if (!toEmail) {
    console.warn(`${label} skipped: no recipient`);
    return;
  }
  try {
    const body = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_USER_ID,
      template_params: {
        to_name: toName,
        to_email: toEmail,
        from_name: 'Lev Echad',
        subject,
        message,
        // Available for a dedicated signup template that wants raw HTML via
        // `{{{html}}}` (triple-brace = no escaping). The plain-text `message`
        // stays around so the existing Contact Us template keeps working.
        html: html || message,
        reply_to: replyTo || ORGANIZER_EMAIL,
        user_name: toName,
        user_email: toEmail,
        user_message: message,
      },
    };
    if (EMAILJS_ACCESS_TOKEN) body.accessToken = EMAILJS_ACCESS_TOKEN;

    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const respBody = (await res.text().catch(() => '')).slice(0, 300);
    if (res.ok) {
      console.log(`${label} EmailJS status=${res.status} to=${toEmail} body=${respBody}`);
    } else {
      console.error(`${label} EmailJS failed status=${res.status} to=${toEmail} body=${respBody}`);
    }
  } catch (err) {
    console.error(`${label} EmailJS error:`, err);
  }
}

async function notifyOrganizerEmail(payload) {
  // Shosh receives a true copy of the guest's confirmation email — same
  // body AND same salutation ("Dear <guest name>" via to_name) so what
  // lands in her inbox reads exactly like the email the guest got. The
  // subject is the one differentiator so she can scan inbox quickly.
  // Contact details (email, phone) come through the WhatsApp ping.
  await sendEmailJS({
    toName: payload.name,
    toEmail: ORGANIZER_EMAIL,
    subject: `New signup: ${payload.name} for ${payload.eventName}`,
    message: buildUserConfirmationText(payload),
    html: buildUserConfirmationHtml(payload),
    label: 'Organizer notification',
  });
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
  await sendEmailJS({
    toName: payload.name,
    toEmail: payload.email,
    subject: `You're signed up — ${payload.eventName} at Lev Echad`,
    message: buildUserConfirmationText(payload),
    html: buildUserConfirmationHtml(payload),
    label: 'User confirmation',
  });
}

// Exported for local testing. The Vercel runtime only invokes the default
// export, so these named exports have no production effect.
export const __test = {
  buildCalendarLink,
  buildUserConfirmationText,
  buildUserConfirmationHtml,
  buildSummaryText,
};

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
    const baseEventName = clipText(eventName, 120);
    const cleanedDate   = clipText(eventDate, 120);
    // Fold the date into the stored event name so each (event, date) is
    // self-describing when read out of the table.
    const eventNameWithDate = cleanedDate
      ? `${baseEventName} — ${cleanedDate}`
      : baseEventName;
    const cleaned = {
      eventName:  eventNameWithDate,
      eventDate:  cleanedDate,
      eventKey:   makeEventKey(baseEventName, cleanedDate),
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
        (event_key, event_name, event_date, name, email, phone, guests, notes, language, referrer, user_agent)
      VALUES
        (${cleaned.eventKey}, ${cleaned.eventName}, ${cleaned.eventDate}, ${cleaned.name}, ${cleaned.email},
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
