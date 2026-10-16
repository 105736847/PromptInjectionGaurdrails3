import { useState } from 'react';
import { Quote } from 'lucide-react';
import styles from './Quotes.module.css';

/**
 * Quotations: <blockquote> inside <figure> with a <figcaption>.
 *
 * - <blockquote cite="URL"> – a long quotation; `cite` holds the source URL
 *   (machine-readable, not shown on screen).
 * - <figcaption> – the visible attribution; <cite> marks the TITLE of the work.
 * - A "pull-quote" repeats a line from the article to catch the eye; it is
 *   decoration, so we hide it from screen readers with aria-hidden.
 */
const testimonials = [
  {
    text: 'Breaking the page into small components made our group work so much easier – everyone owned a folder and we stopped overwriting each other’s code.',
    author: 'Mia Tran',
    source: 'Student stories 2025',
    url: 'https://example.edu.au/stories/mia',
  },
  {
    text: 'The moment it clicked was realising the UI is just a function of state. Change the data, and React redraws the screen for you.',
    author: 'Arjun Mehta',
    source: 'Front-end reflections',
    url: 'https://example.edu.au/stories/arjun',
  },
  {
    text: 'Write the API contract first. Once the JSON shape was agreed, the front-end and back-end halves of our team could work in parallel.',
    author: 'Dr. Lena Fischer, tutor',
    source: 'Project workshop notes',
    url: 'https://example.edu.au/stories/lena',
  },
];

export default function Quotes() {
  const [index, setIndex] = useState(0);
  const quote = testimonials[index];

  return (
    <div className="grid-2">
      <div className="stack">
        <figure className={styles.figure}>
          <Quote className={styles.icon} size={28} aria-hidden="true" />
          <blockquote cite={quote.url} className={styles.blockquote}>
            <p>{quote.text}</p>
          </blockquote>
          <figcaption className={styles.caption}>
            — {quote.author}, <cite>{quote.source}</cite>
          </figcaption>
        </figure>
        <div className="row">
          {/* % (modulo) wraps around to the first quote after the last one */}
          <button type="button" className="btn btn-sm" onClick={() => setIndex((index + 1) % testimonials.length)}>
            Next quote
          </button>
          <span className="subtle small">
            {index + 1} / {testimonials.length}
          </span>
        </div>
      </div>

      <article className={styles.article}>
        <h4>How our team shipped Assignment 3</h4>
        <p>
          We started with a one-page plan and a shared Figma board. The first week went into agreeing on the
          endpoints the FastAPI server would expose.
        </p>
        {/* Pull-quote: decorative repetition of the text below → aria-hidden */}
        <p className={styles.pull} aria-hidden="true">
          “The UI is just a function of state.”
        </p>
        <p>
          The biggest lesson? The UI is just a function of state. Once we stored the prediction result in
          state, the chart, the table and the summary all updated together.
        </p>
      </article>
    </div>
  );
}
