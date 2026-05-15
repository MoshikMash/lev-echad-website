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

function getNextFriday(): Date {
  const now = new Date();
  const day = now.getDay();
  const daysUntilFriday = (5 - day + 7) % 7 || 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + daysUntilFriday);
  friday.setHours(0, 0, 0, 0);
  return friday;
}

// Pittsburgh (US Eastern) is the event's local timezone — the candle-lighting
// lookup above and the calendar invite in api/signup.js are both computed for
// Pittsburgh — so the Thursday 22:00 sign-up cutoff is Pittsburgh wall-clock
// time too, regardless of where the visitor's browser is.
const EVENT_TIME_ZONE = 'America/New_York';
const SIGNUP_CUTOFF_HOUR = 22; // Thursday 22:00 Pittsburgh time

// Current weekday (0=Sun..6=Sat) and hour (0-23) in the event's timezone.
function eventZoneNow(): { weekday: number; hour: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: EVENT_TIME_ZONE,
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date());
  const weekdayName = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekdayName);
  let hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  if (hour === 24) hour = 0; // some engines report midnight as 24
  return { weekday, hour };
}

// The event card always shows the upcoming Friday (see getNextFriday). Sign-ups
// for that event close at 22:00 the Thursday before it, and the next event is
// "created" — getNextFriday rolls forward a week — at Friday 00:00, which
// reopens sign-ups. So sign-ups are closed only during Thursday 22:00–24:00
// Pittsburgh time.
function isSignupOpen(): boolean {
  const { weekday, hour } = eventZoneNow();
  const isThursday = weekday === 4;
  return !(isThursday && hour >= SIGNUP_CUTOFF_HOUR);
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
    const friday = getNextFriday();
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
