import { useState, useEffect } from 'react';

type Language = 'en' | 'he';
type Step = 'form' | 'donate' | 'success';

interface SignupModalProps {
  open: boolean;
  onClose: () => void;
  eventName: string;
  eventDate?: string;
  language: Language;
  // Used by the localhost-only preview URL (?preview-step=) to render
  // the donate or success view without going through a real signup.
  initialStep?: Step;
}

const ZEFFY_DONATE_URL =
  'https://www.zeffy.com/en-US/donation-form/help-us-continue-our-mission-at-lev-echad';
const DONATION_PRESETS = [20, 50, 100, 150];

// Sign-ups are POSTed to this site's own Vercel serverless function, which
// writes a row to Neon Postgres and fires email + WhatsApp notifications.
// See api/signup.js and SIGNUP_SETUP.md.
const SIGNUP_ENDPOINT = '/api/signup';

const buildZeffyUrl = (amount?: number) =>
  amount ? `${ZEFFY_DONATE_URL}?amount=${amount}` : ZEFFY_DONATE_URL;

const txt = {
  en: {
    formTitle: 'Sign up',
    eventLabel: 'Event',
    name: 'Full name',
    email: 'Email',
    phone: 'Phone',
    guests: 'Number of guests (including you)',
    notes: 'Notes (allergies, dietary, anything else)',
    optional: 'optional',
    submit: 'Submit sign-up',
    submitting: 'Submitting...',
    donateTitle: 'Thank you for signing up!',
    donateSubtitle:
      "Lev Echad runs on donations — would you like to chip in to help cover this event? Every dollar goes to the community, and it's tax-deductible.",
    pickAmount: 'Choose an amount:',
    other: 'Other',
    donateNote: "We'll open Zeffy in a new tab so you can finish there.",
    skip: 'Maybe later',
    finish: "I'm done",
    successTitle: "You're signed up!",
    successText: "Thank you — we'll see you soon!",
    successEmailNote:
      "We just sent a confirmation email from mashshosh@gmail.com — if you don't see it within a few minutes, please check your spam folder.",
    successDetailsNote:
      "Shosh will be in touch personally with all the further details — the exact address, parking, what to bring, and anything else you need.",
    successFirstTimeNote:
      "First time joining us? Please text or WhatsApp Shosh at 412-626-1823 for a short introduction.",
    shareTitle: 'Share with a friend',
    shareSubtitle:
      'Know someone who could use a warm community? Newcomers are always welcome.',
    shareMessage:
      'I just signed up for a Lev Echad event in Pittsburgh — a warm Jewish community with Shabbat dinners and gatherings. Check it out: https://www.levechadpgh.org',
    shareSubject: 'Check out Lev Echad — a warm Pittsburgh Jewish community',
    shareWhatsApp: 'WhatsApp',
    shareEmail: 'Email',
    shareCopy: 'Copy link',
    shareCopied: 'Copied!',
    shareNative: 'Share',
    close: 'Close',
    errorTitle: 'Something went wrong',
    errorText:
      "We couldn't save your sign-up. Please try again, or text Shosh at 412-626-1823.",
  },
  he: {
    formTitle: 'הרשמה',
    eventLabel: 'אירוע',
    name: 'שם מלא',
    email: 'אימייל',
    phone: 'טלפון',
    guests: 'מספר אורחים (כולל אותך)',
    notes: 'הערות (אלרגיות, תזונה, וכל דבר נוסף)',
    optional: 'אופציונלי',
    submit: 'שלח הרשמה',
    submitting: 'שולח...',
    donateTitle: 'תודה שנרשמת!',
    donateSubtitle:
      'לב אחד פועל מתרומות — האם תרצה לתרום כדי לעזור לכסות את האירוע? כל דולר מגיע לקהילה, וניתן לניכוי ממס.',
    pickAmount: 'בחרו סכום:',
    other: 'אחר',
    donateNote: 'נפתח את Zeffy בכרטיסייה חדשה לסיום התרומה.',
    skip: 'אולי בפעם אחרת',
    finish: 'סיימתי',
    successTitle: 'נרשמת בהצלחה!',
    successText: 'תודה — נתראה בקרוב!',
    successEmailNote:
      'שלחנו לכם אימייל אישור מהכתובת mashshosh@gmail.com — אם הוא לא מגיע תוך כמה דקות, בדקו בתיקיית הספאם.',
    successDetailsNote:
      'שוש תיצור איתכם קשר אישית עם כל הפרטים הנוספים — הכתובת המדויקת, חניה, מה להביא וכל מה שצריך לדעת.',
    successFirstTimeNote:
      'מצטרפים אלינו בפעם הראשונה? שלחו SMS או הודעת WhatsApp לשוש: 412-626-1823 להיכרות קצרה.',
    shareTitle: 'שתפו עם חבר',
    shareSubtitle:
      'מכירים מישהו שיכול להנות מקהילה חמה? חדשים תמיד מוזמנים.',
    shareMessage:
      'בדיוק נרשמתי לאירוע של לב אחד בפיטסבורג — קהילה יהודית חמה עם ארוחות שבת ומפגשים. תראו: https://www.levechadpgh.org',
    shareSubject: 'הצצה ללב אחד — קהילה יהודית חמה בפיטסבורג',
    shareWhatsApp: 'וואטסאפ',
    shareEmail: 'אימייל',
    shareCopy: 'העתק קישור',
    shareCopied: 'הועתק!',
    shareNative: 'שיתוף',
    close: 'סגור',
    errorTitle: 'משהו השתבש',
    errorText:
      'לא הצלחנו לשמור את ההרשמה. נסו שוב, או שלחו הודעה לשוש: 412-626-1823.',
  },
};

