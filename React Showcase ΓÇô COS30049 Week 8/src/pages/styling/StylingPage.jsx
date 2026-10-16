import { Link } from 'react-router-dom';

import PageHeader from '../../components/common/PageHeader.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';
import CodeBlock from '../../components/common/CodeBlock.jsx';
import themeContextCode from '../../context/ThemeContext.jsx?raw';

import sliderCode from './demos/Slider.jsx?raw';
import DesignSystemGallery from './demos/DesignSystemGallery.jsx';
import designSystemGalleryCode from './demos/DesignSystemGallery.jsx?raw';
import designSystemGalleryCss from './demos/DesignSystemGallery.css?raw';
import ConditionalClassNames from './demos/ConditionalClassNames.jsx';
import conditionalClassNamesCode from './demos/ConditionalClassNames.jsx?raw';
import conditionalClassNamesCss from './demos/ConditionalClassNames.css?raw';
import InlineStyleDesigner from './demos/InlineStyleDesigner.jsx';
import inlineStyleDesignerCode from './demos/InlineStyleDesigner.jsx?raw';
import CssModuleButton from './demos/CssModuleButton.jsx';
import cssModuleButtonCode from './demos/CssModuleButton.jsx?raw';
import cssModuleButtonCss from './demos/CssModuleButton.module.css?raw';
import ThemeCustomizer from './demos/ThemeCustomizer.jsx';
import themeCustomizerCode from './demos/ThemeCustomizer.jsx?raw';
import themeCustomizerCss from './demos/ThemeCustomizer.css?raw';
import TransitionToggles from './demos/TransitionToggles.jsx';
import transitionTogglesCode from './demos/TransitionToggles.jsx?raw';
import transitionTogglesCss from './demos/TransitionToggles.css?raw';
import KeyframeAnimations from './demos/KeyframeAnimations.jsx';
import keyframeAnimationsCode from './demos/KeyframeAnimations.jsx?raw';
import keyframeAnimationsCss from './demos/KeyframeAnimations.css?raw';
import AnimatedList from './demos/AnimatedList.jsx';
import animatedListCode from './demos/AnimatedList.jsx?raw';
import animatedListCss from './demos/AnimatedList.css?raw';
import CollapseHeight from './demos/CollapseHeight.jsx';
import collapseHeightCode from './demos/CollapseHeight.jsx?raw';
import collapseHeightCss from './demos/CollapseHeight.css?raw';
import PseudoSelectors from './demos/PseudoSelectors.jsx';
import pseudoSelectorsCode from './demos/PseudoSelectors.jsx?raw';
import pseudoSelectorsCss from './demos/PseudoSelectors.css?raw';
import FiltersPlayground from './demos/FiltersPlayground.jsx';
import filtersPlaygroundCode from './demos/FiltersPlayground.jsx?raw';
import filtersPlaygroundCss from './demos/FiltersPlayground.css?raw';
import GlassGradients from './demos/GlassGradients.jsx';
import glassGradientsCode from './demos/GlassGradients.jsx?raw';
import glassGradientsCss from './demos/GlassGradients.css?raw';
import DarkModeTokens from './demos/DarkModeTokens.jsx';
import darkModeTokensCode from './demos/DarkModeTokens.jsx?raw';
import './styling.css';

// A short excerpt of src/index.css, shown next to the dark-mode demo.
const themeTokensCss = `/* Excerpt from src/index.css */
:root {
  --color-bg: #f6f7fb;
  --color-surface: #ffffff;
  --color-text: #1a1f2e;
  --color-primary: #4f46e5;
  /* … */
}

/* Same names, different values – components never change */
[data-theme='dark'] {
  --color-bg: #0f1218;
  --color-surface: #171b24;
  --color-text: #e7eaf2;
  --color-primary: #8b85ff;
  /* … */
}

/* Components only ever use the variables */
.card {
  background: var(--color-surface);
  color: var(--color-text);
}`;

