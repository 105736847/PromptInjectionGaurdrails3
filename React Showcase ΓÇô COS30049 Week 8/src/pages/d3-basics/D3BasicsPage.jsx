import { GitCompareArrows, Layers, Ruler, Spline, Timer, Palette, Database, Move } from 'lucide-react';

import PageHeader from '../../components/common/PageHeader.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';

import TwoWaysDemo from './demos/TwoWaysDemo.jsx';
import twoWaysCode from './demos/TwoWaysDemo.jsx?raw';
import barsReactCode from './demos/BarsReactRenders.jsx?raw';
import barsD3Code from './demos/BarsD3Owns.jsx?raw';
import unitEnrolmentsCode from './demos/data/unitEnrolments.js?raw';
import barPathCode from './demos/helpers/barPath.js?raw';
import DataJoinAlphabet from './demos/DataJoinAlphabet.jsx';
import dataJoinCode from './demos/DataJoinAlphabet.jsx?raw';
import ScalesExplorer from './demos/ScalesExplorer.jsx';
import scalesExplorerCode from './demos/ScalesExplorer.jsx?raw';
import scaleDiagramCode from './demos/ScaleDiagram.jsx?raw';
import scalePartsCode from './demos/helpers/ScaleParts.jsx?raw';
import scaleSpecsCode from './demos/helpers/scaleSpecs.js?raw';
import AxesPlayground from './demos/AxesPlayground.jsx';
import axesPlaygroundCode from './demos/AxesPlayground.jsx?raw';
import marginDiagramCode from './demos/MarginDiagram.jsx?raw';
import CurvesPlayground from './demos/CurvesPlayground.jsx';
import curvesPlaygroundCode from './demos/CurvesPlayground.jsx?raw';
import EasingRace from './demos/EasingRace.jsx';
import easingRaceCode from './demos/EasingRace.jsx?raw';
import ColourScales from './demos/ColourScales.jsx';
import colourScalesCode from './demos/ColourScales.jsx?raw';
import visionFiltersCode from './demos/helpers/VisionFilters.jsx?raw';
import lmsActivityCode from './demos/data/lmsActivity.js?raw';
import DataShaping from './demos/DataShaping.jsx';
import dataShapingCode from './demos/DataShaping.jsx?raw';
import shapingChartsCode from './demos/ShapingCharts.jsx?raw';
import ResponsiveLine from './demos/ResponsiveLine.jsx';
import responsiveLineCode from './demos/ResponsiveLine.jsx?raw';
import weeklyActiveCode from './demos/data/weeklyActive.js?raw';
import SvgVsCanvas from './demos/SvgVsCanvas.jsx';
import svgVsCanvasCode from './demos/SvgVsCanvas.jsx?raw';
import embeddingPointsCode from './demos/data/embeddingPoints.js?raw';
import frameTimingCode from './demos/helpers/frameTiming.js?raw';
import zoomButtonsCode from './demos/helpers/ZoomButtons.jsx?raw';
import scrollFriendlyZoomCode from './demos/helpers/scrollFriendlyZoom.js?raw';
import './d3-basics.css';

// Every DemoCard's FIRST concept chip names the React + D3 pattern it uses.
const RENDERS = 'Pattern: D3 calculates, React renders';
const OWNS = 'Pattern: D3 owns the <g>';
const MIXED = 'Pattern: mixed';

// The D3 toolkit at a glance – each card jumps to the demo for that module.
const TOOLKIT = [
  { icon: GitCompareArrows, name: 'React + D3', modules: 'two patterns', href: '#two-ways-to-combine-react-and-d3' },
  { icon: Layers, name: 'Selections & joins', modules: 'd3-selection', href: '#the-data-join-visualised' },
  { icon: Ruler, name: 'Scales & axes', modules: 'd3-scale · d3-axis', href: '#scales-explorer' },
  { icon: Spline, name: 'Shapes', modules: 'd3-shape', href: '#shapes-curves' },
  { icon: Timer, name: 'Transitions', modules: 'd3-transition · d3-ease', href: '#transitions-easing' },
  { icon: Palette, name: 'Colour', modules: 'd3-scale-chromatic', href: '#colour-scales-done-right' },
  { icon: Database, name: 'Data', modules: 'd3-fetch · d3-array', href: '#loading-shaping-data' },
  { icon: Move, name: 'Interaction', modules: 'd3-drag · d3-zoom', href: '#svg-or-canvas' },
];

