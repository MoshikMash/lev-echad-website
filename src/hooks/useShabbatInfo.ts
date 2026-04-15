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

function formatGregorianDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function stripYear(hdate: string): string {
  return hdate.replace(/\s*\d{4}$/, '');
}

export function useShabbatInfo(): ShabbatInfo {
  const [info, setInfo] = useState<ShabbatInfo>({
    gregorianDate: '',
    hebrewDate: '',
    hebrewDateHe: '',
    parasha: '',
    parashaHe: '',
    candleLighting: '',
    loading: true,
    error: false,
  });

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

  return info;
}
