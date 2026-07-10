-- Manually-recorded guest list for the Friday, July 10, 2026 Shabbat dinner.
--
-- These names were collected offline by the organizer and are inserted
-- straight into the same `signups` table the public form and the
-- /api/admin-signup endpoint write to, so they tally with any online
-- sign-ups for the same event.
--
-- HOW TO RUN
--   Vercel -> project -> Storage -> lev_echad_db -> "Open in Neon"
--   -> SQL editor -> paste this file -> Run.
--   (No secret needed — just your Vercel/Neon login.)
--
-- The event_key below (shabbat-dinner-july-10-2026) is the same slug the
-- site generates for the 2026-07-10 event, so grouping/counting by
-- event_key includes these rows.
--
-- NOTE: this file has no duplicate guard — running it twice inserts the
-- rows twice. Run it once.

INSERT INTO signups (event_key, event_name, event_date, name, email, phone, guests, notes, language)
VALUES
  ('shabbat-dinner-july-10-2026', 'Shabbat Dinner — July 10, 2026', 'July 10, 2026', 'David Marks',        '', '', 1, 'Added manually by organizer', 'en'),
  ('shabbat-dinner-july-10-2026', 'Shabbat Dinner — July 10, 2026', 'July 10, 2026', 'Mindi Minsky',       '', '', 1, 'Added manually by organizer', 'en'),
  ('shabbat-dinner-july-10-2026', 'Shabbat Dinner — July 10, 2026', 'July 10, 2026', 'Menuchi Kaplan',     '', '', 1, 'Added manually by organizer', 'en'),
  ('shabbat-dinner-july-10-2026', 'Shabbat Dinner — July 10, 2026', 'July 10, 2026', 'Tammy Shemesh',      '', '', 2, 'Added manually by organizer', 'en'),
  ('shabbat-dinner-july-10-2026', 'Shabbat Dinner — July 10, 2026', 'July 10, 2026', 'Alexsander Kopenko', '', '', 1, 'Added manually by organizer', 'en'),
  ('shabbat-dinner-july-10-2026', 'Shabbat Dinner — July 10, 2026', 'July 10, 2026', 'Nachman Mendelson',  '', '', 1, 'Added manually by organizer', 'en'),
  ('shabbat-dinner-july-10-2026', 'Shabbat Dinner — July 10, 2026', 'July 10, 2026', 'Yeushua Tzimon',     '', '', 1, 'Added manually by organizer', 'en');
