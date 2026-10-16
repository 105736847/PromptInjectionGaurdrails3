/**
 * ScalesExplorer – a playground for d3-scale.
 *
 * A scale is just a FUNCTION: it maps an input DOMAIN (your data values) to an
 * output RANGE (pixels, colours, labels…). Every chart uses at least two.
 * Pick a type, edit the domain and range (press Enter to apply), toggle
 * .nice() / .clamp(), then drag the markers – the top one calls scale(x),
 * the bottom one calls scale.invert(y).
 *
 * Pattern: D3 calculates, React renders.
 * The drawing itself is in ScaleDiagram.jsx.
 */
import { useId, useMemo, useState } from 'react';
import useElementSize from '../../../hooks/useElementSize.js';
import ScaleDiagram from './ScaleDiagram.jsx';
import { SCALE_TYPES, buildScale, defaultInput, formatNumber, formatDay } from './helpers/scaleSpecs.js';

const list = (values, format) => `[${values.map(format).join(', ')}]`;

export default function ScalesExplorer() {
  const id = useId();
  const [typeId, setTypeId] = useState('linear');
  const type = SCALE_TYPES.find((t) => t.id === typeId);
  const [texts, setTexts] = useState({ domain: type.domain, range: type.range }); // applied – always valid
  const [drafts, setDrafts] = useState(texts); // what is typed in the inputs right now
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({ exponent: 2, nice: false, clamp: false, padding: 0.2 });
  const [pickedInput, setPickedInput] = useState(null); // null = a sensible default
  const [sizeRef, { width }] = useElementSize();

  // Derived during render: rebuild the scale whenever its settings change.
  const { scale, code, warning } = useMemo(
    () => buildScale(type, { domainText: texts.domain, rangeText: texts.range, ...options }),
    [type, texts, options],
  );

  // The marker's value – fall back to the default if it no longer fits this scale.
  const isCategorical = type.kind === 'band' || type.kind === 'ordinal';
  const input =
    pickedInput === null || (isCategorical && !scale.domain().includes(pickedInput)) ? defaultInput(type, scale) : pickedInput;

  function changeType(nextId) {
    const next = SCALE_TYPES.find((t) => t.id === nextId);
    setTypeId(nextId);
    setTexts({ domain: next.domain, range: next.range });
    setDrafts({ domain: next.domain, range: next.range });
    setPickedInput(null);
    setError(null);
  }

  // Apply a text field only if it produces a valid scale; otherwise show why not.
  function apply(field) {
    if (drafts[field] === texts[field]) {
      setError(null); // unchanged (e.g. just tabbing through) – keep the marker where it is
      return;
    }
    const next = { ...texts, [field]: drafts[field] };
    const result = buildScale(type, { domainText: next.domain, rangeText: next.range, ...options });
    setError(result.error ?? null);
    if (result.error) return;
    setTexts(next);
    if (field === 'domain') setPickedInput(null); // the old marker value may lie outside the new domain
  }

  const setOption = (key, value) => setOptions((o) => ({ ...o, [key]: value }));
  const fmtIn = type.id === 'time' ? formatDay : formatNumber;
  const q = (v) => `'${v}'`;

  // What the scale says about the current input, written as code.
  let readout;
  if (type.kind === 'continuous') {
    const out = scale(input);
    readout = [
      `x(${fmtIn(input)}) → ${formatNumber(out)}`,
      `x.invert(${formatNumber(out)}) → ${fmtIn(scale.invert(out))}`,
      `x.domain() → ${list(scale.domain(), fmtIn)}${options.nice ? '   // after .nice()' : ''}`,
      type.id === 'log'
        ? `x.ticks(3) → ${list(scale.ticks(3), formatNumber)}   // powers of ten`
        : `x.ticks(5) → ${list(scale.ticks(5), scale.tickFormat(5))}`,
    ];
  } else if (type.kind === 'band') {
    readout = [
      `x(${q(input)}) → ${formatNumber(scale(input))}`,
      `x.bandwidth() → ${formatNumber(scale.bandwidth())}   x.step() → ${formatNumber(scale.step())}`,
      'x.invert → undefined   // band & point scales have no invert()',
    ];
  } else if (type.kind === 'ordinal') {
    readout = [`x(${q(input)}) → ${q(scale(input))}`, `x.domain() → ${list(scale.domain(), q)}`];
  } else {
    const out = scale(input);
    const extent = scale.invertExtent(out).map((v) => (v === undefined ? 'undefined' : formatNumber(v)));
    readout = [`x(${formatNumber(input)}) → ${q(out)}`, `x.invertExtent(${q(out)}) → [${extent.join(', ')}]`];
    if (type.id === 'quantize') readout.push(`x.thresholds() → ${list(scale.thresholds(), formatNumber)}`);
  }

  return (
    <div className="stack">
      <div className="viz-controls d3-basics-scale-controls">
        <div className="field">
          <label className="label" htmlFor={`${id}-type`}>Scale type</label>
          <select id={`${id}-type`} className="input mono" value={typeId} onChange={(e) => changeType(e.target.value)}>
            {SCALE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>d3.{t.fn}</option>
            ))}
          </select>
        </div>
        {['domain', 'range'].map((field) => (
          <div className="field" key={field}>
            <label className="label" htmlFor={`${id}-${field}`}>{field === 'domain' ? 'Domain (input)' : 'Range (output)'}</label>
            <input id={`${id}-${field}`} className="input mono" value={drafts[field]} aria-invalid={Boolean(error)}
              aria-describedby={`${id}-help`}
              onChange={(e) => setDrafts({ ...drafts, [field]: e.target.value })}
              onBlur={() => apply(field)}
              onKeyDown={(e) => e.key === 'Enter' && apply(field)} />
          </div>
        ))}
        {type.id === 'pow' && (
          <div className="field">
            <label className="label" htmlFor={`${id}-exp`}>.exponent({options.exponent})</label>
            <input id={`${id}-exp`} type="range" min="0.1" max="4" step="0.1" value={options.exponent}
              onChange={(e) => setOption('exponent', Number(e.target.value))} />
          </div>
        )}
        {type.kind === 'band' && (
          <div className="field">
            <label className="label" htmlFor={`${id}-pad`}>.padding({options.padding})</label>
            <input id={`${id}-pad`} type="range" min="0" max="0.9" step="0.05" value={options.padding}
              onChange={(e) => setOption('padding', Number(e.target.value))} />
          </div>
        )}
        {(type.kind === 'continuous' || type.id === 'quantize') && (
          <div className="stack-sm d3-basics-switches">
            <label className="switch">
              <input type="checkbox" checked={options.nice} onChange={(e) => setOption('nice', e.target.checked)} />
              <span className="switch-track" /> <code>.nice()</code>
            </label>
            {type.kind === 'continuous' && (
              <label className="switch">
                <input type="checkbox" checked={options.clamp} onChange={(e) => setOption('clamp', e.target.checked)} />
                <span className="switch-track" /> <code>.clamp(true)</code>
              </label>
            )}
          </div>
        )}
      </div>

      <p className="hint" id={`${id}-help`}>
        {error ? <span className="error-text">{error}</span> : <>{type.blurb} Values are comma-separated; press Enter to apply.</>}
      </p>
      {warning && <p className="alert alert-warning small m-0">{warning}</p>}

      <div ref={sizeRef} className="viz d3-basics-scale-stage">
        <div className="d3-basics-ruler-label">Domain · input</div>
        {width > 0 && <ScaleDiagram type={type} scale={scale} input={input} onInput={setPickedInput} width={width} />}
        <div className="d3-basics-ruler-label">Range · output</div>
      </div>

      <pre className="demo-output">{[`const x = ${code};`, '', ...readout].join('\n')}</pre>
    </div>
  );
}
