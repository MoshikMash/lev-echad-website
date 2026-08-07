import { useEffect, useState } from 'react';

type Language = 'en' | 'he';

// Where on the page this instance lives. Stored as `consent_source` so we can
// tell which placement actually converts (and whether the Facebook post did).
export type SubscribeSource = 'section' | 'footer' | 'events' | 'modal';

// Visual treatment. The three placements sit on very different backgrounds:
// a light section, the dark footer, and the blue events band.
type Variant = 'section' | 'footer' | 'events';

interface SubscribeFormProps {
  language: Language;
  source: SubscribeSource;
  variant?: Variant;
  /** Overrides the default headline — used by the events empty/closed states. */
  headline?: string;
  subline?: string;
}

const SUBSCRIBE_ENDPOINT = '/api/subscribe';

const txt = {
  en: {
    headline: 'Join our community',
    subline:
      "Leave your email and we'll keep you posted on what's happening — Shabbat dinners, holidays, and everything new at Lev Echad. No spam, just an invitation now and then.",
    footerHeadline: 'Stay in touch',
    footerSubline: 'Hear about upcoming events',
    email: 'Your email',
    submit: 'Count me in',
    submitting: 'Joining...',
    joined: "You're in! 💛",
    joinedNote: "We've sent you a welcome email.",
    alreadyNote:
      "You're already on our list — we've emailed you a link to update your details.",
    error: "That didn't work. Please try again, or text Shosh at 412-626-1823.",
    profileTitle: "You're in! 💛",
    profileSubtitle:
      'Please let us know a bit about you, so we can help you in the best way, invite you to the events that suit you, and send you the information that actually fits.',
    profileOptional: 'Everything here is optional — skip anything you’d rather not answer.',
    interestsLabel: 'What would you like to see?',
    interestsHint: 'Some of these are ideas we’re exploring — tell us what you’d actually come to.',
    aboutLabel: 'About you',
    name: 'Name',
    phone: 'Phone (for WhatsApp)',
    profession: 'What do you do?',
    gender: 'Gender',
    age: 'Age',
    marital: 'Marital status',
    parental: 'Children',
    zip: 'ZIP code',
    zipHint: 'Helps us know your area — useful for walking distance on Shabbat and for carpools.',
    locationStatus: 'Where are you?',
    choose: 'Choose…',
    languagesSpoken: 'Languages you speak',
    hostLabel: "I'd be happy to host or co-host a Shabbat dinner",
    heardFrom: 'How did you hear about us?',
    notes: 'Anything you’d like us to know?',
    save: 'Save',
    saving: 'Saving...',
    skip: 'Skip for now',
    done: 'Thank you! 💛',
    doneNote: "Shosh will be in touch. See you at the next one.",
    close: 'Close',
  },
  he: {
    headline: 'הצטרפו לקהילה שלנו',
    subline:
      'השאירו אימייל ונעדכן אתכם במה שקורה — ארוחות שבת, חגים, וכל מה שחדש בלב אחד. בלי ספאם, רק הזמנה מדי פעם.',
    footerHeadline: 'נשארים בקשר',
    footerSubline: 'עדכונים על אירועים קרובים',
    email: 'האימייל שלכם',
    submit: 'אני רוצה להצטרף',
    submitting: 'מצטרפים...',
    joined: 'אתם בפנים! 💛',
    joinedNote: 'שלחנו לכם אימייל ברוכים הבאים.',
    alreadyNote: 'אתם כבר ברשימה — שלחנו לכם אימייל עם קישור לעדכון הפרטים.',
    error: 'משהו השתבש. נסו שוב, או שלחו הודעה לשוש: 412-626-1823.',
    profileTitle: 'אתם בפנים! 💛',
    profileSubtitle:
      'ספרו לנו קצת עליכם, כדי שנוכל לעזור לכם בצורה הטובה ביותר, להזמין אתכם לאירועים שמתאימים לכם, ולשלוח לכם את המידע שבאמת רלוונטי.',
    profileOptional: 'הכל אופציונלי — אפשר לדלג על כל שאלה.',
    interestsLabel: 'מה הייתם רוצים לראות?',
    interestsHint: 'חלק מהדברים האלה הם רעיונות שאנחנו בוחנים — ספרו לנו למה באמת תבואו.',
    aboutLabel: 'קצת עליכם',
    name: 'שם',
    phone: 'טלפון (ל-WhatsApp)',
    profession: 'במה אתם עוסקים?',
    gender: 'מגדר',
    age: 'גיל',
    marital: 'מצב משפחתי',
    parental: 'ילדים',
    zip: 'מיקוד (ZIP)',
    zipHint: 'עוזר לנו לדעת באיזה אזור אתם — חשוב למרחק הליכה בשבת ולנסיעות משותפות.',
    locationStatus: 'איפה אתם?',
    choose: 'בחרו…',
    languagesSpoken: 'שפות שאתם דוברים',
    hostLabel: 'אשמח לארח או לארח יחד ארוחת שבת',
    heardFrom: 'איך שמעתם עלינו?',
    notes: 'משהו שתרצו שנדע?',
    save: 'שמירה',
    saving: 'שומרים...',
    skip: 'אולי אחר כך',
    done: 'תודה! 💛',
    doneNote: 'שוש תיצור איתכם קשר. נתראה בקרוב.',
    close: 'סגור',
  },
};

