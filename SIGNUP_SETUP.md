# Event Sign-Up — Setup Guide

The Sign Up button on each event card opens a modal that:

1. Collects: name, email, phone, # guests, optional notes.
2. POSTs the data to **`/api/signup`** (a Vercel serverless function).
3. The function:
   - Inserts a row into a **Neon Postgres** database (Vercel Storage integration).
   - Sends an email notification (optional, via a Formspree endpoint).
   - Sends a WhatsApp message (optional, via CallMeBot).
4. After success, the modal suggests donating with preset amount buttons
   ($20 / $50 / $100 / $150 / Other) linking to the Lev Echad Zeffy form.

---

## Files

- [`api/signup.js`](api/signup.js) — the serverless function.
- [`src/components/SignupModal.tsx`](src/components/SignupModal.tsx) — the
  client-side modal that POSTs to the function.

---

## Required environment variable

Set in Vercel project → Settings → Environment Variables (or auto-set by
the Neon integration):

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Auto-set by the Neon Vercel integration. The connection string to the Postgres database. |

That's the only required variable. Sign-ups will be saved to the database
without anything else configured.

## Optional environment variables (for notifications)

| Name | Value | What it does |
| --- | --- | --- |
| `NOTIFY_EMAIL_ENDPOINT` | A Formspree endpoint URL, e.g. `https://formspree.io/f/mnjwlryl` | If set, every sign-up triggers an email to the address configured on that Formspree form. |
| `NOTIFY_EMAIL_TO` | `mashshosh@gmail.com` (informational) | Used in the email payload — does not actually route the email. |
| `WHATSAPP_PHONE` | `+14126261823` (recipient phone, country code required) | Whose WhatsApp gets the ping. |
| `WHATSAPP_APIKEY` | The CallMeBot APIKEY (obtained by messaging their bot once — see below) | Required for WhatsApp to fire. |
| `SIGNUP_SECRET` | Any random string | Optional anti-spam: if set, the website must send the same string in the `secret` field of the POST body. Useful only if your endpoint URL ever leaks publicly. |

If `NOTIFY_EMAIL_ENDPOINT` is unset → no email is sent.
If `WHATSAPP_PHONE` or `WHATSAPP_APIKEY` is unset → no WhatsApp is sent.
The sign-up is still saved to the database in both cases.

---

## Viewing sign-ups

Vercel dashboard → your project → **Storage** → click your **lev_echad_db** →
**Open in Neon** → table editor → **signups** table.

From there you can sort/filter rows and export to CSV.

Columns:

| Column | Notes |
| --- | --- |
| `id` | serial primary key |
| `submitted_at` | timestamp |
| `event_key` | stable slug per event-instance, e.g. `shabbat-dinner-may-15-2026` — group rows by this to count signups per event |
| `event_name` | self-describing event label including the date (`Shabbat Dinner — May 15, 2026`) |
| `event_date` | raw date string as displayed on the site |
| `name`, `email`, `phone`, `guests`, `notes` | from the form |
| `language` | `en` or `he` |
| `referrer`, `user_agent` | from the request headers |

The table is **auto-created** by the serverless function on the first POST,
so you don't need to run any SQL to set it up. The function also runs idempotent
`ALTER TABLE` migrations on every cold start, so dropped/added columns
propagate automatically the next time someone signs up.

---

## CallMeBot WhatsApp setup (one time, ~2 minutes)

1. Add this contact in your phone:
   - Name: `CallMeBot`
   - Number: `+34 694 23 67 31`
2. Open WhatsApp on the phone that should *receive* the notifications
   (e.g. wife's phone), find that contact, and send:
   ```
   I allow callmebot to send me messages
   ```
3. Wait up to 2 minutes for the bot to reply with a message like:
   > API Activated for your phone number +XXXXXXXXXX. Your APIKEY is **1234567**
4. In Vercel → project → Settings → Environment Variables, add:
   - `WHATSAPP_PHONE` = your phone number with country code, e.g. `+14126261823`
   - `WHATSAPP_APIKEY` = the 7-digit APIKEY from the bot
5. Redeploy (or push any commit — Vercel auto-redeploys on push).

After this, each new sign-up triggers a WhatsApp message with the full
sign-up details to the configured phone.

## Email notifications

The simplest setup is to reuse the existing Formspree form for sign-ups:

1. In Vercel → project → Settings → Environment Variables, add:
   - `NOTIFY_EMAIL_ENDPOINT` = `https://formspree.io/f/mnjwlryl` (the
     dedicated "event_signups" Formspree form already created earlier)
2. Redeploy.

Each sign-up will also email you with the full details. Formspree's free
tier caps at 50/month, but you'll have the database as the source of
truth regardless.

---

## Local development

The serverless function won't run under plain `npm run dev` (Vite doesn't
execute Vercel functions). To test the full flow locally:

```bash
npx vercel dev
```

This requires you to run `vercel login` once and link the project to your
Vercel account.

Without `vercel dev`, the website still works on `npm run dev`, but
submitting the sign-up form will fail (the POST goes nowhere). For most
day-to-day UI work, you don't need this — just deploy via `git push` to
test the real flow.

---

## Notes on donation amounts

The Zeffy preset buttons add `?amount=N` to the donation URL. Most Zeffy
forms honor this and pre-fill the amount; if yours doesn't, set preset
amounts directly inside Zeffy's form settings and the buttons will still
work (Zeffy will just show its own presets).

There is **no automatic capture** of how much each person donated. Zeffy
does not expose donation data to the parent site. Reconcile by matching
emails between your Zeffy dashboard and the `signups` table.
