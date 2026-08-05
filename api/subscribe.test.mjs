// Quick smoke test for the subscribe helpers. Run: node api/subscribe.test.mjs
// Does not hit the DB or any external APIs — it exercises the input whitelists
// (which are what stop a tampered client writing arbitrary values into the
// table) and renders the welcome email a new subscriber will receive.

import { __test } from './subscribe.js';

const {
  normalizeEmail, looksLikeEmail, pickOne, pickMany,
  buildWelcomeText, buildWelcomeHtml, profileUrl, unsubscribeUrl,
  neighborhoodFromZip, INTERESTS, LOCATION_STATUS, PARENTAL,
} = __test;

const TOKEN = '11111111-2222-3333-4444-555555555555';

const enText = buildWelcomeText('en', TOKEN);
const heText = buildWelcomeText('he', TOKEN);
const enHtml = buildWelcomeHtml('en', TOKEN);
const heHtml = buildWelcomeHtml('he', TOKEN);

console.log('==================== WELCOME EMAIL (EN) ====================');
console.log(enText);
console.log();
console.log('==================== WELCOME EMAIL (HE) ====================');
console.log(heText);
console.log();

const checks = [
  // --- email normalisation: the dedupe key for the whole table ---
  ['email lowercased',            normalizeEmail('  Moshe@Example.COM ') === 'moshe@example.com'],
  ['plain address accepted',      looksLikeEmail('a@b.co')],
  ['plus-addressing accepted',    looksLikeEmail('shosh+news@levechadpgh.org')],
  ['missing @ rejected',          !looksLikeEmail('not-an-email')],
  ['missing TLD rejected',        !looksLikeEmail('a@b')],
  ['embedded space rejected',     !looksLikeEmail('a b@c.co')],
  ['empty rejected',              !looksLikeEmail(normalizeEmail(''))],

  // --- single-choice whitelist ---
  ['known location kept',         pickOne('in_pittsburgh', LOCATION_STATUS) === 'in_pittsburgh'],
  ['case-insensitive match',      pickOne('In_Pittsburgh', LOCATION_STATUS) === 'in_pittsburgh'],
  ['unknown value dropped',       pickOne('mars', LOCATION_STATUS) === null],
  ['SQL-ish payload dropped',     pickOne("'; DROP TABLE subscribers;--", LOCATION_STATUS) === null],
  ['empty dropped',               pickOne('', LOCATION_STATUS) === null],
  ['parental status whitelisted', pickOne('young_kids', PARENTAL) === 'young_kids'],
  ['bogus parental dropped',      pickOne('seventeen_kids', PARENTAL) === null],

  // --- zip -> neighbourhood, so we ask one question instead of two ---
  ['15217 is Squirrel Hill',      neighborhoodFromZip('15217') === 'squirrel_hill'],
  ['15213 is Oakland',            neighborhoodFromZip('15213') === 'oakland'],
  ['ZIP+4 still resolves',        neighborhoodFromZip('15217-1234') === 'squirrel_hill'],
  ['surrounding space tolerated', neighborhoodFromZip('  15232 ') === 'shadyside'],
  ['out-of-area ZIP is null',     neighborhoodFromZip('90210') === null],
  ['garbage ZIP is null',         neighborhoodFromZip('abcde') === null],
  ['empty ZIP is null',           neighborhoodFromZip('') === null],

  // --- multi-choice whitelist ---
  ['known interests kept',        JSON.stringify(pickMany(['shabbat_dinners', 'hebrew_learning'], INTERESTS)) === '["shabbat_dinners","hebrew_learning"]'],
  ['unknown interests filtered',  JSON.stringify(pickMany(['shabbat_dinners', 'hacking'], INTERESTS)) === '["shabbat_dinners"]'],
  ['duplicates collapsed',        JSON.stringify(pickMany(['holidays', 'holidays'], INTERESTS)) === '["holidays"]'],
  ['all-unknown becomes null',    pickMany(['nope', 'nada'], INTERESTS) === null],
  ['non-array becomes null',      pickMany('shabbat_dinners', INTERESTS) === null],
  ['empty array becomes null',    pickMany([], INTERESTS) === null],

  // --- link construction: token-keyed, never email-keyed ---
  ['profile url carries token',   profileUrl(TOKEN).includes(TOKEN)],
  ['unsub url carries token',     unsubscribeUrl(TOKEN).includes(TOKEN)],
  ['urls are absolute https',     profileUrl(TOKEN).startsWith('https://') && unsubscribeUrl(TOKEN).startsWith('https://')],
  ['token is url-encoded',        profileUrl('a b/c').includes('a%20b%2Fc')],

  // --- welcome email content ---
  ['EN email has profile link',   enText.includes(profileUrl(TOKEN))],
  ['EN email has unsub link',     enText.includes(unsubscribeUrl(TOKEN))],
  ['HE email has profile link',   heText.includes(profileUrl(TOKEN))],
  ['HE email has unsub link',     heText.includes(unsubscribeUrl(TOKEN))],
  ['EN email makes spam promise', enText.includes('No spam')],
  ['HE email makes spam promise', heText.includes('בלי ספאם')],
  ['EN email gives Shosh phone',  enText.includes('412-626-1823')],
  ['HE email is actually Hebrew', heText.includes('ברוכים הבאים')],
  ['no email address in email body links', !enText.includes('email=') && !heText.includes('email=')],

  // --- welcome email html ---
  ['EN html is ltr',              enHtml.includes('dir="ltr"')],
  ['HE html is rtl',              heHtml.includes('dir="rtl"')],
  ['html has profile button',     enHtml.includes(profileUrl(TOKEN))],
  ['html has unsubscribe link',   enHtml.includes(unsubscribeUrl(TOKEN))],
  ['html starts with DOCTYPE',    enHtml.startsWith('<!DOCTYPE html>')],
];

let failed = 0;
for (const [name, ok] of checks) {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
}

console.log();
console.log(`${checks.length - failed}/${checks.length} passed`);
if (failed) process.exit(1);
