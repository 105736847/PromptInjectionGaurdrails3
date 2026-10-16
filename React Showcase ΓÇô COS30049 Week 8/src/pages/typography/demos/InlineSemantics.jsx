import styles from './InlineSemantics.module.css';

/**
 * Inline text semantics – each tag MEANS something, it is not just a style.
 *
 * Browsers, search engines and screen readers use this meaning. For example
 * <strong> is "important", while <b> is only "bold". The gallery is plain
 * data rendered with map(); each item stores a small piece of JSX.
 */
const examples = [
  { tag: 'strong', meaning: 'Strong importance', demo: <>Submit <strong>before 11:59 pm</strong> Friday.</> },
  { tag: 'em', meaning: 'Stress emphasis', demo: <>I <em>said</em> the report, not the code.</> },
  { tag: 'mark', meaning: 'Highlighted / relevant', demo: <>Search: the <mark>useState</mark> hook</> },
  { tag: 'small', meaning: 'Side comments, fine print', demo: <>$1,200 <small>(incl. GST)</small></> },
  { tag: 'del / ins', meaning: 'Removed / inserted text', demo: <>Due <del>Week 10</del> <ins>Week 11</ins></> },
  { tag: 'sub / sup', meaning: 'Subscript / superscript', demo: <>H<sub>2</sub>O and E = mc<sup>2</sup></> },
  { tag: 'abbr', meaning: 'Abbreviation (hover it)', demo: <><abbr title="Single-Page Application">SPA</abbr> vs <abbr title="Multi-Page Application">MPA</abbr></> },
  { tag: 'code', meaning: 'A fragment of code', demo: <>Call <code>setCount(count + 1)</code></> },
  { tag: 'kbd', meaning: 'Keyboard input', demo: <>Press <kbd>Ctrl</kbd> + <kbd>C</kbd> to stop the server</> },
  { tag: 'samp', meaning: 'Sample program output', demo: <>Terminal: <samp>VITE ready in 312 ms</samp></> },
  { tag: 'var', meaning: 'Variable (maths / code)', demo: <>Area = <var>w</var> × <var>h</var></> },
  { tag: 'q', meaning: 'Short inline quotation', demo: <>The tutor said <q>commit early, commit often</q>.</> },
  { tag: 'cite', meaning: 'Title of a work', demo: <>Read <cite>Thinking in React</cite> on react.dev</> },
  { tag: 'dfn', meaning: 'Term being defined', demo: <>A <dfn>prop</dfn> is an input passed to a component.</> },
  { tag: 'time', meaning: 'Machine-readable date', demo: <>Demo day: <time dateTime="2026-10-23T14:30">23 Oct, 2:30 pm</time></> },
  { tag: 'br', meaning: 'Line break (addresses, poems)', demo: <>Building A, Level 3<br />1 Example Street<br />Hawthorn VIC 3122</> },
  { tag: 'wbr', meaning: 'Optional break point', demo: <span className={styles.narrow}>super<wbr />cali<wbr />fragilistic<wbr />expialidocious</span> },
  { tag: 'b / i / u / s', meaning: 'Styling only, no extra meaning', demo: <><b>bold</b>, <i>italic</i>, <u>underline</u>, <s>strike</s></> },
];

export default function InlineSemantics() {
  return (
    <ul className={styles.grid}>
      {examples.map(({ tag, meaning, demo }) => (
        <li key={tag} className={styles.item}>
          <div className="row-between">
            <span className="badge badge-code">&lt;{tag}&gt;</span>
            <span className="subtle small">{meaning}</span>
          </div>
          <p className={styles.sample}>{demo}</p>
        </li>
      ))}
    </ul>
  );
}
