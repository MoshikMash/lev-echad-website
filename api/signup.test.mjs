// Quick smoke test for the signup helpers. Run: node api/signup.test.mjs
// Does not hit the DB or any external APIs — just renders the strings the
// signing-up user will see, and the WhatsApp payload Shosh will receive.

import { __test } from './signup.js';

const sample = {
  eventName: 'Shabbat Dinner',
  eventDate: 'May 15, 2026',
  name: 'Test User',
  email: 'test@example.com',
  phone: '555-123-4567',
  guests: 2,
  notes: 'vegetarian',
  language: 'en',
};

const calendarLink = __test.buildCalendarLink(sample);
const payload = { ...sample, calendarLink };

console.log('==================== CONFIRMATION EMAIL (to user) ====================');
console.log(__test.buildUserConfirmationText(payload));
console.log();
console.log('==================== ORGANIZER SUMMARY (WhatsApp + email) ====================');
console.log(__test.buildSummaryText(payload));
console.log();
console.log('==================== CALENDAR LINK ====================');
console.log(calendarLink);
console.log();

const emailBody = __test.buildUserConfirmationText(payload);
const emailHtml = __test.buildUserConfirmationHtml(payload);
const expectations = [
  ['email mentions Squirrel Hill, 15217', emailBody.includes('Squirrel Hill, Pittsburgh, 15217')],
  ['email does NOT leak street address', !emailBody.includes('Phillips Ave')],
  ['email tells first-timers to text Shosh',  emailBody.includes('first time') && emailBody.includes('412-626-1823')],
  ['email says guests don\'t need to bring anything',  emailBody.includes("don't need to bring anything")],
  ['email says Shosh reaches out personally',  emailBody.includes('Shosh will reach out')],
  ['calendar location is neighborhood-only', decodeURIComponent(calendarLink).includes('location=Squirrel+Hill') || decodeURIComponent(calendarLink).includes('location=Squirrel Hill')],
  ['calendar details mention Shosh phone',   decodeURIComponent(calendarLink).includes('412-626-1823')],
  ['calendar details do NOT leak street',    !decodeURIComponent(calendarLink).includes('Phillips')],
  ['calendar start time is 22:30 UTC (6:30 PM EDT for May)', calendarLink.includes('20260515T223000Z')],
  ['html email contains DOCTYPE and styled wrapper', emailHtml.startsWith('<!DOCTYPE html>') && emailHtml.includes('Add to your calendar')],
  ['html email mentions the user name', emailHtml.includes('Test User')],
  ['html email does NOT leak street address', !emailHtml.includes('Phillips Ave')],
];

let failed = 0;
for (const [label, ok] of expectations) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failed++;
}

process.exitCode = failed === 0 ? 0 : 1;