// "Which pattern should I use?" – written once, rendered twice: as a table when there is
// room, and as a list of cards on narrow screens (d3-basics.css switches with @container).
const PATTERN_NAMES = { a: 'A · D3 calculates, React renders', b: 'B · D3 owns the <g>' };
const COMPARISON = [
  {
    question: 'Who creates the SVG elements?',
    a: <>React, with JSX and <code>map()</code></>,
    b: <>D3, with <code>selection.join()</code> inside <code>useEffect</code></>,
  },
  {
    question: 'What D3 is used for',
    a: 'Maths only: scales, shapes, layouts, arrays, formats',
    b: 'Maths and the DOM: selections, axes, transitions, behaviours',
  },
  {
    question: 'Animation',
    a: <>CSS transitions on <code>transform</code>, <code>opacity</code>, <code>d</code> (Safari does not animate <code>d</code>)</>,
    b: <><code>d3-transition</code>: interpolates anything, chains, staggers, interrupts</>,
  },
  {
    question: 'Zoom, brush, drag',
    a: (
      <>
        Attach <code>d3.drag</code> / <code>d3.zoom</code> to an element through a ref and copy the position or
        transform into state (<code>CurvesPlayground.jsx</code>: <code>d3.drag</code> → <code>setPoints</code>), or use plain pointer events
      </>
    ),
    b: <><code>d3.zoom</code>, <code>d3.brush</code>, <code>d3.drag</code> work out of the box</>,
  },
  {
    question: 'React DevTools',
    a: 'Every element is visible',
    b: <>React only sees one empty <code>&lt;g&gt;</code></>,
  },
  {
    question: 'Best for',
    a: 'Static or simply animated charts, dashboards, most of Assignment 3',
    b: 'Rich transitions, zoom/brush/drag, force layouts, porting Observable examples',
  },
];

