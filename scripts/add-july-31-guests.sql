-- Manually-recorded guest list additions for the Friday, July 31, 2026
-- Shabbat dinner.
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
-- The event_key below (shabbat-dinner-july-31-2026) is the same slug the
-- site generates for the 2026-07-31 event, so grouping/counting by
-- event_key includes these rows.
--
-- NOTE: this file has no duplicate guard — running it twice inserts the
-- rows twice. Run it once.

INSERT INTO signups (event_key, event_name, event_date, name, email, phone, guests, notes, language)
VALUES
  ('shabbat-dinner-july-31-2026', 'Shabbat Dinner — July 31, 2026', 'July 31, 2026', 'David Marks',      '', '', 1, 'Added manually by organizer', 'en'),
  ('shabbat-dinner-july-31-2026', 'Shabbat Dinner — July 31, 2026', 'July 31, 2026', 'Mendy Minsky',     '', '', 1, 'Added manually by organizer', 'en'),
  ('shabbat-dinner-july-31-2026', 'Shabbat Dinner — July 31, 2026', 'July 31, 2026', 'Atar Tenenboem',   '', '', 5, 'Added manually by organizer', 'en'),
  ('shabbat-dinner-july-31-2026', 'Shabbat Dinner — July 31, 2026', 'July 31, 2026', 'Daniel Wienn',     '', '', 3, 'Added manually by organizer', 'en');
