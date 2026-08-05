// Vercel serverless function — one-click-ish unsubscribe from the mailing list.
//
//   GET  /api/unsubscribe?token=UUID   renders a confirmation page
//   POST /api/unsubscribe              (form-encoded token) actually unsubscribes
//
// The GET deliberately does NOT unsubscribe anyone. Corporate mail scanners and
// link-preview bots fetch every URL in an incoming email, so a GET that mutates
// would silently unsubscribe people who never clicked anything. The confirm
// button POSTs instead, which bots don't do.
//
// Everything is keyed by token, never by email address, so no personal data
// travels in the URL (and therefore not into browser history or access logs).
//
// Required env:
//   DATABASE_URL

import { neon } from '@neondatabase/serverless';

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

const SITE_URL = 'https://www.levechadpgh.org';
const ORGANIZER_PHONE = '412-626-1823';

const txt = {
  en: {
    title: 'Unsubscribe',
    confirmHeading: 'Leaving us?',
    confirmBody:
      "You'll stop receiving updates about Shabbat dinners, holidays, and community events.",
    confirmButton: 'Yes, unsubscribe me',
    keep: 'Never mind, keep me on the list',
    doneHeading: "You've been unsubscribed",
    doneBody:
      "We won't email you again. You're always welcome back — and always welcome at our table.",
    rejoin: 'Changed your mind? Join again',
    notFoundHeading: 'That link has expired',
    notFoundBody:
      'We could not find that subscription. It may already have been removed.',
    contact: `Anything we can help with? Text or WhatsApp Shosh at ${ORGANIZER_PHONE}.`,
    back: 'Back to levechadpgh.org',
  },
  he: {
    title: 'הסרה מרשימת התפוצה',
    confirmHeading: 'עוזבים אותנו?',
    confirmBody: 'תפסיקו לקבל עדכונים על ארוחות שבת, חגים ואירועי קהילה.',
    confirmButton: 'כן, הסירו אותי',
    keep: 'בעצם לא, השאירו אותי ברשימה',
    doneHeading: 'הוסרתם מרשימת התפוצה',
    doneBody:
      'לא נשלח לכם יותר אימיילים. תמיד תוכלו לחזור — ותמיד תהיו מוזמנים לשולחן שלנו.',
    rejoin: 'שיניתם את דעתכם? הצטרפו שוב',
    notFoundHeading: 'הקישור פג תוקף',
    notFoundBody: 'לא מצאנו את המנוי הזה. ייתכן שהוא כבר הוסר.',
    contact: `אפשר לעזור במשהו? שלחו SMS או WhatsApp לשוש: ${ORGANIZER_PHONE}`,
    back: 'חזרה ל-levechadpgh.org',
  },
};

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Show enough of the address that someone can tell which mailbox this is,
// without printing it in full on a page that could be shoulder-surfed.
function maskEmail(email) {
  const [user = '', domain = ''] = String(email || '').split('@');
  const head = user.slice(0, 2);
  return `${head}${'•'.repeat(Math.max(1, user.length - 2))}@${domain}`;
}

function page({ language, heading, body, inner }) {
  const t = txt[language] || txt.en;
  const dir = language === 'he' ? 'rtl' : 'ltr';
  return `<!doctype html>
<html lang="${language === 'he' ? 'he' : 'en'}" dir="${dir}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${escapeHtml(t.title)} — Lev Echad</title>
</head>
<body style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;line-height:1.6;">
  <div style="max-width:520px;margin:48px auto;padding:0 16px;">
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">💛</div>
      <h1 style="margin:0 0 12px;font-size:22px;color:#1d4ed8;">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 24px;color:#4b5563;">${escapeHtml(body)}</p>
      ${inner}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 16px;" />
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">${escapeHtml(t.contact)}</p>
      <p style="margin:0;font-size:13px;"><a href="${SITE_URL}" style="color:#2563eb;">${escapeHtml(t.back)}</a></p>
    </div>
  </div>
</body></html>`;
}

function send(res, status, html) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).send(html);
}

function notFound(res, language) {
  const t = txt[language] || txt.en;
  send(res, 404, page({
    language,
    heading: t.notFoundHeading,
    body: t.notFoundBody,
    inner: '',
  }));
}

export default async function handler(req, res) {
  if (!sql) {
    res.status(500).send('Database not configured');
    return;
  }

  const token =
    req.method === 'POST'
      ? String(req.body?.token || '')
      : String(req.query?.token || '');

  if (!token) {
    notFound(res, 'en');
    return;
  }

  try {
    const rows = await sql`
      SELECT email, language, status FROM subscribers WHERE token = ${token} LIMIT 1
    `;
    if (!rows.length) {
      notFound(res, 'en');
      return;
    }

    const sub = rows[0];
    const language = sub.language === 'he' ? 'he' : 'en';
    const t = txt[language];

    if (req.method === 'POST') {
      await sql`
        UPDATE subscribers
           SET status = 'unsubscribed', unsubscribed_at = NOW(), updated_at = NOW()
         WHERE token = ${token}
      `;
      send(res, 200, page({
        language,
        heading: t.doneHeading,
        body: t.doneBody,
        inner: `<p style="margin:0;"><a href="${SITE_URL}/#subscribe" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:600;">${escapeHtml(t.rejoin)}</a></p>`,
      }));
      return;
    }

    // Already unsubscribed — show the done page rather than asking again.
    if (sub.status === 'unsubscribed') {
      send(res, 200, page({
        language,
        heading: t.doneHeading,
        body: t.doneBody,
        inner: `<p style="margin:0;"><a href="${SITE_URL}/#subscribe" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:600;">${escapeHtml(t.rejoin)}</a></p>`,
      }));
      return;
    }

    send(res, 200, page({
      language,
      heading: t.confirmHeading,
      body: t.confirmBody,
      inner: `
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">${escapeHtml(maskEmail(sub.email))}</p>
      <form method="POST" action="/api/unsubscribe">
        <input type="hidden" name="token" value="${escapeHtml(token)}" />
        <button type="submit" style="width:100%;background:#dc2626;color:#fff;border:0;padding:12px 22px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;">${escapeHtml(t.confirmButton)}</button>
      </form>
      <p style="margin:14px 0 0;"><a href="${SITE_URL}" style="color:#6b7280;font-size:14px;">${escapeHtml(t.keep)}</a></p>`,
    }));
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).send('Internal error');
  }
}