const sameButtonSixWays = `// 1. Plain CSS file (Button.css → .submit-btn { background: #4f46e5; … })
import './Button.css';
<button className="submit-btn">Submit</button>

// 2. CSS Module (Button.module.css → .submit { … }) – class names are scoped
import styles from './Button.module.css';
<button className={styles.submit}>Submit</button>

// 3. Inline style object – great for values that come from state
<button style={{ background: '#4f46e5', color: 'white', padding: '8px 16px' }}>Submit</button>

// 4. CSS-in-JS with Emotion / styled-components (Emotion is already installed – MUI uses it)
import styled from '@emotion/styled';
const SubmitButton = styled.button\`
  background: #4f46e5;
  color: white;
  padding: 8px 16px;
  &:hover { background: #4338ca; }
\`;
<SubmitButton>Submit</SubmitButton>

// 5. Utility classes with Tailwind CSS (needs the Tailwind build plugin)
<button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">Submit</button>

// 6. A component library – MUI, with the sx prop for one-off tweaks
import Button from '@mui/material/Button';
<Button variant="contained" sx={{ px: 2, borderRadius: 2 }}>Submit</Button>`;

const APPROACHES = [
  {
    name: 'Plain CSS + className',
    example: "import './Card.css'",
    pros: ['Full CSS power (:hover, media queries, animations)', 'No extra tools, zero runtime cost'],
    cons: ['Every class is global – names can clash', 'Needs a naming convention (prefixes, BEM)'],
    when: 'Global design system (like index.css) and small apps.',
  },
  {
    name: 'CSS Modules',
    example: "import s from './Card.module.css'",
    pros: ['Class names scoped automatically', 'Still real CSS; built into Vite'],
    cons: ['Dynamic values need CSS variables', 'Sharing styles between files is clunkier'],
    when: 'Component-specific styles in any project – a great default.',
  },
  {
    name: 'Inline styles',
    example: 'style={{ width: `${pct}%` }}',
    pros: ['Values straight from state / props', 'Nothing to name, nothing to import'],
    cons: ['No :hover, media queries, ::before or @keyframes', 'Verbose; beats classes in specificity'],
    when: 'Truly dynamic values: positions, sizes, user-chosen colours.',
  },
  {
    name: 'CSS-in-JS (Emotion, styled-components)',
    example: 'styled.button`…`',
    pros: ['Styles live inside the component file', 'Props can drive any CSS rule'],
    cons: ['Extra library and runtime cost', 'Awkward with React Server Components'],
    when: 'Component libraries; teams that like co-location.',
  },
  {
    name: 'Utility CSS (Tailwind)',
    example: 'className="px-4 py-2 rounded"',
    pros: ['Very fast to build with', 'Consistent spacing/colour scale, tiny CSS output'],
    cons: ['Long className strings', 'A new vocabulary to learn; needs build setup'],
    when: 'Rapid prototyping and product teams – very common in industry.',
  },
  {
    name: 'Component library (MUI sx prop)',
    example: '<Button sx={{ mt: 2 }}>',
    pros: ['Ready-made, accessible components', 'Theming and breakpoints built in'],
    cons: ['Bigger bundle; “looks like Material”', 'Deep overrides can be fiddly'],
    when: 'Dashboards, admin tools, tight deadlines (Assignment 3!).',
  },
];

