import { useState, useEffect } from 'react';

interface ShabbatInfo {
  gregorianDate: string;
  hebrewDate: string;
  hebrewDateHe: string;
  parasha: string;
  parashaHe: string;
  candleLighting: string;
  loading: boolean;
  error: boolean;
  signupOpen: boolean;
}

// Pittsburgh (US Eastern) is the event's local timezone — the candle-lighting
// lookup below and the calendar invite in api/signup.js are both computed for
// Pittsburgh — so the event-rollover and sign-up cutoff are Pittsburgh
// wall-clock times too, regardless of where the visitor's browser is.
const EVENT_TIME_ZONE = 'America/New_York';
const SIGNUP_CUTOFF_HOUR = 22; // Thursday 22:00 Pittsburgh time — sign-ups close
const EVENT_ROLLOVER_HOUR = 21; // Saturday 21:00 Pittsburgh time — next event is created

// Current calendar date + weekday (0=Sun..6=Sat) + hour (0-23) in the event's
// timezone.
function eventZoneNow(): {
  year: number;
  month: number;
  day: number;
  weekday: number;
  hour: number;
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: EVENT_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  let hour = Number(get('hour'));
  if (hour === 24) hour = 0; // some engines report midnight as 24
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday,
    hour,
  };
}

// The Friday of the current Shabbat week. The displayed event rolls forward to
// the next Friday at Saturday 21:00 Pittsburgh time — so the card keeps showing
// "this Shabbat" through the dinner and Shabbat itself, then advances once
// Shabbat is over.
function getEventFriday(): Date {
  const { year, month, day, weekday, hour } = eventZoneNow();
  let daysToFriday: number;
  if (weekday === 6) {
    // Saturday: still this week's Friday until the 21:00 rollover, then next.
    daysToFriday = hour >= EVENT_ROLLOVER_HOUR ? 6 : -1;
  } else if (weekday === 5) {
    daysToFriday = 0; // Friday: tonight's dinner
  } else {
    daysToFriday = 5 - weekday; // Sun–Thu: the coming Friday
  }
  // Built from the Pittsburgh calendar date; downstream code reads it back with
  // local getters, so the Y/M/D round-trips regardless of the browser TZ.
  return new Date(year, month - 1, day + daysToFriday);
}

// Sign-ups for the current event close at 22:00 the Thursday before it and
// reopen when the next event is created at Saturday 21:00 Pittsburgh time. So
// sign-ups are closed from Thursday 22:00 through Saturday 21:00 (covering the
// dinner and Shabbat itself).
function isSignupOpen(): boolean {
  const { weekday, hour } = eventZoneNow();
  if (weekday === 4 && hour >= SIGNUP_CUTOFF_HOUR) return false; // Thu 22:00+
  if (weekday === 5) return false; // all of Friday
  if (weekday === 6 && hour < EVENT_ROLLOVER_HOUR) return false; // Sat before 21:00
  return true;
}

function formatGregorianDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function stripYear(hdate: string): string {
  return hdate.replace(/\s*\d{4}$/, '');
}

export function useShabbatInfo(): ShabbatInfo {
  const [info, setInfo] = useState<Omit<ShabbatInfo, 'signupOpen'>>({
    gregorianDate: '',
    hebrewDate: '',
    hebrewDateHe: '',
    parasha: '',
    parashaHe: '',
    candleLighting: '',
    loading: true,
    error: false,
  });
  const [signupOpen, setSignupOpen] = useState<boolean>(isSignupOpen);

  useEffect(() => {
    const tick = () => setSignupOpen(isSignupOpen());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const friday = getEventFriday();
    const gregorianDate = formatGregorianDate(friday);

    const yyyy = friday.getFullYear();
    const mm = String(friday.getMonth() + 1).padStart(2, '0');
    const dd = String(friday.getDate()).padStart(2, '0');

    const url = `https://www.hebcal.com/shabbat?cfg=json&geonameid=5206379&M=on&start=${yyyy}-${mm}-${dd}&end=${yyyy}-${mm}-${dd}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        let parasha = '';
        let parashaHe = '';
        let hebrewDate = '';
        let candleLighting = '';

        for (const item of data.items || []) {
          if (item.category === 'parashat' && !parasha) {
            parasha = item.title || '';
            parashaHe = item.hebrew || parasha;
          }
          if (item.category === 'candles') {
            if (item.hdate) {
              hebrewDate = stripYear(item.hdate);
            }
            const dt = new Date(item.date);
            candleLighting = dt.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });
          }
          if (!parasha && item.category === 'holiday') {
            parasha = item.title || '';
            parashaHe = item.hebrew || parasha;
          }
        }

        const hebrewDatePromise =
          hebrewDate
            ? Promise.resolve({ en: hebrewDate, he: '' })
            : fetch(
                `https://www.hebcal.com/converter?cfg=json&gy=${yyyy}&gm=${friday.getMonth() + 1}&gd=${friday.getDate()}&g2h=1`
              )
                .then((r) => r.json())
                .then((hd) => ({
                  en: `${hd.hd} ${hd.hm}`,
                  he: hd.hebrew || `${hd.hd} ${hd.hm}`,
                }));

        return hebrewDatePromise.then((hd) => {
          setInfo({
            gregorianDate,
            hebrewDate: hd.en,
            hebrewDateHe: hd.he || hd.en,
            parasha,
            parashaHe,
            candleLighting,
            loading: false,
            error: false,
          });
        });
      })
      .catch(() => {
        setInfo((prev) => ({
          ...prev,
          gregorianDate,
          loading: false,
          error: true,
        }));
      });
  }, []);

  return { ...info, signupOpen };
}