export default function SignupModal({
  open,
  onClose,
  eventName,
  eventDate,
  language,
  initialStep = 'form',
}: SignupModalProps) {
  const t = txt[language];
  const dir = language === 'he' ? 'rtl' : 'ltr';

  const [step, setStep] = useState<Step>(initialStep);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState('1');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(initialStep);
      setError(null);
      setCopied(false);
    }
  }, [open, initialStep]);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const SHARE_URL = 'https://www.levechadpgh.org';
  const whatsAppHref = `https://wa.me/?text=${encodeURIComponent(t.shareMessage)}`;
  const mailtoHref = `mailto:?subject=${encodeURIComponent(t.shareSubject)}&body=${encodeURIComponent(t.shareMessage)}`;

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(t.shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — clipboard can fail in non-secure contexts
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Lev Echad', text: t.shareMessage, url: SHARE_URL });
      } catch {
        // user cancelled or share failed — silent
      }
    } else {
      handleCopyShare();
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(SIGNUP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName,
          eventDate: eventDate || '',
          name,
          email,
          phone,
          guests: Number(guests) || 1,
          notes,
          language,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      setStep('donate');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        <button
          onClick={onClose}
          aria-label={t.close}
          className="absolute top-3 right-3 z-10 rounded-full bg-white/90 p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 shadow"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="mb-5">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{t.formTitle}</h3>
              <p className="text-sm text-gray-500">
                {t.eventLabel}: <span className="font-semibold">{eventName}</span>
                {eventDate ? ` — ${eventDate}` : ''}
              </p>
            </div>

            <div className="space-y-4">
              <input
                required
                type="text"
                placeholder={t.name}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                required
                type="email"
                placeholder={t.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                required
                type="tel"
                placeholder={t.phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t.guests}</label>
                <input
                  required
                  type="number"
                  min={1}
                  max={20}
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <textarea
                placeholder={`${t.notes} (${t.optional})`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                <div className="font-semibold">{t.errorTitle}</div>
                <div>{t.errorText}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              {submitting ? t.submitting : t.submit}
            </button>
          </form>
        )}

        {step === 'donate' && (
          <div className="p-6 md:p-8">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">💚</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.donateTitle}</h3>
              <p className="text-gray-600 text-sm">{t.donateSubtitle}</p>
            </div>

            <p className="text-sm font-semibold text-gray-700 mb-3 text-center">
              {t.pickAmount}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              {DONATION_PRESETS.map((amount) => (
                <a
                  key={amount}
                  href={buildZeffyUrl(amount)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setStep('success')}
                  className="inline-flex items-center justify-center rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-3 transition-colors shadow-sm"
                >
                  ${amount}
                </a>
              ))}
              <a
                href={buildZeffyUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setStep('success')}
                className="inline-flex items-center justify-center rounded-xl bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 font-bold px-4 py-3 transition-colors"
              >
                {t.other}
              </a>
            </div>

            <p className="text-xs text-gray-500 text-center mb-5">{t.donateNote}</p>

            <button
              onClick={() => setStep('success')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl transition-colors text-sm"
            >
              {t.skip}
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">✓</div>
            <h3 className="text-2xl font-bold text-green-700 mb-2">{t.successTitle}</h3>
            <p className="text-gray-600 mb-4">{t.successText}</p>
            <div className="mx-auto max-w-md space-y-3 text-left text-sm text-gray-700 mb-6">
              <p className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                {t.successEmailNote}
              </p>
              <p className="rounded-lg bg-green-50 border border-green-100 px-4 py-3">
                {t.successDetailsNote}
              </p>
              <p className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
                {t.successFirstTimeNote}
              </p>
            </div>

            <div className="mx-auto max-w-md mb-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 p-5 text-left">
              <h4 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                <span>💝</span>
                <span>{t.shareTitle}</span>
              </h4>
              <p className="text-sm text-gray-600 mb-4">{t.shareSubtitle}</p>
              <div className={`grid ${canNativeShare ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                <a
                  href={whatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold px-3 py-2.5 text-sm transition-colors shadow-sm"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26L4.6 19.27l1.054-.92zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  {t.shareWhatsApp}
                </a>
                <a
                  href={mailtoHref}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2.5 text-sm transition-colors shadow-sm"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t.shareEmail}
                </a>
                <button
                  type="button"
                  onClick={handleCopyShare}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white border-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold px-3 py-2.5 text-sm transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copied ? t.shareCopied : t.shareCopy}
                </button>
                {canNativeShare && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-2.5 text-sm transition-colors shadow-sm"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    {t.shareNative}
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition-colors"
            >
              {t.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