export default function StylingPage() {
  return (
    <>
      <PageHeader
        eyebrow="UI & Layout"
        title="Styling in React"
        intro="React doesn’t care how you style things – it just gives you className and style. This page compares the main options side by side: global CSS, conditional classes, inline style objects, CSS Modules and CSS variables, then adds motion, selectors, visual effects and a dark mode."
        concepts={['className', 'CSS files', 'style={{…}}', 'CSS Modules', 'CSS variables', 'transitions', '@keyframes', 'pseudo-classes', 'dark mode']}
        docs={[
          { label: 'React: Applying CSS styles', href: 'https://react.dev/reference/react-dom/components/common#applying-css-styles' },
          { label: 'MDN: CSS custom properties', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties' },
          { label: 'MDN: CSS transitions', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transitions/Using_CSS_transitions' },
          { label: 'MDN: Pseudo-classes', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes' },
        ]}
      />

      <SectionTitle
        title="CSS files & className"
        intro="The classic approach: write CSS in a .css file, import it once, and reference the classes with className. In JSX it is className, not class, because class is a reserved word in JavaScript."
      />
      <DemoCard
        title="The app’s own design system"
        description="Every specimen below uses a global class from src/index.css – the same classes all pages of this showcase use. Click a label to copy the className."
        concepts={['global CSS', 'className', 'reusable classes', 'navigator.clipboard']}
        files={[
          { name: 'DesignSystemGallery.jsx', code: designSystemGalleryCode },
          { name: 'DesignSystemGallery.css', code: designSystemGalleryCss },
        ]}
      >
        <DesignSystemGallery />
      </DemoCard>

      <DemoCard
        title="Conditional classNames"
        description="Build the className string from state: with a template literal, or with a tiny cx() helper that drops false values. Change the status, then pick some units."
        concepts={['template literal', 'cx() / clsx', 'is-selected', 'aria-pressed', 'disabled']}
        files={[
          { name: 'ConditionalClassNames.jsx', code: conditionalClassNamesCode },
          { name: 'ConditionalClassNames.css', code: conditionalClassNamesCss },
        ]}
      >
        <ConditionalClassNames />
      </DemoCard>

      <Callout type="note" title="Where does global CSS come from?">
        <p>
          <code>src/main.jsx</code> contains <code>import './index.css'</code>. Vite injects that stylesheet into the
          page, so its classes work in every component. Page-specific files (like <code>ThemeCustomizer.css</code>)
          are imported by the component that needs them – but once loaded they are global too, which is why every
          class on this page starts with <code>styling-</code>.
        </p>
      </Callout>

      <SectionTitle
        title="Inline styles"
        intro="The style prop takes a JavaScript object with camelCase keys. Perfect when a value comes straight from state."
      />
      <DemoCard
        title="Card designer"
        description="Every slider updates state; the style object is rebuilt on each render and shown as JSON. Notice that numbers become pixels – except for unitless properties like opacity."
        concepts={['style={{…}}', 'camelCase', 'number → px', 'derived values', 'input type="color"']}
        files={[
          { name: 'InlineStyleDesigner.jsx', code: inlineStyleDesignerCode },
          { name: 'Slider.jsx', code: sliderCode },
        ]}
      >
        <InlineStyleDesigner />
      </DemoCard>

      <Callout type="warning" title="The limits of inline styles">
        <p>
          Inline styles cannot express <code>:hover</code>, <code>:focus-visible</code>, media queries,{' '}
          <code>::before</code> or <code>@keyframes</code>, and they beat almost every class in specificity, which
          makes them hard to override. Use them for the few values that really come from JavaScript and keep
          everything else in CSS.
        </p>
      </Callout>

      <SectionTitle
        title="Scoped & dynamic CSS"
        intro="Two tools that fix the weaknesses above: CSS Modules solve global name clashes, and CSS custom properties let React pass values into real CSS."
      />
      <DemoCard
        title="CSS Modules"
        description="A file named *.module.css gets unique class names at build time. The styles object printed on the right is the proof – and the global .button button stays unstyled."
        concepts={['*.module.css', 'styles.primary', 'scoped class names', 'composes']}
        files={[
          { name: 'CssModuleButton.jsx', code: cssModuleButtonCode },
          { name: 'CssModuleButton.module.css', code: cssModuleButtonCss },
        ]}
      >
        <CssModuleButton />
      </DemoCard>

      <DemoCard
        title="Theme customiser with CSS variables"
        description="React sets five --variables on one div; everything inside – even the global .btn-primary and .badge-primary classes – restyles itself through var()."
        concepts={["style={{ '--accent': … }}", 'var()', 'calc()', 'color-mix()', 'inheritance']}
        files={[
          { name: 'ThemeCustomizer.jsx', code: themeCustomizerCode },
          { name: 'ThemeCustomizer.css', code: themeCustomizerCss },
        ]}
      >
        <ThemeCustomizer />
      </DemoCard>

      <Callout type="tip" title="Best of both worlds">
        <p>
          Pass dynamic values from React as <code>--custom-properties</code> and keep the actual styling – hover,
          media queries, transitions – in CSS. You get the flexibility of inline styles without losing any CSS
          features.
        </p>
      </Callout>

      <SectionTitle
        title="Transitions & animations"
        intro="React changes classes; CSS does the moving. Transitions animate between two states, @keyframes run multi-step animations, and a couple of tricks handle elements that appear, disappear or change height."
      />
      <DemoCard
        title="Transitions triggered by a class"
        description="One button toggles an is-on class on four elements. Change the duration and the easing curve – they are passed to CSS as variables."
        concepts={['transition', 'transform', 'opacity', 'perspective', 'backface-visibility']}
        files={[
          { name: 'TransitionToggles.jsx', code: transitionTogglesCode },
          { name: 'TransitionToggles.css', code: transitionTogglesCss },
        ]}
      >
        <TransitionToggles />
      </DemoCard>

      <DemoCard
        title="@keyframes animations"
        description="Looping animations you can pause with one class, and a one-off shake that plays when the form is invalid – replayable thanks to onAnimationEnd."
        concepts={['@keyframes', 'animation', 'animation-play-state', 'onAnimationEnd', 'aria-invalid']}
        files={[
          { name: 'KeyframeAnimations.jsx', code: keyframeAnimationsCode },
          { name: 'KeyframeAnimations.css', code: keyframeAnimationsCss },
        ]}
      >
        <KeyframeAnimations />
      </DemoCard>

      <DemoCard
        title="Enter & exit animations for a list"
        description="New tasks slide in. Removed tasks are only flagged at first, play their exit animation, and are deleted from state in onAnimationEnd."
        concepts={['mount animation', 'exit animation', 'onAnimationEnd', 'event.target vs currentTarget', 'useRef counter']}
        files={[
          { name: 'AnimatedList.jsx', code: animatedListCode },
          { name: 'AnimatedList.css', code: animatedListCss },
        ]}
      >
        <AnimatedList />
      </DemoCard>

      <DemoCard
        title="Animating height: the 0fr → 1fr trick"
        description="An accessible FAQ accordion. Turn the switch off to see the naive height: 0 → auto version snap open instead of sliding."
        concepts={['grid-template-rows', '0fr → 1fr', 'aria-expanded', 'aria-controls', 'inert']}
        files={[
          { name: 'CollapseHeight.jsx', code: collapseHeightCode },
          { name: 'CollapseHeight.css', code: collapseHeightCss },
        ]}
      >
        <CollapseHeight />
      </DemoCard>

      <Callout type="note" title="Respect reduced motion">
        <p>
          Some people get dizzy from animation and ask their operating system for less of it. The bottom of{' '}
          <code>index.css</code> uses <code>@media (prefers-reduced-motion: reduce)</code> to switch animations
          off for them. Try it in Chrome DevTools → Rendering → “Emulate CSS media feature prefers-reduced-motion”.
        </p>
      </Callout>

      <SectionTitle
        title="Selectors & visual effects"
        intro="Pseudo-classes and pseudo-elements let CSS respond to state and decorate elements without any JavaScript. Filters, blend modes and gradients add polish."
      />
      <DemoCard
        title="Pseudo-classes & pseudo-elements"
        description="Hover, press and Tab through the examples. Most of them work without a single line of React state."
        concepts={[':hover', ':focus-visible', ':checked + label', ':has()', ':nth-child()', '::before / ::after', '::placeholder']}
        files={[
          { name: 'PseudoSelectors.jsx', code: pseudoSelectorsCode },
          { name: 'PseudoSelectors.css', code: pseudoSelectorsCss },
        ]}
      >
        <PseudoSelectors />
      </DemoCard>

      <DemoCard
        title="CSS filters playground"
        description="Chain filter functions on a photo, or start from a preset. The image shows a loading state, and a fallback if the network fails."
        concepts={['filter', 'blur()', 'hue-rotate()', 'onLoad / onError', 'aspect-ratio']}
        files={[
          { name: 'FiltersPlayground.jsx', code: filtersPlaygroundCode },
          { name: 'FiltersPlayground.css', code: filtersPlaygroundCss },
        ]}
      >
        <FiltersPlayground />
      </DemoCard>

      <DemoCard
        title="Glass, blend modes & gradients"
        description="A frosted-glass card made with backdrop-filter, a word blended into the colours below it, and the four kinds of CSS gradient."
        concepts={['backdrop-filter', 'mix-blend-mode', 'linear-gradient', 'radial-gradient', 'conic-gradient']}
        files={[
          { name: 'GlassGradients.jsx', code: glassGradientsCode },
          { name: 'GlassGradients.css', code: glassGradientsCss },
        ]}
      >
        <GlassGradients />
      </DemoCard>

      <SectionTitle
        title="Dark mode & design tokens"
        intro="This whole app switches theme by changing one attribute on <html>. Every colour is a CSS variable (a “design token”) with a light and a dark value."
      />
      <DemoCard
        title="Theme tokens, live"
        description="Toggle the theme with useTheme(). The table reads each variable’s computed value with getComputedStyle, so you can see the values change."
        concepts={['useTheme()', 'useContext', 'data-theme', 'getComputedStyle', 'MutationObserver']}
        files={[
          { name: 'DarkModeTokens.jsx', code: darkModeTokensCode },
          { name: 'index.css', code: themeTokensCss },
          { name: 'ThemeContext.jsx', code: themeContextCode },
        ]}
      >
        <DarkModeTokens />
      </DemoCard>

      <SectionTitle
        title="Choosing a styling approach"
        intro="There is no single right answer – most real projects mix two or three of these. Here is the same submit button written six ways, followed by a quick comparison."
      />
      <div className="demo-card">
        <CodeBlock code={sameButtonSixWays} filename="SubmitButton.jsx" />
      </div>

      <div className="table-wrap mb-2">
        <table className="table styling-approaches">
          <caption>Styling approaches compared</caption>
          <thead>
            <tr>
              <th scope="col">Approach</th>
              <th scope="col">Pros</th>
              <th scope="col">Cons</th>
              <th scope="col">Use it for</th>
            </tr>
          </thead>
          <tbody>
            {APPROACHES.map((approach) => (
              <tr key={approach.name}>
                <th scope="row">
                  {approach.name}
                  <div><code className="small">{approach.example}</code></div>
                </th>
                <td>
                  <ul>{approach.pros.map((pro) => <li key={pro}>{pro}</li>)}</ul>
                </td>
                <td>
                  <ul>{approach.cons.map((con) => <li key={con}>{con}</li>)}</ul>
                </td>
                <td>{approach.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout type="tip" title="Want to try a component library?">
        <p>
          The <Link to="/mui">Material UI page</Link> shows the last row in action: MUI components, the{' '}
          <code>sx</code> prop, theming and the responsive <code>Grid</code>.
        </p>
      </Callout>

      <Callout type="exercise">
        <ol>
          <li>
            In <code>ConditionalClassNames.jsx</code>, extend <code>cx()</code> so it also accepts an object –{' '}
            <code>{"cx('unit', { 'is-selected': isSelected })"}</code> – just like the real <code>clsx</code> package.
          </li>
          <li>
            In <code>InlineStyleDesigner.jsx</code>, add a <strong>border width</strong> slider and show the style
            object as real CSS text (convert <code>borderRadius</code> → <code>border-radius</code>).
          </li>
          <li>
            In <code>CssModuleButton.module.css</code>, add a <code>.danger</code> variant that uses{' '}
            <code>composes: button</code>, and add it to the variant toggle.
          </li>
          <li>
            In <code>KeyframeAnimations.css</code>, write a <code>wiggle</code> animation and play it on the bell
            only while it is hovered.
          </li>
          <li>
            In <code>ThemeCustomizer.jsx</code>, replace <code>useState</code> with the project’s{' '}
            <code>useLocalStorage</code> hook so the custom theme survives a page refresh.
          </li>
        </ol>
      </Callout>
    </>
  );
}