export default function D3BasicsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Data Visualization (D3)"
        title="D3 Fundamentals"
        intro="D3 is not a chart library – there is no d3.barChart(). It is a toolkit of small modules: selections, scales, shapes, layouts, transitions and interaction behaviours, which you combine into exactly the chart you need. Every demo below is a playground for one of those modules, plus the two ways of using D3 inside React."
        concepts={['selection.join', 'key function', 'scales', 'axes', 'd3.line / d3.area', 'transitions', 'easing', 'colour interpolators', 'd3.csv', 'd3-array', 'd3.drag', 'd3.zoom', 'useRef + useEffect']}
        docs={[
          { label: 'Getting started', href: 'https://d3js.org/getting-started' },
          { label: 'Joining data', href: 'https://d3js.org/d3-selection/joining' },
          { label: 'd3-scale', href: 'https://d3js.org/d3-scale' },
          { label: 'Observable gallery', href: 'https://observablehq.com/@d3/gallery' },
        ]}
      />

      <nav aria-label="D3 modules on this page">
        <ul className="d3-basics-toolkit">
          {TOOLKIT.map(({ icon: Icon, name, modules, href }) => (
            <li key={href}>
              <a className="card card-hover" href={href}>
                <strong><Icon size={17} aria-hidden="true" /> {name}</strong>
                <code>{modules.split(' · ').map((m, i) => <span key={m}>{i > 0 && ' · '}<span className="nowrap">{m}</span></span>)}</code>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <SectionTitle
        title="React + D3: two ways to combine them"
        intro="React and D3 both want to create DOM elements. You have to decide, for every part of a chart, which of the two is in charge – and never let both manage the same element."
      />
      <DemoCard
        title="Two ways to combine React and D3"
        description="The same bar chart, built twice. On the left D3 only does the maths and React renders JSX; on the right React hands an empty <g> to D3, which draws and animates it. Click the buttons and compare the Code tabs."
        concepts={[MIXED, 'd3.scaleBand', 'd3.scaleLinear', 'JSX', 'CSS transitions', 'useRef', 'useEffect', 'selection.join', 'transition']}
        files={[
          { name: 'TwoWaysDemo.jsx', code: twoWaysCode },
          { name: 'BarsReactRenders.jsx', code: barsReactCode },
          { name: 'BarsD3Owns.jsx', code: barsD3Code },
          { name: 'unitEnrolments.js', code: unitEnrolmentsCode },
          { name: 'barPath.js', code: barPathCode },
        ]}
      >
        <TwoWaysDemo />
      </DemoCard>

      <Callout type="note" title="Which pattern should I use?">
        <div className="d3-basics-compare mt-1">
          <div className="table-wrap d3-basics-compare-table">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col"><span className="visually-hidden">Question</span></th>
                  <th scope="col">{PATTERN_NAMES.a}</th>
                  <th scope="col">{PATTERN_NAMES.b}</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.question}>
                    <th scope="row">{row.question}</th>
                    <td>{row.a}</td>
                    <td>{row.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Phone layout: one card per question; each <dt> is paired with its two <dd> answers */}
          <dl className="d3-basics-compare-cards d3-basics-wrap">
            {COMPARISON.map((row) => (
              <div key={row.question} className="card">
                <dt>{row.question}</dt>
                {['a', 'b'].map((pattern) => (
                  <dd key={pattern}>
                    <span className="d3-basics-compare-name">{PATTERN_NAMES[pattern]}</span>
                    {row[pattern]}
                  </dd>
                ))}
              </div>
            ))}
          </dl>
        </div>
        <p className="mt-1">Many real charts mix both: React renders the marks, D3 draws the axes (see “Responsive charts” below).</p>
      </Callout>

      <Callout type="warning" title="StrictMode, effects and cleanup">
        <ul className="d3-basics-wrap">
          <li>
            In development, <code>&lt;StrictMode&gt;</code> mounts, unmounts and re-mounts every component, so each effect
            runs <strong>twice</strong>. A bare <code>g.append(&apos;rect&apos;)</code> in an effect draws two rectangles;{' '}
            {/* <wbr /> = "you may break the line here" – keeps the long chain readable on phones */}
            <code>g.selectAll(&apos;rect&apos;)<wbr />.data(data)<wbr />.join(&apos;rect&apos;)</code> always draws exactly one per item.
          </li>
          <li>
            Always return a cleanup function: <code>selection.interrupt()</code>, <code>simulation.stop()</code>,{' '}
            <code>timer.stop()</code>, <code>d3.select(node).on(&apos;.zoom&apos;, null)</code>, <code>clearInterval()</code>.
          </li>
          <li>
            D3 event handlers are closures – they see the state from the render that created them. Read the latest
            values through a ref (<code>drawRef</code> in <code>SvgVsCanvas.jsx</code>) or re-bind the handlers in the effect.
          </li>
          <li>Create long-lived behaviours (zoom, drag, simulations) once, and only update them when data changes – otherwise the user’s zoom level resets on every render.</li>
        </ul>
      </Callout>

      <SectionTitle
        title="Selections and the data join"
        intro="The heart of D3: pair an array of data with a set of DOM elements, then say what should happen to new, existing and leftover elements."
      />
      <DemoCard
        title="The data join, visualised"
        description="Shuffle, add or remove letters and watch the three groups: entering letters drop in (blue), updating letters slide to their new index, exiting letters fall away (orange). Then switch off the key function and shuffle again."
        concepts={[OWNS, 'selection.data(data, key)', 'join(enter, update, exit)', 'transition', 'setInterval + cleanup']}
        code={dataJoinCode}
        filename="DataJoinAlphabet.jsx"
      >
        <DataJoinAlphabet />
      </DemoCard>
      <Callout type="tip" title="A key function is D3’s version of React’s key prop">
        <p className="d3-basics-wrap">
          Without a key, D3 matches data to elements by <em>position</em>: element 0 gets item 0, and so on – so the
          letters change their text instead of moving. <code>.data(letters, (d) =&gt; d)</code> matches by{' '}
          <em>identity</em>, exactly like <code>&lt;li key={'{'}student.id{'}'}&gt;</code> in React. Use a stable id, never the array index.
        </p>
      </Callout>

      <SectionTitle
        title="Scales and axes"
        intro="A scale is a function from data space (the domain) to screen space (the range). Axes are scales made visible."
      />
      <DemoCard
        title="Scales explorer"
        description="Pick one of ten scale types, edit its domain and range, toggle .nice() and .clamp(), and drag the markers: the top marker calls scale(x), the bottom one calls scale.invert(y). Curves that fan out reveal a non-linear scale."
        concepts={[RENDERS, 'scaleLinear', 'scaleLog', 'scalePow', 'scaleTime', 'scaleBand', 'scalePoint', 'scaleOrdinal', 'scaleQuantize', 'scaleThreshold', 'invert()', 'nice()', 'clamp()', 'd3.linkVertical']}
        files={[
          { name: 'ScalesExplorer.jsx', code: scalesExplorerCode },
          { name: 'ScaleDiagram.jsx', code: scaleDiagramCode },
          { name: 'ScaleParts.jsx', code: scalePartsCode },
          { name: 'scaleSpecs.js', code: scaleSpecsCode },
        ]}
      >
        <ScalesExplorer />
      </DemoCard>

      <DemoCard
        title="Axes & the margin convention"
        description="Every D3 chart starts the same way: an SVG of width × height, and an inner <g> shifted by the margins where the data goes. Change the margins, tick count, format and orientation – the axes animate to their new state, and the code below is rewritten for you."
        concepts={[MIXED, 'margin convention', 'axisBottom / axisLeft', 'ticks()', 'd3.format', 'tickSize / tickPadding', 'transition.call(axis)']}
        files={[
          { name: 'AxesPlayground.jsx', code: axesPlaygroundCode },
          { name: 'MarginDiagram.jsx', code: marginDiagramCode },
        ]}
      >
        <AxesPlayground />
      </DemoCard>

      <SectionTitle
        title="Shapes and motion"
        intro="Shape generators turn arrays into SVG path strings; transitions turn one state into another over time."
      />
      <DemoCard
        title="Shapes & curves"
        description="Drag the eight points (or Tab to one and use the arrow keys). d3.line and d3.area rebuild the path on every move; the curve factory decides how the pen travels between points. The faint polyline shows the raw points."
        concepts={[MIXED, 'd3.line', 'd3.area', 'curve factories', 'd3.drag', 'subject()', 'path data']}
        code={curvesPlaygroundCode}
        filename="CurvesPlayground.jsx"
      >
        <CurvesPlayground />
      </DemoCard>

      <DemoCard
        title="Transitions & easing"
        description="Nine runners, one per easing function, all with the same duration. The tiny plot beside each name is the easing curve. Try Stagger and Chain, and press Interrupt mid-race."
        concepts={[OWNS, 'transition()', 'duration / delay', 'easeVarying', 'chained transitions', 'named transitions', 'interrupt()', 'd3.timer', 'prefers-reduced-motion']}
        code={easingRaceCode}
        filename="EasingRace.jsx"
      >
        <EasingRace />
      </DemoCard>

      <SectionTitle
        title="Colour"
        intro="Colour is the last decision, not the first: first decide what the colour has to say – identity, magnitude or above/below a midpoint."
      />
      <DemoCard
        title="Colour scales done right"
        description="The same heatmap with our validated sequential and diverging tokens, three d3-scale-chromatic schemes, and one rainbow you should never ship. Switch the theme and the vision simulation to see why the tokens exist."
        concepts={[RENDERS, 'scaleSequential', 'scaleDiverging', 'interpolateRgbBasis', 'd3.piecewise', 'd3-scale-chromatic', 'useChartTheme', 'feColorMatrix']}
        files={[
          { name: 'ColourScales.jsx', code: colourScalesCode },
          { name: 'VisionFilters.jsx', code: visionFiltersCode },
          { name: 'lmsActivity.js', code: lmsActivityCode },
        ]}
      >
        <ColourScales />
      </DemoCard>
      <Callout type="note" title="Why the categorical order is fixed">
        <p>
          The eight categorical colours were validated <em>as a sequence</em>: each colour is easy to tell from the one
          before it, also for colour-blind readers. So assign them in order (<code>--chart-1</code>, <code>--chart-2</code>…),
          never cycle past eight (fold the rest into “Other”), and never repaint a series when another one is filtered out –
          colour follows the entity, not its rank. In scatter plots, maps and networks every colour can touch every other,
          so only slots 1–3 are safe there.
        </p>
      </Callout>

      <SectionTitle
        title="Data in, data shaped"
        intro="Real charts start with a file or an API response. d3-fetch loads it and d3-array turns rows into the numbers a chart needs."
      />
      <DemoCard
        title="Loading & shaping data"
        description="A 60-row CSV (public/data/d3-basics/enrolments.csv) is fetched with d3.csv and d3.autoType, then grouped, rolled up and binned live. Change the grouping key, try a wrong file path or a slow network to see the error and loading states."
        concepts={[RENDERS, 'd3.csv', 'd3.autoType', 'AbortController', 'd3.group', 'd3.rollup', 'd3.flatRollup', 'd3.bin', 'd3.extent', 'd3.mean', 'd3.median', 'd3.deviation']}
        files={[
          { name: 'DataShaping.jsx', code: dataShapingCode },
          { name: 'ShapingCharts.jsx', code: shapingChartsCode },
        ]}
      >
        <DataShaping />
      </DemoCard>

      <SectionTitle
        title="Responsiveness and performance"
        intro="A chart has to work on a phone and on a projector, and stay smooth with a lot of data."
      />
      <DemoCard
        title="Responsive charts"
        description="Drag the bottom-right corner of the dashed box (or use the presets). The chart is redrawn for its new width: a coarser month interval, shorter labels and a compact y-axis on narrow screens. Hover or use the arrow keys to read values."
        concepts={[MIXED, 'useElementSize', 'ResizeObserver', 'CSS resize', 'ticks(count)', 'd3.timeMonth.every', 'tickFormat', 'd3.bisector', 'useMemo']}
        files={[
          { name: 'ResponsiveLine.jsx', code: responsiveLineCode },
          { name: 'weeklyActive.js', code: weeklyActiveCode },
        ]}
      >
        <ResponsiveLine />
      </DemoCard>

      <DemoCard
        title="SVG or Canvas?"
        description="The same scatter plot, the same scales and the same d3.zoom – drawn as thousands of <circle> elements or painted onto one <canvas>. Zoom in (Ctrl/⌘ + scroll, pinch or the buttons) with 3,000 points in SVG, then with 50,000 on Canvas, and compare the two timings: the JavaScript in draw(), and the time until the browser has painted the frame."
        concepts={[OWNS, 'd3.zoom', 'zoom.scaleBy', 'zoom.filter', 'zoom.wheelDelta', 'rescaleX / rescaleY', 'Canvas 2D context', 'devicePixelRatio', 'd3.Delaunay', 'performance.now()', 'requestAnimationFrame']}
        files={[
          { name: 'SvgVsCanvas.jsx', code: svgVsCanvasCode },
          { name: 'frameTiming.js', code: frameTimingCode },
          { name: 'ZoomButtons.jsx', code: zoomButtonsCode },
          { name: 'scrollFriendlyZoom.js', code: scrollFriendlyZoomCode },
          { name: 'embeddingPoints.js', code: embeddingPointsCode },
        ]}
      >
        <SvgVsCanvas />
      </DemoCard>
      <Callout type="tip" title="When to switch to Canvas">
        <ul className="d3-basics-wrap">
          <li><strong>SVG</strong> is the default: crisp, styleable with CSS, inspectable, and every mark can have events and ARIA. Comfortable up to one or two thousand marks.</li>
          <li><strong>Canvas</strong> when you draw many thousands of marks, or redraw a lot of them every frame (zooming, animation). You lose per-element events, so hover needs a lookup such as <code>d3.Delaunay</code> or <code>d3.quadtree</code>.</li>
          <li><strong>Hybrid</strong> is common, as in this demo: axes, labels and the hover ring in SVG; the thousands of points on a canvas underneath.</li>
          <li>A canvas is invisible to screen readers – always add a text summary or a data table.</li>
        </ul>
      </Callout>

      <Callout type="exercise">
        <ol className="d3-basics-wrap">
          <li>
            In <code>BarsD3Owns.jsx</code>, give the join an <code>exit</code> function that shrinks a bar to length 0
            before removing it, and add a “Remove a unit” button to <code>TwoWaysDemo.jsx</code>. Why is the same effect
            harder to achieve in <code>BarsReactRenders.jsx</code>?
          </li>
          <li>
            In <code>DataJoinAlphabet.jsx</code>, add a stagger (<code>.delay((d, i) =&gt; i * 40)</code>) to the update
            transition, and make exiting letters also shrink with a <code>font-size</code> transition.
          </li>
          <li>
            Add <code>d3.scaleSymlog</code> to <code>scaleSpecs.js</code> with a domain of <code>-1000, 1000</code>.
            What can it do that <code>scaleLog</code> cannot?
          </li>
          <li>
            In <code>CurvesPlayground.jsx</code>, let a double-click on the chart add a new point (keep the points sorted by
            x) and add <code>d3.curveBundle.beta(0.85)</code> to the curve menu.
          </li>
          <li>
            In <code>DataShaping.jsx</code>, add a second grouping key so the table shows campus × level, using{' '}
            <code>d3.rollup(rows, reducer, (d) =&gt; d.campus, (d) =&gt; d.level)</code> – a nested Map.
          </li>
        </ol>
      </Callout>
    </>
  );
}
