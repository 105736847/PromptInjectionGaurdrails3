/**
 * scaleSpecs.js – what the Scales explorer knows about each d3 scale type:
 * default domain/range, how to turn the text inputs into a real scale, and
 * the line of code that would build the same scale in your own project.
 *
 * kind: 'continuous' – number/date in → number out (has .invert())
 *       'band'       – category in → number out (bands or points)
 *       'ordinal'    – category in → any value out (e.g. a colour)
 *       'segments'   – number in → one of a few values out (quantize / threshold)
 */
import * as d3 from 'd3';

export const SCALE_TYPES = [
  { id: 'linear', fn: 'scaleLinear', kind: 'continuous', domain: '0, 100', range: '0, 500',
    blurb: 'output = a · input + b. The default choice for quantities such as marks or prices.' },
  { id: 'log', fn: 'scaleLog', kind: 'continuous', domain: '1, 10000', range: '0, 500',
    blurb: 'Equal RATIOS get equal space (1→10 is as wide as 1,000→10,000). The domain must not include 0.' },
  { id: 'sqrt', fn: 'scaleSqrt', kind: 'continuous', domain: '0, 100', range: '0, 30',
    blurb: 'Use it for circle radius: then the circle AREA is proportional to the value.' },
  { id: 'pow', fn: 'scalePow', kind: 'continuous', domain: '0, 100', range: '0, 500',
    blurb: 'output ∝ input^k. Exponent 1 is linear, 0.5 is the square root.' },
  { id: 'time', fn: 'scaleTime', kind: 'continuous', domain: '2026-02-23, 2026-06-12', range: '0, 500',
    blurb: 'A linear scale for Date objects, with calendar-aware ticks (weeks, months…).' },
  { id: 'band', fn: 'scaleBand', kind: 'band', domain: 'Mon, Tue, Wed, Thu, Fri', range: '0, 500',
    blurb: 'Categories → equal bands with a width. Made for bar charts.' },
  { id: 'point', fn: 'scalePoint', kind: 'band', domain: 'Mon, Tue, Wed, Thu, Fri', range: '0, 500',
    blurb: 'Categories → evenly spaced points (a band scale whose bandwidth is 0).' },
  { id: 'ordinal', fn: 'scaleOrdinal', kind: 'ordinal', domain: 'Lecture, Tutorial, Lab, Workshop',
    range: 'chart-1, chart-2, chart-3',
    blurb: 'Category → any value, typically a colour. With more categories than colours it CYCLES.' },
  { id: 'quantize', fn: 'scaleQuantize', kind: 'segments', domain: '0, 100', range: 'N, P, C, D, HD',
    blurb: 'Number → one of a few values, by cutting the domain into EQUAL segments.' },
  { id: 'threshold', fn: 'scaleThreshold', kind: 'segments', domain: '50, 65, 75, 85', range: 'N, P, C, D, HD',
    blurb: 'Number → one of a few values at cut-offs YOU choose – exactly like grade boundaries.' },
];

const parseDay = d3.timeParse('%Y-%m-%d'); // local time, like scaleTime
const list = (text) => text.split(',').map((s) => s.trim()).filter(Boolean);
const quote = (items) => items.map((v) => `'${v}'`).join(', ');
// Shorthand: typing chart-3 means the CSS colour token var(--chart-3) – the value the scale really returns.
const cssVar = (v) => (/^chart-\d$/.test(v) ? `var(--${v})` : v);

export const formatNumber = d3.format(',.2~f');
export const formatDay = d3.timeFormat('%-d %b %Y');

