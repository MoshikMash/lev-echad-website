// Vercel serverless function — mailing-list / community sign-ups.
//
// Three actions, all POST to this same endpoint:
//
//   action: 'join'     { email, language, source, name?, phone? }
//                      Upserts a subscriber row. Returns { token } only when
//                      the row is NEW — for an existing subscriber the token
//                      travels exclusively by email, so typing someone else's
//                      address never hands over the key to their row.
//
//   action: 'profile'  { token, ...optional profile fields }
//                      Fills in the optional "tell us about yourself" data.
//                      Guarded by the token so knowing someone's email isn't
//                      enough to overwrite their row.
//
//   action: 'get'      { token }
//                      Returns the stored profile, so the form can open
//                      pre-filled and act as "manage my details".
//
// The same token is the unsubscribe / edit-my-profile key, so the welcome
// email can link straight back here without any login.
//
// Required env:
//   DATABASE_URL            — Neon Postgres (set by the Neon Vercel integration)
//
// Optional env (shared with api/signup.js):
//   EMAILJS_SERVICE_ID / EMAILJS_TEMPLATE_ID / EMAILJS_USER_ID
//   EMAILJS_ACCESS_TOKEN    — needed if EmailJS strict mode is on
//   SUBSCRIBE_SECRET        — if set, requests must include it in `secret`

import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'node:crypto';

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

const ORGANIZER_EMAIL = 'mashshosh@gmail.com';
const ORGANIZER_PHONE = '412-626-1823';
const SITE_URL = 'https://www.levechadpgh.org';

const EMAILJS_SERVICE_ID   = process.env.EMAILJS_SERVICE_ID  || 'service_91gmg1n';
const EMAILJS_TEMPLATE_ID  = process.env.EMAILJS_TEMPLATE_ID || 'template_3a68j0o';
const EMAILJS_USER_ID      = process.env.EMAILJS_USER_ID     || '9uN_4d08ybrG6_IhR';
const EMAILJS_ACCESS_TOKEN = process.env.EMAILJS_ACCESS_TOKEN;

// Whitelists. Anything not on these lists is dropped rather than stored, so a
// tampered client can't turn a free-text field into arbitrary DB content.
const INTERESTS = [
  'shabbat_dinners', 'torah_learning', 'hebrew_learning', 'english_practice',
  'professional', 'holidays', 'life_stage', 'volunteering', 'settling',
  'family_kids', 'israeli',
];
const SPOKEN_LANGUAGES = ['english', 'hebrew', 'russian', 'spanish', 'yiddish'];
const GENDERS = ['female', 'male', 'prefer_not'];
const AGE_GROUPS = ['student', '20s_30s', '30s_40s', '40s_50s', '50_plus'];
const MARITAL = ['single', 'relationship', 'married', 'divorced', 'widowed', 'prefer_not'];
const LOCATION_STATUS = ['in_pittsburgh', 'moving_soon', 'considering', 'not_pgh'];
const PARENTAL = ['no_kids', 'expecting', 'young_kids', 'school_age', 'grown_kids', 'prefer_not'];
const HEARD_FROM = ['facebook', 'friend', 'event', 'google', 'other'];

// Pittsburgh ZIPs that matter for a Friday-night dinner in Squirrel Hill.
// Deriving the area from the ZIP means we ask one short question instead of
// two, and 15217 vs 15213 is the difference between "can walk on Shabbat" and
// "is a student in Oakland" — both worth knowing without asking for either.
const ZIP_TO_NEIGHBORHOOD = {
  '15217': 'squirrel_hill',
  '15213': 'oakland',
  '15232': 'shadyside',
  '15206': 'east_liberty',
  '15208': 'point_breeze',
  '15218': 'regent_square',
  '15207': 'greenfield',
  '15222': 'downtown',
  '15201': 'lawrenceville',
  '15216': 'dormont',
  '15228': 'mt_lebanon',
  '15241': 'upper_st_clair',
  '15102': 'bethel_park',
  '15143': 'sewickley',
  '15238': 'fox_chapel',
};

