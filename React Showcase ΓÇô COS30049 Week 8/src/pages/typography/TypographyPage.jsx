import PageHeader from '../../components/common/PageHeader.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';

import Headings from './demos/Headings.jsx';
import headingsCode from './demos/Headings.jsx?raw';
import InlineSemantics from './demos/InlineSemantics.jsx';
import inlineSemanticsCode from './demos/InlineSemantics.jsx?raw';
import inlineSemanticsCss from './demos/InlineSemantics.module.css?raw';
import Links from './demos/Links.jsx';
import linksCode from './demos/Links.jsx?raw';
import Lists from './demos/Lists.jsx';
import listsCode from './demos/Lists.jsx?raw';
import Quotes from './demos/Quotes.jsx';
import quotesCode from './demos/Quotes.jsx?raw';
import quotesCss from './demos/Quotes.module.css?raw';
import CodeAndWhitespace from './demos/CodeAndWhitespace.jsx';
import codeAndWhitespaceCode from './demos/CodeAndWhitespace.jsx?raw';
import Timetable from './demos/Timetable.jsx';
import timetableCode from './demos/Timetable.jsx?raw';
import timetableCss from './demos/Timetable.module.css?raw';
import Landmarks from './demos/Landmarks.jsx';
import landmarksCode from './demos/Landmarks.jsx?raw';
import landmarksCss from './demos/Landmarks.module.css?raw';
import FaqDetails from './demos/FaqDetails.jsx';
import faqDetailsCode from './demos/FaqDetails.jsx?raw';
import faqDetailsCss from './demos/FaqDetails.module.css?raw';
import ProgressMeter from './demos/ProgressMeter.jsx';
import progressMeterCode from './demos/ProgressMeter.jsx?raw';
import IntlFormatting from './demos/IntlFormatting.jsx';
import intlFormattingCode from './demos/IntlFormatting.jsx?raw';
import SafeText from './demos/SafeText.jsx';
import safeTextCode from './demos/SafeText.jsx?raw';