/** Returns { error } or { scale, code, warning } for the text the user typed. */
export function buildScale(type, { domainText, rangeText, exponent, nice, clamp, padding }) {
  const domainItems = list(domainText);
  const rangeItems = list(rangeText);
  const numbers = (items) => items.map(Number);
  const allFinite = (values) => values.every(Number.isFinite);

  if (type.kind === 'continuous') {
    const domain = type.id === 'time' ? domainItems.map(parseDay) : numbers(domainItems);
    const range = numbers(rangeItems);
    if (domain.length !== 2 || domain.some((d) => d === null || Number.isNaN(+d))) {
      return { error: type.id === 'time' ? 'Domain: two dates like 2026-02-23, 2026-06-12' : 'Domain: two numbers, e.g. 0, 100' };
    }
    if (+domain[0] === +domain[1]) return { error: 'Domain: the two values must differ' };
    if (type.id === 'log' && domain[0] * domain[1] <= 0) {
      return { error: 'A log scale’s domain must not include or cross 0 (log(0) is −∞)' };
    }
    if (range.length !== 2 || !allFinite(range)) return { error: 'Range: two numbers, e.g. 0, 500' };

    const scale = d3[type.fn]().domain(domain).range(range);
    if (type.id === 'pow') scale.exponent(exponent);
    if (nice) scale.nice();
    scale.clamp(clamp);
    const domainCode =
      type.id === 'time'
        ? domain.map((d) => `new Date(${d.getFullYear()}, ${d.getMonth()}, ${d.getDate()})`).join(', ')
        : domain.join(', ');
    const code =
      `d3.${type.fn}()${type.id === 'pow' ? `.exponent(${exponent})` : ''}` +
      `.domain([${domainCode}]).range([${range.join(', ')}])${nice ? '.nice()' : ''}${clamp ? '.clamp(true)' : ''}`;
    return { scale, code };
  }

  if (type.kind === 'band') {
    const range = numbers(rangeItems);
    if (domainItems.length < 1) return { error: 'Domain: one or more categories, separated by commas' };
    if (range.length !== 2 || !allFinite(range)) return { error: 'Range: two numbers, e.g. 0, 500' };
    const scale = d3[type.fn]().domain(domainItems).range(range).padding(padding);
    return { scale, code: `d3.${type.fn}().domain([${quote(domainItems)}]).range([${range.join(', ')}]).padding(${padding})` };
  }

  if (type.kind === 'ordinal') {
    if (domainItems.length < 1 || rangeItems.length < 1) return { error: 'Domain and range: comma-separated lists' };
    const colours = rangeItems.map(cssVar);
    const scale = d3.scaleOrdinal().domain(domainItems).range(colours);
    const warning =
      domainItems.length > rangeItems.length
        ? `${domainItems.length} categories but only ${rangeItems.length} range values – scaleOrdinal cycles, so ` +
          `“${domainItems[rangeItems.length]}” reuses ${rangeItems[0]}. For colours, fold extra categories into “Other”.`
        : null;
    return { scale, warning, code: `d3.scaleOrdinal().domain([${quote(domainItems)}]).range([${quote(colours)}])` };
  }

  // segments: scaleQuantize (domain = [min, max]) or scaleThreshold (domain = the cut-offs)
  const domain = numbers(domainItems);
  if (!allFinite(domain) || domain.length < 1) return { error: 'Domain: numbers separated by commas' };
  if (rangeItems.length < 1) return { error: 'Range: one or more values, e.g. N, P, C, D, HD' };
  if (type.id === 'quantize') {
    if (domain.length !== 2 || domain[0] === domain[1]) return { error: 'Domain: two different numbers, e.g. 0, 100' };
    const scale = d3.scaleQuantize().domain(domain).range(rangeItems);
    if (nice) scale.nice();
    return { scale, code: `d3.scaleQuantize().domain([${domain.join(', ')}]).range([${quote(rangeItems)}])${nice ? '.nice()' : ''}` };
  }
  if (domain.some((d, i) => i > 0 && d <= domain[i - 1])) return { error: 'Domain: thresholds must be in ascending order' };
  const scale = d3.scaleThreshold().domain(domain).range(rangeItems);
  const warning =
    rangeItems.length !== domain.length + 1
      ? `${domain.length} thresholds make ${domain.length + 1} segments, so the range needs ${domain.length + 1} values (it has ${rangeItems.length}).`
      : null;
  return { scale, warning, code: `d3.scaleThreshold().domain([${domain.join(', ')}]).range([${quote(rangeItems)}])` };
}

/** A sensible starting input for the marker. */
export function defaultInput(type, scale) {
  if (type.kind === 'band' || type.kind === 'ordinal') return scale.domain()[Math.min(2, scale.domain().length - 1)];
  if (type.id === 'threshold') return scale.domain()[Math.floor(scale.domain().length / 2)] + 2;
  const [d0, d1] = scale.domain();
  if (type.id === 'time') return new Date(+d0 + (d1 - d0) * 0.4);
  // The "middle" of a log scale is the geometric mean – negative for an all-negative domain such as [-10000, -1].
  if (type.id === 'log') return Math.sign(d0) * Math.sqrt(d0 * d1);
  return +d0 + (d1 - d0) * 0.42;
}