function neighborhoodFromZip(zip) {
  const five = String(zip || '').trim().slice(0, 5);
  return ZIP_TO_NEIGHBORHOOD[five] || null;
}

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady || !sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS subscribers (
      id             SERIAL PRIMARY KEY,
      email          TEXT NOT NULL UNIQUE,
      token          TEXT NOT NULL,
      status         TEXT NOT NULL DEFAULT 'subscribed',
      name           TEXT,
      phone          TEXT,
      language       TEXT,
      consent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      consent_ip     TEXT,
      consent_source TEXT,
      user_agent     TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  // Optional profile columns — additive and idempotent, same migration style
  // as api/signup.js. A join-only subscriber leaves all of these NULL.
  await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS interests            TEXT[]`;
  await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS languages_spoken     TEXT[]`;
  await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS gender               TEXT`;
  await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS age_group            TEXT`;
  await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS marital_status       TEXT`;
  await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS neighborhood         TEXT`;
  await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS profession           TEXT`;
  await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS willing_to_host      BOOLEAN`;
  await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS heard_from           TEXT`;
  await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS notes                TEXT`;
  await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ`;
  // Reserved — we decided not to ask for these on the form yet, but the
  // columns cost nothing and a question can be added later without a migration.
  await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS zip                  TEXT`;
  await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS unsubscribed_at      TIMESTAMPTZ`;
  await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS parental_status      TEXT`;
  await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS location_status      TEXT`;
  // The token is the lookup key for both the profile link and the unsubscribe
  // link, so every click from an email hits this index.
  await sql`CREATE INDEX IF NOT EXISTS subscribers_token_idx ON subscribers (token)`;
  schemaReady = true;
}

// Links we put in emails are keyed by token alone — never by email address.
// A token is an unguessable UUID, and keeping the address out of the URL means
// it never lands in browser history, referrer headers, or server access logs.
export function profileUrl(token) {
  return `${SITE_URL}/?profile=${encodeURIComponent(token)}`;
}

export function unsubscribeUrl(token) {
  return `${SITE_URL}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}

function clipText(value, max) {
  if (value == null) return '';
  const s = String(value).trim();
  return s.length > max ? s.slice(0, max) : s;
}

// Case- and whitespace-insensitive identity. Everything downstream (dedupe
// against `signups`, unsubscribe lookups) depends on this being consistent.
function normalizeEmail(value) {
  return clipText(value, 200).toLowerCase();
}

// Deliberately permissive: we only reject what is obviously not an address.
// Over-strict regexes reject valid real-world emails, and the cost of one bad
// row is far lower than the cost of turning away a real subscriber.
function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function pickOne(value, allowed) {
  const v = clipText(value, 40).toLowerCase();
  return allowed.includes(v) ? v : null;
}

function pickMany(value, allowed) {
  if (!Array.isArray(value)) return null;
  const picked = value
    .map((v) => clipText(v, 40).toLowerCase())
    .filter((v) => allowed.includes(v));
  return picked.length ? [...new Set(picked)] : null;
}