// `icon` is rendered in its own element so mixing Hebrew letters (אבג) into an
// English list doesn't let the bidi algorithm reorder the surrounding label.
const INTERESTS: { value: string; icon: string; en: string; he: string }[] = [
  { value: 'shabbat_dinners', icon: '🕯️', en: 'Shabbat dinners',   he: 'ארוחות שבת' },
  { value: 'torah_learning',  icon: '📖', en: 'Torah learning together (Chavruta)', he: 'לימוד תורה בחברותא' },
  { value: 'hebrew_learning', icon: 'אבג', en: 'Hebrew learning',   he: 'לימוד עברית' },
  { value: 'english_practice',icon: '🗣️', en: 'English practice',   he: 'תרגול אנגלית' },
  { value: 'professional',    icon: '💼', en: 'Professional networking', he: 'נטוורקינג מקצועי' },
  { value: 'holidays',        icon: '🎉', en: 'Holidays',           he: 'חגים' },
  { value: 'life_stage',      icon: '👥', en: 'Events for people at a similar life stage', he: 'אירועים לאנשים בשלב חיים דומה' },
  { value: 'volunteering',    icon: '🤝', en: 'Volunteering',       he: 'התנדבות' },
  { value: 'settling',        icon: '🏡', en: 'Settling into Pittsburgh', he: 'קליטה בפיטסבורג' },
  { value: 'family_kids',     icon: '👶', en: 'Family & kids',      he: 'משפחה וילדים' },
  { value: 'israeli',         icon: '🇮🇱', en: 'Israeli community',  he: 'קהילה ישראלית' },
];

const SPOKEN_LANGUAGES = [
  { value: 'english', en: 'English', he: 'אנגלית' },
  { value: 'hebrew',  en: 'Hebrew',  he: 'עברית' },
  { value: 'russian', en: 'Russian', he: 'רוסית' },
  { value: 'spanish', en: 'Spanish', he: 'ספרדית' },
  { value: 'yiddish', en: 'Yiddish', he: 'יידיש' },
];

const GENDERS = [
  { value: 'female',     en: 'Female',            he: 'נקבה' },
  { value: 'male',       en: 'Male',              he: 'זכר' },
  { value: 'prefer_not', en: 'Prefer not to say', he: 'מעדיף/ה לא לומר' },
];

const AGE_GROUPS = [
  { value: 'student',  en: 'Student', he: 'סטודנט/ית' },
  { value: '20s_30s',  en: '20s–30s', he: '20–30' },
  { value: '30s_40s',  en: '30s–40s', he: '30–40' },
  { value: '40s_50s',  en: '40s–50s', he: '40–50' },
  { value: '50_plus',  en: '50+',     he: '50+' },
];

