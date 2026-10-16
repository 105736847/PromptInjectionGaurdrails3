/**
 * DataJoinAlphabet – the data join, visualised.
 * Pattern: D3 owns the <g>.
 *
 * selection.data(array, key) pairs data items with existing DOM elements and
 * sorts them into three groups:
 *   ENTER  – data with no element yet    → create it   (drops in, blue)
 *   UPDATE – data that found its element → update it   (slides to its new place)
 *   EXIT   – elements whose data is gone → remove them (falls away, orange)
 * The KEY function decides what "the same item" means. Switch it off to join
 * by index: letters then change their text in place instead of moving.
 */
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Shuffle, Plus, Minus } from 'lucide-react';
import useElementSize from '../../../hooks/useElementSize.js';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
const rng = d3.randomLcg(26); // seeded → the same "random" sequence after every reload
const shuffle = d3.shuffler(rng);
const randomCount = d3.randomInt.source(rng)(6, 20);
const HEIGHT = 120;
const BASELINE = 72;

function randomSubset() {
  return shuffle(ALPHABET.slice()).slice(0, randomCount()).sort(d3.ascending);
}

export default function DataJoinAlphabet() {
  const [letters, setLetters] = useState(randomSubset);
  const [useKey, setUseKey] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [counts, setCounts] = useState({ enter: 0, update: 0, exit: 0 });
  const [sizeRef, { width }] = useElementSize();
  const gRef = useRef(null);
  const lastJoined = useRef(null); // { letters, node }: which join did we last report counts for?

  useEffect(() => {
    if (width === 0) return undefined;
    const g = d3.select(gRef.current);
    const step = Math.min(34, (width - 16) / ALPHABET.length);
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 750;
    const t = g.transition().duration(duration);
    const key = useKey ? (d) => d : undefined; // no key function = join by index
    const sizes = {};

    g.selectAll('text.d3-basics-letter:not(.is-exit)') // ignore letters that are already leaving
      .data(letters, key)
      .join(
        (enter) => {
          sizes.enter = enter.size();
          return enter
            .append('text')
            .attr('class', 'd3-basics-letter is-enter')
            .attr('x', (d, i) => 8 + i * step)
            .attr('y', BASELINE - 40)
            .style('opacity', 0)
            .text((d) => d)
            .call((e) => e.transition(t).attr('y', BASELINE).style('opacity', 1));
        },
        (update) => {
          sizes.update = update.size();
          return update
            .classed('is-enter', false)
            .text((d) => d) // joined by index, an element may now hold a different letter
            .call((u) => u.transition(t).attr('x', (d, i) => 8 + i * step).attr('y', BASELINE).style('opacity', 1));
        },
        (exit) => {
          sizes.exit = exit.size();
          return exit
            .classed('is-exit', true)
            .call((x) => x.transition(t).attr('y', BASELINE + 40).style('opacity', 0).remove());
        },
      )
      .style('font-size', `${Math.max(15, Math.min(30, step * 1.05))}px`);

    // StrictMode runs this effect twice on mount; only report counts for NEW data – or for a
    // NEW <g> (after the Code tab the <svg> is re-created, so every letter really enters again).
    if (lastJoined.current?.letters !== letters || lastJoined.current?.node !== gRef.current) {
      lastJoined.current = { letters, node: gRef.current };
      setCounts(sizes);
    }

    return () => {
      g.interrupt();
      g.selectAll('text').interrupt();
      g.selectAll('text.is-exit').remove(); // an interrupted exit would never remove itself
    };
  }, [letters, useKey, width]);

  // Auto-play: a new random subset every 2 s. Always clear the timer.
  useEffect(() => {
    if (!autoPlay) return undefined;
    const id = setInterval(() => setLetters(randomSubset()), 2000);
    return () => clearInterval(id);
  }, [autoPlay]);

  function addLetter() {
    const missing = ALPHABET.filter((l) => !letters.includes(l));
    if (missing.length === 0) return;
    const letter = missing[Math.floor(rng() * missing.length)];
    setLetters([...letters, letter].sort(d3.ascending));
  }

  function removeLetter() {
    const index = Math.floor(rng() * letters.length);
    setLetters(letters.filter((_, i) => i !== index));
  }

  return (
    <div className="stack">
      <div className="viz-controls">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setLetters(randomSubset())}>
          <Shuffle size={15} aria-hidden="true" /> Shuffle subset
        </button>
        <button type="button" className="btn btn-sm" onClick={addLetter} disabled={letters.length === 26}>
          <Plus size={15} aria-hidden="true" /> Add letter
        </button>
        <button type="button" className="btn btn-sm" onClick={removeLetter} disabled={letters.length === 0}>
          <Minus size={15} aria-hidden="true" /> Remove letter
        </button>
        <label className="switch">
          <input type="checkbox" checked={autoPlay} onChange={(e) => setAutoPlay(e.target.checked)} />
          <span className="switch-track" /> Auto-play
        </label>
        <label className="switch">
          <input type="checkbox" checked={useKey} onChange={(e) => setUseKey(e.target.checked)} />
          <span className="switch-track" /> Use key function
        </label>
      </div>

      {/* Legend + result of the last join: colour key and count for each group */}
      <ul className="viz-legend d3-basics-join-stats" aria-live="polite" aria-label="Legend and result of the last join">
        {[
          ['enter', 'Enter', 'var(--chart-1)'],
          ['update', 'Update', 'var(--color-text)'],
          ['exit', 'Exit', 'var(--chart-2)'],
        ].map(([id, label, color]) => (
          <li key={id} className="card">
            <span className="viz-swatch" style={{ background: color }} aria-hidden="true" />
            <strong>{counts[id] ?? 0}</strong> {label}
          </li>
        ))}
      </ul>

      <div ref={sizeRef} className="viz d3-basics-join-stage">
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="img" aria-label={`Joined letters: ${letters.join(', ')}`}>
            <g ref={gRef} />
          </svg>
        )}
      </div>

      <pre className="demo-output">
        {`g.selectAll('text')\n  .data(letters${useKey ? ', (d) => d' : ''})   // ${useKey ? 'key: the letter itself' : 'no key → matched by INDEX'}\n`}
        {`  .join(\n    (enter) => …,   // ${counts.enter ?? 0} created\n    (update) => …,  // ${counts.update ?? 0} updated\n    (exit) => …,    // ${counts.exit ?? 0} removed\n  );\n\n`}
        {`letters = [${letters.map((l) => `'${l}'`).join(', ')}]`}
      </pre>
    </div>
  );
}
