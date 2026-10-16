import { useId, useMemo, useState } from 'react';

/**
 * Formatting data for display with the built-in Intl API (no library needed).
 *
 * Numbers, dates and plurals look different in every language:
 * 1,234,567.5 (en-AU) vs 1.234.567,5 (vi-VN) vs 12,34,567.5 (hi-IN "lakh" grouping).
 * Keep RAW values in state (numbers, Date objects) and format them only
 * when rendering – never store the formatted string.
 */
const LOCALES = [
  { code: 'en-AU', label: 'English (Australia)' },
  { code: 'zh-CN', label: '中文 (China)' },
  { code: 'vi-VN', label: 'Tiếng Việt (Vietnam)' },
  { code: 'hi-IN', label: 'हिन्दी (India)' },
];

const deadline = new Date('2026-10-23T23:59:00+11:00');
// PluralRules only returns a CATEGORY ("one", "few", "other"…); you supply the words.
const EN_WORDS = { one: 'submission', other: 'submissions' };
const EN_SUFFIX = { one: 'st', two: 'nd', few: 'rd', other: 'th' };
const enPlural = new Intl.PluralRules('en');
const enOrdinal = new Intl.PluralRules('en', { type: 'ordinal' }); // 1st, 2nd, 3rd, 4th, 11th, 21st…

export default function IntlFormatting() {
  const [locale, setLocale] = useState('en-AU');
  const [days, setDays] = useState(-1);
  const [count, setCount] = useState(3);
  const id = useId();

  // Intl objects are relatively costly to create → only rebuild when the locale changes.
  const fmt = useMemo(
    () => ({
      currency: new Intl.NumberFormat(locale, { style: 'currency', currency: 'AUD' }),
      percent: new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }),
      compact: new Intl.NumberFormat(locale, { notation: 'compact' }),
      plain: new Intl.NumberFormat(locale),
      unit: new Intl.NumberFormat(locale, { style: 'unit', unit: 'kilometer-per-hour' }),
      date: new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'short', timeZone: 'Australia/Melbourne' }),
      relative: new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
      plural: new Intl.PluralRules(locale),
      ordinal: new Intl.PluralRules(locale, { type: 'ordinal' }),
      list: new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }),
    }),
    [locale],
  );

  const rows = [
    ['NumberFormat – currency AUD', fmt.currency.format(1234567.891)],
    ['NumberFormat – percent', fmt.percent.format(0.8567)],
    ['NumberFormat – compact', fmt.compact.format(1530000)],
    ['NumberFormat – grouping', fmt.plain.format(1234567.5)],
    ['NumberFormat – unit', fmt.unit.format(60)],
    ['DateTimeFormat – full (Melbourne time)', fmt.date.format(deadline)],
    [`RelativeTimeFormat – ${days} day(s)`, fmt.relative.format(days, 'day')],
    [`PluralRules – select(${count})`, `"${fmt.plural.select(count)}" category`],
    ['ListFormat', fmt.list.format(['React', 'FastAPI', 'scikit-learn'])],
  ];

  return (
    <div className="stack">
      <div className="row">
        <label className="field" style={{ minWidth: 200 }}>
          <span className="label">Locale</span>
          <select className="input" value={locale} onChange={(e) => setLocale(e.target.value)}>
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>{l.label} – {l.code}</option>
            ))}
          </select>
        </label>
        <div className="field">
          <label className="label" htmlFor={`${id}-days`}>Days from today: {days}</label>
          <input id={`${id}-days`} type="range" min="-7" max="7" value={days} onChange={(e) => setDays(Number(e.target.value))} />
        </div>
        <div className="field">
          <label className="label" htmlFor={`${id}-count`}>Count: {count}</label>
          <input id={`${id}-count`} type="range" min="1" max="23" value={count} onChange={(e) => setCount(Number(e.target.value))} />
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <tbody>
            {rows.map(([name, output]) => (
              <tr key={name}>
                <th scope="row" className="small">{name}</th>
                {/* lang tells screen readers (and fonts) which language this text is in */}
                <td lang={locale} style={{ whiteSpace: 'normal' }}>{output}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="small muted m-0">
        Plural rules in action (English):{' '}
        <strong>{count} {EN_WORDS[enPlural.select(count)]}</strong>, and your team came{' '}
        <strong>{count}{EN_SUFFIX[enOrdinal.select(count)]}</strong>.
        Current locale ordinal category: <code>{fmt.ordinal.select(count)}</code>.
      </p>
    </div>
  );
}