// Vercel sits behind a proxy, so the socket address is the proxy's. The first
// entry of x-forwarded-for is the original client.
function clientIp(req) {
  const fwd = req.headers?.['x-forwarded-for'];
  const first = Array.isArray(fwd) ? fwd[0] : String(fwd || '').split(',')[0];
  return clipText(first || req.headers?.['x-real-ip'] || '', 64);
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// A welcome, not a receipt — same warmth as the event confirmation in
// api/signup.js, in whichever language they were browsing the site in.
function buildWelcomeText(language, token) {
  if (language === 'he') {
    return [
      'ברוכים הבאים ללב אחד 💛',
      '',
      'אנחנו שמחים שהצטרפתם. מעכשיו נעדכן אתכם במה שקורה אצלנו —',
      'ארוחות שבת, חגים, וכל דבר חדש בקהילה.',
      '',
      'בלי ספאם, רק הזמנה מדי פעם.',
      '',
      'רוצים שנכיר אתכם קצת יותר? ספרו לנו מה מעניין אתכם:',
      profileUrl(token),
      '',
      `רוצים לדבר? שלחו SMS או WhatsApp לשוש: ${ORGANIZER_PHONE}`,
      '',
      'נתראה בקרוב,',
      'שוש וצוות לב אחד',
      SITE_URL,
      '',
      `להסרה מרשימת התפוצה: ${unsubscribeUrl(token)}`,
    ].join('\n');
  }
  return [
    'Welcome to Lev Echad 💛',
    '',
    "We're so glad you joined. From now on we'll keep you posted on",
    "what's happening — Shabbat dinners, holidays, and everything new",
    'in the community.',
    '',
    'No spam, just an invitation now and then.',
    '',
    "Want us to know you a little better? Tell us what you're interested in:",
    profileUrl(token),
    '',
    `Want to talk? Text or WhatsApp Shosh at ${ORGANIZER_PHONE}.`,
    '',
    'See you soon,',
    'Shosh & the Lev Echad team',
    SITE_URL,
    '',
    `Unsubscribe: ${unsubscribeUrl(token)}`,
  ].join('\n');
}

function buildWelcomeHtml(language, token) {
  const he = language === 'he';
  const dir = he ? 'rtl' : 'ltr';
  const title = he ? 'ברוכים הבאים ללב אחד 💛' : 'Welcome to Lev Echad 💛';
  const body = he
    ? 'אנחנו שמחים שהצטרפתם. מעכשיו נעדכן אתכם במה שקורה אצלנו — ארוחות שבת, חגים, וכל דבר חדש בקהילה.'
    : "We're so glad you joined. From now on we'll keep you posted on what's happening — Shabbat dinners, holidays, and everything new in the community.";
  const promise = he
    ? 'בלי ספאם, רק הזמנה מדי פעם.'
    : 'No spam, just an invitation now and then.';
  const reach = he
    ? `רוצים לדבר? שלחו SMS או WhatsApp לשוש: ${ORGANIZER_PHONE}`
    : `Want to talk? Text or WhatsApp Shosh at ${ORGANIZER_PHONE}.`;
  const sign = he ? 'שוש וצוות לב אחד' : 'Shosh & the Lev Echad team';
  const profileCta = he ? 'ספרו לנו מה מעניין אתכם' : "Tell us what you're interested in";
  const profileNote = he
    ? 'לוקח פחות מדקה, והכל אופציונלי.'
    : 'Takes less than a minute, and all of it is optional.';
  const unsub = he ? 'להסרה מרשימת התפוצה' : 'Unsubscribe';

  return `<!DOCTYPE html>
<html dir="${dir}"><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;line-height:1.6;">
  <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:14px;padding:32px;border:1px solid #e5e7eb;" dir="${dir}">
    <h1 style="margin:0 0 16px 0;font-size:22px;color:#1d4ed8;">${escapeHtml(title)}</h1>
    <p style="margin:0 0 16px 0;">${escapeHtml(body)}</p>
    <p style="margin:0 0 20px 0;color:#6b7280;font-size:14px;">${escapeHtml(promise)}</p>
    <p style="margin:0 0 8px 0;text-align:center;">
      <a href="${profileUrl(token)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">${escapeHtml(profileCta)}</a>
    </p>
    <p style="margin:0 0 24px 0;text-align:center;font-size:13px;color:#6b7280;">${escapeHtml(profileNote)}</p>

    <p style="margin:0 0 20px 0;background:#eff6ff;border-${he ? 'right' : 'left'}:4px solid #3b82f6;padding:12px 14px;border-radius:6px;font-size:14px;">
      ${escapeHtml(reach)}
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <p style="margin:0 0 12px 0;font-size:14px;color:#374151;">
      <strong>${escapeHtml(sign)}</strong><br/>
      <a href="${SITE_URL}" style="color:#2563eb;">levechadpgh.org</a>
    </p>
    <p style="margin:0;font-size:12px;color:#9ca3af;">
      <a href="${unsubscribeUrl(token)}" style="color:#9ca3af;">${escapeHtml(unsub)}</a>
    </p>
  </div>
</body></html>`;
}

async function sendWelcomeEmail({ toEmail, language, token }) {
  if (!toEmail) return;
  const subject = language === 'he'
    ? 'ברוכים הבאים ללב אחד 💛'
    : 'Welcome to Lev Echad 💛';
  try {
    const body = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_USER_ID,
      template_params: {
        to_name: toEmail,
        to_email: toEmail,
        from_name: 'Lev Echad',
        subject,
        message: buildWelcomeText(language, token),
        html: buildWelcomeHtml(language, token),
        reply_to: ORGANIZER_EMAIL,
        user_name: toEmail,
        user_email: toEmail,
        user_message: buildWelcomeText(language, token),
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
      console.log(`Welcome email status=${res.status} to=${toEmail} body=${respBody}`);
    } else {
      console.error(`Welcome email failed status=${res.status} to=${toEmail} body=${respBody}`);
    }
  } catch (err) {
    console.error('Welcome email error:', err);
  }
}

// Exported for local testing. The Vercel runtime only invokes the default
// export, so these named exports have no production effect.
export const __test = {
  normalizeEmail,
  looksLikeEmail,
  pickOne,
  pickMany,
  buildWelcomeText,
  buildWelcomeHtml,
  profileUrl,
  unsubscribeUrl,
  neighborhoodFromZip,
  INTERESTS,
  LOCATION_STATUS,
  PARENTAL,
};

async function handleJoin(req, res, body) {
  const email = normalizeEmail(body.email);
  if (!looksLikeEmail(email)) {
    res.status(400).json({ error: 'Invalid email' });
    return;
  }

  const language = clipText(body.language, 8) || 'en';
  const source   = clipText(body.source, 40) || 'unknown';
  // The event sign-up modal already collected a name and phone — carry them
  // over so the subscriber row and the event sign-up describe the same person.
  const name     = clipText(body.name, 120) || null;
  const phone    = clipText(body.phone, 40) || null;
  const ip       = clientIp(req);
  const ua       = clipText(req.headers?.['user-agent'] || '', 500);
  const token    = randomUUID();

  await ensureSchema();

  // Re-joining is not an error: someone who signed up from the footer months
  // ago and now clicks the events box should just be re-activated, keeping
  // their original consent record and their existing token.
  //
  // The one exception is `source = 'modal'` — the mailing-list checkbox inside
  // the event sign-up form, which is pre-checked. Someone who deliberately
  // unsubscribed and later books a dinner must not be silently resurrected by
  // a box they never actively ticked. Every other source is an explicit act of
  // typing an address into a subscribe form, so it does reactivate.
  //
  // name/phone fill only NULLs on conflict: this request isn't token-guarded,
  // so it may add to an existing row but never overwrite what's there.
  const rows = await sql`
    INSERT INTO subscribers
      (email, token, name, phone, language, consent_ip, consent_source, user_agent)
    VALUES
      (${email}, ${token}, ${name}, ${phone}, ${language}, ${ip}, ${source}, ${ua})
    ON CONFLICT (email) DO UPDATE SET
      status          = CASE WHEN subscribers.status = 'unsubscribed' AND ${source} = 'modal'
                             THEN subscribers.status ELSE 'subscribed' END,
      unsubscribed_at = CASE WHEN subscribers.status = 'unsubscribed' AND ${source} = 'modal'
                             THEN subscribers.unsubscribed_at ELSE NULL END,
      name            = COALESCE(subscribers.name,  EXCLUDED.name),
      phone           = COALESCE(subscribers.phone, EXCLUDED.phone),
      language        = EXCLUDED.language,
      updated_at      = NOW()
    RETURNING token, status, (xmax = 0) AS is_new
  `;

  const row = rows[0];
  const isNew = !!row?.is_new;

  // New subscriber → welcome email. Returning subscriber who typed their
  // address into a subscribe form → the same email again, because it carries
  // their personal profile + unsubscribe links and is the only channel that
  // proves they own the mailbox. Two silences: a deliberately-unsubscribed
  // person who merely booked a dinner (status stayed 'unsubscribed'), and an
  // already-subscribed diner whose pre-checked box shouldn't generate mail.
  const shouldEmail =
    row && row.status !== 'unsubscribed' && (isNew || source !== 'modal');
  if (shouldEmail) {
    await sendWelcomeEmail({ toEmail: email, language, token: row.token });
  }

  // The token is a capability: whoever holds it can rewrite the profile and
  // unsubscribe the row. Hand it out in-band only for a brand-new row — its
  // creator is the person at the keyboard. For an existing row the token
  // travels only inside email, so only the mailbox owner can act on it.
  res.status(200).json({ ok: true, token: isNew ? row.token : undefined, isNew });
}

// Keyed by token alone. The token is an unguessable UUID, so it authenticates
// on its own — and dropping the email from the request means the profile link
// in the welcome email carries no personal data in its URL.
async function handleProfile(req, res, body) {
  const token = clipText(body.token, 64);
  if (!token) {
    res.status(400).json({ error: 'Missing token' });
    return;
  }

  await ensureSchema();

  const zip = clipText(body.zip, 10) || null;
  // Only overwrite the neighbourhood when a ZIP we recognise came in, so a
  // re-save with the ZIP left blank keeps whatever we worked out last time.
  const derivedNeighborhood = zip ? neighborhoodFromZip(zip) : null;

  // COALESCE so a partially-filled profile never blanks out data the
  // subscriber already gave us on an earlier pass.
  const rows = await sql`
    UPDATE subscribers SET
      name                 = COALESCE(${clipText(body.name, 120) || null}, name),
      phone                = COALESCE(${clipText(body.phone, 40) || null}, phone),
      profession           = COALESCE(${clipText(body.profession, 120) || null}, profession),
      notes                = COALESCE(${clipText(body.notes, 1000) || null}, notes),
      interests            = COALESCE(${pickMany(body.interests, INTERESTS)}, interests),
      languages_spoken     = COALESCE(${pickMany(body.languagesSpoken, SPOKEN_LANGUAGES)}, languages_spoken),
      gender               = COALESCE(${pickOne(body.gender, GENDERS)}, gender),
      age_group            = COALESCE(${pickOne(body.ageGroup, AGE_GROUPS)}, age_group),
      marital_status       = COALESCE(${pickOne(body.maritalStatus, MARITAL)}, marital_status),
      parental_status      = COALESCE(${pickOne(body.parentalStatus, PARENTAL)}, parental_status),
      location_status      = COALESCE(${pickOne(body.locationStatus, LOCATION_STATUS)}, location_status),
      zip                  = COALESCE(${zip}, zip),
      neighborhood         = COALESCE(${derivedNeighborhood}, neighborhood),
      heard_from           = COALESCE(${pickOne(body.heardFrom, HEARD_FROM)}, heard_from),
      willing_to_host      = COALESCE(${typeof body.willingToHost === 'boolean' ? body.willingToHost : null}, willing_to_host),
      profile_completed_at = NOW(),
      updated_at           = NOW()
    WHERE token = ${token}
    RETURNING id
  `;

  if (!rows.length) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  res.status(200).json({ ok: true });
}

// Returns the stored profile for a token, so the edit form opens showing what
// we already know instead of a blank quiz. Holding the token IS the login —
// same trust model as handleProfile, read instead of write.
async function handleGet(req, res, body) {
  const token = clipText(body.token, 64);
  if (!token) {
    res.status(400).json({ error: 'Missing token' });
    return;
  }

  await ensureSchema();

  const rows = await sql`
    SELECT name, phone, profession, notes, interests, languages_spoken,
           gender, age_group, marital_status, parental_status, zip,
           location_status, heard_from, willing_to_host, status
      FROM subscribers WHERE token = ${token} LIMIT 1
  `;
  if (!rows.length) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const r = rows[0];
  res.status(200).json({
    ok: true,
    profile: {
      name:            r.name,
      phone:           r.phone,
      profession:      r.profession,
      notes:           r.notes,
      interests:       r.interests || [],
      languagesSpoken: r.languages_spoken || [],
      gender:          r.gender,
      ageGroup:        r.age_group,
      maritalStatus:   r.marital_status,
      parentalStatus:  r.parental_status,
      zip:             r.zip,
      locationStatus:  r.location_status,
      heardFrom:       r.heard_from,
      willingToHost:   r.willing_to_host,
      status:          r.status,
    },
  });
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
    const body = req.body || {};

    if (process.env.SUBSCRIBE_SECRET && body.secret !== process.env.SUBSCRIBE_SECRET) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (body.action === 'profile') {
      await handleProfile(req, res, body);
    } else if (body.action === 'get') {
      await handleGet(req, res, body);
    } else {
      await handleJoin(req, res, body);
    }
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
