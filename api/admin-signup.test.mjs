// Smoke test for admin-signup helpers. Run: node api/admin-signup.test.mjs
// Does not hit the DB — just exercises the pure helpers and confirms the
// event_key matches the one /api/signup would produce for the same event.

import { __test as admin } from './admin-signup.js';

const eventName = 'Shabbat Dinner';
const eventDate = 'June 19, 2026';
const key = admin.makeEventKey(eventName, eventDate);

const expectations = [
  ['event_key is slugified',                key === 'shabbat-dinner-june-19-2026'],
  ['clipText trims to max length',           admin.clipText('abcdef', 3) === 'abc'],
  ['clipText is a no-op when short enough',  admin.clipText('abc', 10) === 'abc'],
  ['clipText handles null/undefined',        admin.clipText(null, 5) === '' && admin.clipText(undefined, 5) === ''],
];

let failed = 0;
for (const [label, ok] of expectations) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failed++;
}
process.exitCode = failed === 0 ? 0 : 1;
