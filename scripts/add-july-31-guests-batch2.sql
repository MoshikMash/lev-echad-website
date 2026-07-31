-- Second batch of manually-recorded guests for the Friday, July 31, 2026
-- Shabbat dinner, collected offline by the organizer after the first batch
-- (scripts/add-july-31-guests.sql) had already been inserted live.
--
-- This file intentionally contains ONLY the two new names so it can be run
-- without re-inserting the earlier batch. Run once; no duplicate guard.
--
-- HOW TO RUN
--   Vercel -> project -> Storage -> lev_echad_db -> "Open in Neon"
--   -> SQL editor -> paste this file -> Run.
--   (No secret needed — just your Vercel/Neon login.)

INSERT INTO signups (event_key, event_name, event_date, name, email, phone, guests, notes, language)
VALUES
  ('shabbat-dinner-july-31-2026', 'Shabbat Dinner — July 31, 2026', 'July 31, 2026', 'Howard Saul', '', '', 1, 'Added manually by organizer', 'en'),
  ('shabbat-dinner-july-31-2026', 'Shabbat Dinner — July 31, 2026', 'July 31, 2026', 'Gill Nahum',  '', '', 1, 'Added manually by organizer', 'en');