export default function TypographyPage() {
  return (
    <>
      <PageHeader
        eyebrow="HTML Elements"
        title="Text & Content"
        intro="JSX is HTML-flavoured JavaScript, so every HTML element you already know is available in React. This page is a tour of the elements that structure and describe text – and of the small JSX differences you need to know when using them."
        concepts={['semantic HTML', 'h1–h6', 'inline elements', 'map() + key', 'tables', '<details>', '<progress> / <meter>', 'Intl', 'escaping']}
        docs={[
          { label: 'Writing markup with JSX', href: 'https://react.dev/learn/writing-markup-with-jsx' },
          { label: 'Rendering lists', href: 'https://react.dev/learn/rendering-lists' },
          { label: 'MDN: HTML elements reference', href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element' },
          { label: 'MDN: Intl', href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl' },
        ]}
      />

      <SectionTitle
        title="Headings & text semantics"
        intro="Choose elements for what the content IS, then use CSS for how it LOOKS. Semantic markup is free accessibility and SEO."
      />
      <DemoCard
        title="Headings and paragraphs from data"
        description="Six heading levels and a few paragraphs, all generated with map(). The heading tag itself is chosen at runtime from a variable."
        concepts={['h1–h6', '<p>', 'map()', 'dynamic tag name', 'key']}
        code={headingsCode}
        filename="Headings.jsx"
      >
        <Headings />
      </DemoCard>

      <DemoCard
        title="Inline semantics gallery"
        description="Eighteen inline elements that give meaning to words inside a sentence. Hover the abbreviations to see their title."
        concepts={['<strong>', '<em>', '<mark>', '<abbr title>', '<time dateTime>', '<kbd>', '<code>', 'CSS Modules']}
        files={[
          { name: 'InlineSemantics.jsx', code: inlineSemanticsCode },
          { name: 'InlineSemantics.module.css', code: inlineSemanticsCss },
        ]}
      >
        <InlineSemantics />
      </DemoCard>

      <Callout type="note" title="JSX attribute names">
        <p>
          A few HTML attributes are renamed in JSX because they are reserved words in JavaScript or use
          camelCase: <code>class</code> → <code>className</code>, <code>for</code> → <code>htmlFor</code>,{' '}
          <code>datetime</code> → <code>dateTime</code>, <code>colspan</code> → <code>colSpan</code>,{' '}
          <code>tabindex</code> → <code>tabIndex</code>. Every tag must also be closed: <code>&lt;br /&gt;</code>,{' '}
          <code>&lt;img /&gt;</code>, <code>&lt;input /&gt;</code>.
        </p>
      </Callout>

      <SectionTitle
        title="Links"
        intro="In a single-page app there are two kinds of links: ones that stay inside the app (React Router) and ones that leave it."
      />
      <DemoCard
        title="Internal, external and special links"
        description="Compare <Link> with a plain <a>, then try mailto:, tel:, download and in-page #anchor links."
        concepts={['<Link to>', 'target="_blank"', 'rel="noreferrer"', 'mailto:', 'tel:', 'download', '#anchor', 'scrollIntoView']}
        code={linksCode}
        filename="Links.jsx"
      >
        <Links />
      </DemoCard>

      <SectionTitle
        title="Lists, quotes & code"
        intro="Most lists in a real app come from data – an array of objects from an API – so the pattern is always the same: map() each item to an element with a unique key."
      />
      <DemoCard
        title="Lists generated from data"
        description="Change the start number, numbering type and direction of the ordered list. Nested lists and a glossary (description list) are rendered from arrays too."
        concepts={['<ul>', '<ol start reversed type>', 'nested lists', '<dl> <dt> <dd>', 'key']}
        code={listsCode}
        filename="Lists.jsx"
      >
        <Lists />
      </DemoCard>

      <DemoCard
        title="Quotations and pull-quotes"
        description="A <blockquote> in a <figure> with a caption, cycling through testimonials – next to an article with a decorative pull-quote."
        concepts={['<figure>', '<blockquote cite>', '<figcaption>', '<cite>', 'aria-hidden', 'modulo %']}
        files={[
          { name: 'Quotes.jsx', code: quotesCode },
          { name: 'Quotes.module.css', code: quotesCss },
        ]}
      >
        <Quotes />
      </DemoCard>

      <DemoCard
        title="Code, whitespace and special characters"
        description="How <pre> preserves formatting, where JSX eats your spaces, and three ways to write © in JSX."
        concepts={['<pre>', '<code>', "{' '}", "{'\\n'}", '&copy; &nbsp;', 'emoji role="img"']}
        code={codeAndWhitespaceCode}
        filename="CodeAndWhitespace.jsx"
      >
        <CodeAndWhitespace />
      </DemoCard>

      <SectionTitle
        title="Tables & page structure"
        intro="Tables are for tabular data (never for layout). Landmark elements describe the regions of a whole page."
      />
      <DemoCard
        title="Weekly class timetable"
        description="A fully semantic table generated from an array of sessions. Two-hour classes use rowSpan, the lunch break and total use colSpan, and the footer totals are derived with reduce()."
        concepts={['<caption>', '<thead> <tbody> <tfoot>', '<th scope>', 'rowSpan', 'colSpan', 'derived data']}
        files={[
          { name: 'Timetable.jsx', code: timetableCode },
          { name: 'Timetable.module.css', code: timetableCss },
        ]}
      >
        <Timetable />
      </DemoCard>

      <DemoCard
        title="Semantic page landmarks"
        description="A labelled mock-up of a typical page. Click any tag label to see what the element is for."
        concepts={['<header>', '<nav>', '<main>', '<article>', '<section>', '<aside>', '<footer>', '<address>', '...rest props']}
        files={[
          { name: 'Landmarks.jsx', code: landmarksCode },
          { name: 'Landmarks.module.css', code: landmarksCss },
        ]}
      >
        <Landmarks />
      </DemoCard>

      <SectionTitle
        title="Native interactive elements"
        intro="Before building a custom widget, check whether HTML already has one. These are accessible and keyboard-friendly out of the box."
      />
      <DemoCard
        title="FAQ with <details> and <summary>"
        description="A native disclosure widget. React controls the open state so we can add Expand all / Collapse all, and onToggle keeps state in sync when the user clicks."
        concepts={['<details open>', '<summary>', 'onToggle', 'object state', 'Object.fromEntries']}
        files={[
          { name: 'FaqDetails.jsx', code: faqDetailsCode },
          { name: 'FaqDetails.module.css', code: faqDetailsCss },
        ]}
      >
        <FaqDetails />
      </DemoCard>

      <DemoCard
        title="<progress> and <meter>"
        description="Move the slider: the progress bar shows a task's completion while the two meters colour the same value differently depending on whether high or low is optimum."
        concepts={['<progress>', '<meter low high optimum>', '<output>', 'useId', 'type="range"']}
        code={progressMeterCode}
        filename="ProgressMeter.jsx"
      >
        <ProgressMeter />
      </DemoCard>

      <SectionTitle
        title="Formatting & safety"
        intro="Two things every real app has to get right when it puts text on screen: showing numbers and dates in the user's language, and never running text as code."
      />
      <DemoCard
        title="Formatting with Intl"
        description="Switch the locale to see currency, percentages, compact numbers, dates, relative times, plural categories and lists formatted by the browser."
        concepts={['Intl.NumberFormat', 'Intl.DateTimeFormat', 'Intl.RelativeTimeFormat', 'Intl.PluralRules', 'useMemo', 'lang']}
        code={intlFormattingCode}
        filename="IntlFormatting.jsx"
      >
        <IntlFormatting />
      </DemoCard>

      <DemoCard
        title="React escapes your text"
        description="Type any HTML – including a <script> tag – into the comment box. React renders it as plain text, so nothing can run."
        concepts={['{text} is escaped', 'XSS', 'dangerouslySetInnerHTML']}
        code={safeTextCode}
        filename="SafeText.jsx"
      >
        <SafeText />
      </DemoCard>

      <Callout type="warning" title="dangerouslySetInnerHTML and XSS">
        <p>
          <code>{'<div dangerouslySetInnerHTML={{ __html: html }} />'}</code> skips React’s escaping and inserts
          raw HTML. If <code>html</code> contains anything a user or an API controls, an attacker can run
          JavaScript in your users’ browsers (cross-site scripting, XSS) and steal their session. Render user
          content with <code>{'{text}'}</code>. If you truly must render user-supplied HTML (e.g. rich-text
          comments), sanitise it first with a well-tested library such as DOMPurify.
        </p>
      </Callout>

      <Callout type="exercise">
        <ol>
          <li>
            In <code>Lists.jsx</code>, turn the <code>glossary</code> into a searchable list: add a text input
            and only render the terms whose name or definition contains the search text.
          </li>
          <li>
            In <code>Timetable.jsx</code>, add a Saturday column and a 3-hour session that starts at 13:00.
            Which parts of the code had to change, and which just worked?
          </li>
          <li>
            In <code>FaqDetails.jsx</code>, add a “one at a time” switch: when it is on, opening one answer
            closes all the others.
          </li>
          <li>
            In <code>IntlFormatting.jsx</code>, add a fifth locale (e.g. <code>ar-EG</code> or{' '}
            <code>de-DE</code>) and a row that formats a file size in kilobytes using{' '}
            <code>{"style: 'unit', unit: 'kilobyte'"}</code>.
          </li>
          <li>
            Build a <code>ReadingTime</code> component for <code>Quotes.jsx</code> that counts the words in the
            article and shows “2 min read” using a <code>&lt;time&gt;</code> element.
          </li>
        </ol>
      </Callout>
    </>
  );
}