const MARITAL = [
  { value: 'single',       en: 'Single',            he: 'רווק/ה' },
  { value: 'relationship', en: 'In a relationship', he: 'בזוגיות' },
  { value: 'married',      en: 'Married',           he: 'נשוי/אה' },
  { value: 'divorced',     en: 'Divorced',          he: 'גרוש/ה' },
  { value: 'widowed',      en: 'Widowed',           he: 'אלמן/ה' },
  { value: 'prefer_not',   en: 'Prefer not to say', he: 'מעדיף/ה לא לומר' },
];

// Replaces the old neighbourhood dropdown. The neighbourhood is derived from
// the ZIP server-side, so asking for it separately was making the visitor do
// work we can do ourselves.
const LOCATION_STATUS = [
  { value: 'in_pittsburgh', en: 'I live in Pittsburgh',        he: 'אני גר/ה בפיטסבורג' },
  { value: 'moving_soon',   en: 'Moving to Pittsburgh',        he: 'עובר/ת לפיטסבורג' },
  { value: 'considering',   en: 'Thinking about moving here',  he: 'שוקל/ת לעבור לכאן' },
  { value: 'not_pgh',       en: 'None of these',               he: 'אף אחד מאלה' },
];

const PARENTAL_STATUS = [
  { value: 'no_kids',     en: 'No children',        he: 'ללא ילדים' },
  { value: 'expecting',   en: 'Expecting',          he: 'בהריון' },
  { value: 'young_kids',  en: 'Young children',     he: 'ילדים קטנים' },
  { value: 'school_age',  en: 'School-age children',he: 'ילדים בגיל בית ספר' },
  { value: 'grown_kids',  en: 'Grown children',     he: 'ילדים בוגרים' },
  { value: 'prefer_not',  en: 'Prefer not to say',  he: 'מעדיף/ה לא לומר' },
];

const HEARD_FROM = [
  { value: 'facebook', en: 'Facebook',      he: 'פייסבוק' },
  { value: 'friend',   en: 'A friend',      he: 'חבר/ה' },
  { value: 'event',    en: 'At an event',   he: 'באירוע' },
  { value: 'google',   en: 'Google',        he: 'גוגל' },
  { value: 'other',    en: 'Somewhere else',he: 'מקום אחר' },
];

function label(opt: { en: string; he: string }, language: Language) {
  return language === 'he' ? opt.he : opt.en;
}

type Opt = { value: string; en: string; he: string };

// A visible label above every control. Relying on a placeholder alone made the
// dropdowns read as empty boxes, and a placeholder disappears the moment a
// value is picked — so the field stops explaining itself exactly when the
// answer matters.
function Field({
  label: text,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{text}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
  language,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Opt[];
  language: Language;
  placeholder: string;
  className: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {label(o, language)}
        </option>
      ))}
    </select>
  );
}

