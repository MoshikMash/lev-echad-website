import { useState, useEffect } from 'react';
import { ACTIVE_EVENT_DATES } from '../config/events';

interface ShabbatInfo {
  gregorianDate: string;
  hebrewDate: string;
  hebrewDateHe: string;
  parasha: string;
  parashaHe: string;
  candleLighting: string;
  loading: boolean;
  error: boolean;
  eventActive: boolean;
  signupOpen: boolean;
}

// Pittsburgh (US Eastern) is the event's local timezone — the candle-lighting
// lookup below and the calendar invite in api/signup.js are both computed for
// Pittsburgh — so the event rollover and sign-up cutoff are Pittsburgh
// wall-clock times too, regardless of where the visitor's browser is.
const EVENT_TIME_ZONE = 'America/New_York';
const SIGNUP_CUTOFF_HOUR = 22; // Thursday 22:00 Pittsburgh time — sign-ups close
const EVENT_ROLLOVER_HOUR = 21; // Saturday 21:00 Pittsburgh time — week advances

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

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// The ISO date `days` away from the given YYYY-MM-DD, computed in UTC so the
// calendar arithmetic is unaffected by the browser timezone.
function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// The Friday (YYYY-MM-DD) of the current Shabbat week in Pittsburgh time. It
// rolls forward to the next Friday at Saturday 21:00 Pittsburgh time, so "this
// Shabbat" stays current through the dinner and Shabbat itself.
function currentShabbatFriday(): string {
  const { year, month, day, weekday, hour } = eventZoneNow();
  let daysToFriday: number;
  if (weekday === 6) {
    daysToFriday = hour >= EVENT_ROLLOVER_HOUR ? 6 : -1; // Saturday
  } else if (weekday === 5) {
    daysToFriday = 0; // Friday — tonight's dinner
  } else {
    daysToFriday = 5 - weekday; // Sun–Thu — the coming Friday
  }
  return addDaysISO(isoDate(year, month, day), daysToFriday);
}

// The next scheduled event on or after the current Shabbat week, or null when
// nothing is scheduled. Events are opt-in — see src/config/events.ts.
function nextActiveEvent(): string | null {
  const from = currentShabbatFriday();
  const upcoming = ACTIVE_EVENT_DATES.filter((d) => d >= from).sort();
  return upcoming[0] ?? null;
}

// Sign-ups for a given event close at 22:00 the Thursday before it (Pittsburgh
// time); until then they're open.
function isSignupOpen(eventFridayISO: string): boolean {
  const { year, month, day, hour } = eventZoneNow();
  const today = isoDate(year, month, day);
  const cutoffDay = addDaysISO(eventFridayISO, -1); // the Thursday before
  if (today < cutoffDay) return true;
  if (today > cutoffDay) return false;
  return hour < SIGNUP_CUTOFF_HOUR;
}

function formatGregorianDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function stripYear(hdate: string): string {
  return hdate.replace(/\s*\d{4}$/, '');
}

const EMPTY: Omit<ShabbatInfo, 'eventActive' | 'signupOpen'> = {
  gregorianDate: '',
  hebrewDate: '',
  hebrewDateHe: '',
  parasha: '',
  parashaHe: '',
  candleLighting: '',
  loading: true,
  error: false,
};

export function useShabbatInfo(): ShabbatInfo {
  const [info, setInfo] = useState(EMPTY);
  const [eventActive, setEventActive] = useState<boolean>(() => nextActiveEvent() !== null);
  const [signupOpen, setSignupOpen] = useState<boolean>(() => {
    const next = nextActiveEvent();
    return next !== null && isSignupOpen(next);
  });

  useEffect(() => {
    const tick = () => {
      const next = nextActiveEvent();
      setEventActive(next !== null);
      setSignupOpen(next !== null && isSignupOpen(next));
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const next = nextActiveEvent();
    if (!next) {
      setInfo({ ...EMPTY, loading: false });
      return;
    }

    const gregorianDate = formatGregorianDate(next);
    const [yyyy, mm, dd] = next.split('-');
    const url = `https://www.hebcal.com/shabbat?cfg=json&geonameid=5206379&M=on&start=${next}&end=${next}`;

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
                `https://www.hebcal.com/converter?cfg=json&gy=${yyyy}&gm=${Number(mm)}&gd=${Number(dd)}&g2h=1`
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

  return { ...info, eventActive, signupOpen };
}