export default function SubscribeForm({
  language,
  source,
  variant = 'section',
  headline,
  subline,
}: SubscribeFormProps) {
  const t = txt[language];
  const dir = language === 'he' ? 'rtl' : 'ltr';

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [joined, setJoined] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    try {
      const res = await fetch(SUBSCRIBE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', email, language, source }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      // The API returns a token only for a brand-new subscriber — that's the
      // immediate "tell us about yourself" path. An existing subscriber gets
      // their personal link by email instead, so someone typing another
      // person's address can't open (or edit) that person's profile.
      setToken(body?.token ?? null);
      setJoined(true);
      setShowProfile(true);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const isFooter = variant === 'footer';
  const onDark = variant === 'footer' || variant === 'events';

  const inputClass = onDark
    ? 'w-full rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50'
    : 'w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500';

  const buttonClass = onDark
    ? 'rounded-xl bg-white px-6 py-2.5 font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:bg-white/50'
    : 'rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400';

  return (
    <>
      <div dir={dir} className={isFooter ? '' : 'text-center'}>
        {!isFooter && (
          <h3 className={`mb-2 text-2xl font-bold ${onDark ? 'text-white' : 'text-gray-900'}`}>
            {headline ?? t.headline}
          </h3>
        )}
        {isFooter && (
          <h4 className="mb-1 font-semibold text-white">{t.footerHeadline}</h4>
        )}
        <p
          className={`mb-4 text-sm ${onDark ? 'text-blue-100' : 'text-gray-600'} ${
            isFooter ? '' : 'mx-auto max-w-xl'
          }`}
        >
          {isFooter ? t.footerSubline : subline ?? t.subline}
        </p>

        {joined ? (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              onDark ? 'bg-white/15 text-white' : 'bg-green-50 text-green-800'
            }`}
          >
            <span className="font-semibold">{t.joined}</span>{' '}
            <span className={onDark ? 'text-blue-100' : ''}>
              {token ? t.joinedNote : t.alreadyNote}
            </span>
          </div>
        ) : (
          <form
            onSubmit={handleJoin}
            className={`flex gap-2 ${isFooter ? '' : 'mx-auto max-w-md flex-col sm:flex-row'}`}
          >
            <input
              required
              type="email"
              autoComplete="email"
              placeholder={t.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            <button type="submit" disabled={submitting} className={`${buttonClass} whitespace-nowrap`}>
              {submitting ? t.submitting : t.submit}
            </button>
          </form>
        )}

        {error && (
          <p className={`mt-3 text-sm ${onDark ? 'text-red-100' : 'text-red-600'}`}>{t.error}</p>
        )}
      </div>

      {showProfile && token && (
        <ProfileModal
          language={language}
          token={token}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
}

interface ProfileModalProps {
  language: Language;
  token: string;
  onClose: () => void;
}

// Exported so App.tsx can open it straight from the ?profile=TOKEN link in the
// welcome email, without the visitor having to re-enter their address.
export function ProfileModal({ language, token, onClose }: ProfileModalProps) {
  const t = txt[language];
  const dir = language === 'he' ? 'rtl' : 'ltr';

  const [interests, setInterests] = useState<string[]>([]);
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [gender, setGender] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [parentalStatus, setParentalStatus] = useState('');
  const [zip, setZip] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [heardFrom, setHeardFrom] = useState('');
  const [willingToHost, setWillingToHost] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Pre-fill from what we already know, so opening this from the email link
  // reads as "manage my details" rather than a blank quiz. Best-effort, and
  // each setter only fills a field the visitor hasn't touched yet — a slow
  // response never clobbers something they're mid-typing.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(SUBSCRIBE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get', token }),
        });
        if (!res.ok) return;
        const body = await res.json();
        const p = body?.profile;
        if (!p || cancelled) return;
        setName((v) => v || p.name || '');
        setPhone((v) => v || p.phone || '');
        setProfession((v) => v || p.profession || '');
        setNotes((v) => v || p.notes || '');
        setGender((v) => v || p.gender || '');
        setAgeGroup((v) => v || p.ageGroup || '');
        setMaritalStatus((v) => v || p.maritalStatus || '');
        setParentalStatus((v) => v || p.parentalStatus || '');
        setZip((v) => v || p.zip || '');
        setLocationStatus((v) => v || p.locationStatus || '');
        setHeardFrom((v) => v || p.heardFrom || '');
        setWillingToHost((v) => v || !!p.willingToHost);
        setInterests((v) => (v.length ? v : p.interests || []));
        setLanguagesSpoken((v) => (v.length ? v : p.languagesSpoken || []));
      } catch {
        // The empty form still works — saving COALESCEs on the server, so
        // untouched fields keep their stored values either way.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Functional updater, not `list` from the closure: two chips tapped inside a
  // single React batch would both read the same stale array and the second
  // would clobber the first.
  const toggle = (setList: React.Dispatch<React.SetStateAction<string[]>>, value: string) =>
    setList((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(SUBSCRIBE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'profile',
          token,
          name,
          phone,
          profession,
          notes,
          interests,
          languagesSpoken,
          gender,
          ageGroup,
          maritalStatus,
          parentalStatus,
          zip,
          locationStatus,
          heardFrom,
          willingToHost,
        }),
      });
      setSaved(true);
    } catch {
      // They are already subscribed — the profile is a bonus, so a failure
      // here should never look like the sign-up itself went wrong.
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm transition-colors ${
      active
        ? 'border-blue-600 bg-blue-600 text-white'
        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
    }`;

  const selectClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

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
          className="absolute top-3 right-3 z-10 rounded-full bg-white/90 p-2 text-gray-500 shadow hover:bg-gray-100 hover:text-gray-700"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {saved ? (
          <div className="p-8 text-center">
            <div className="mb-4 text-5xl">💛</div>
            <h3 className="mb-2 text-2xl font-bold text-green-700">{t.done}</h3>
            <p className="mb-6 text-gray-600">{t.doneNote}</p>
            <button
              onClick={onClose}
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-white transition-colors hover:bg-blue-700"
            >
              {t.close}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 md:p-8">
            <div className="mb-6">
              <h3 className="mb-3 text-2xl font-bold text-gray-900">{t.profileTitle}</h3>
              <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-base font-semibold text-blue-900">
                {t.profileSubtitle}
              </p>
              <p className="mt-2 text-xs text-gray-500">{t.profileOptional}</p>
            </div>

            {/* "About you" leads, because it is the part that lets Shosh
                actually tailor an invitation. Every control carries its own
                label rather than relying on a placeholder. */}
            <p className="mb-3 text-lg font-bold text-gray-900">{t.aboutLabel}</p>
            <div className="mb-5 grid gap-4 sm:grid-cols-2">
              <Field label={t.name}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label={t.phone}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label={t.gender}>
                <Select value={gender} onChange={setGender} options={GENDERS} language={language} placeholder={t.choose} className={selectClass} />
              </Field>
              <Field label={t.age}>
                <Select value={ageGroup} onChange={setAgeGroup} options={AGE_GROUPS} language={language} placeholder={t.choose} className={selectClass} />
              </Field>
              <Field label={t.marital}>
                <Select value={maritalStatus} onChange={setMaritalStatus} options={MARITAL} language={language} placeholder={t.choose} className={selectClass} />
              </Field>
              <Field label={t.parental}>
                <Select value={parentalStatus} onChange={setParentalStatus} options={PARENTAL_STATUS} language={language} placeholder={t.choose} className={selectClass} />
              </Field>
              <Field label={t.locationStatus}>
                <Select value={locationStatus} onChange={setLocationStatus} options={LOCATION_STATUS} language={language} placeholder={t.choose} className={selectClass} />
              </Field>
              <Field label={t.zip} hint={t.zipHint}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="15217"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label={t.profession}>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label={t.heardFrom}>
                <Select value={heardFrom} onChange={setHeardFrom} options={HEARD_FROM} language={language} placeholder={t.choose} className={selectClass} />
              </Field>
            </div>

            <div className="mb-6">
              <p className="mb-1 text-lg font-bold text-gray-900">{t.interestsLabel}</p>
              <p className="mb-3 text-xs text-gray-500">{t.interestsHint}</p>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((item) => {
                  const active = interests.includes(item.value);
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => toggle(setInterests, item.value)}
                      className={`${chip(active)} inline-flex items-center gap-2`}
                    >
                      <span
                        dir={item.value === 'hebrew_learning' ? 'rtl' : undefined}
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>
                      <span>{label(item, language)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <input
                type="checkbox"
                checked={willingToHost}
                onChange={(e) => setWillingToHost(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-none accent-amber-600"
              />
              <span className="text-sm text-amber-900">{t.hostLabel}</span>
            </label>

            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-gray-800">{t.languagesSpoken}</p>
              <div className="flex flex-wrap gap-2">
                {SPOKEN_LANGUAGES.map((o) => {
                  const active = languagesSpoken.includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggle(setLanguagesSpoken, o.value)}
                      className={chip(active)}
                    >
                      {label(o, language)}
                    </button>
                  );
                })}
              </div>
            </div>

            <textarea
              placeholder={t.notes}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
            />

            <div className="mt-6 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
              >
                {saving ? t.saving : t.save}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 text-sm text-gray-500 transition-colors hover:text-gray-700"
              >
                {t.skip}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
