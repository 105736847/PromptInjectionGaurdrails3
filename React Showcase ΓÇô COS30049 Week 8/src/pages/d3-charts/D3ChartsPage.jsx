import { Link } from 'react-router-dom';

import PageHeader from '../../components/common/PageHeader.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';

import FocusContext from './demos/FocusContext.jsx';
import focusContextCode from './demos/FocusContext.jsx?raw';
import ManyLines from './demos/ManyLines.jsx';
import manyLinesCode from './demos/ManyLines.jsx?raw';
import BarChartRace from './demos/BarChartRace.jsx';
import barChartRaceCode from './demos/BarChartRace.jsx?raw';
import StreamGraph from './demos/StreamGraph.jsx';
import streamGraphCode from './demos/StreamGraph.jsx?raw';
import ScatterExplorer from './demos/ScatterExplorer.jsx';
import scatterExplorerCode from './demos/ScatterExplorer.jsx?raw';
import scatterPlotCode from './demos/ScatterPlot.jsx?raw';
import HistogramBins from './demos/HistogramBins.jsx';
import histogramBinsCode from './demos/HistogramBins.jsx?raw';
import Beeswarm from './demos/Beeswarm.jsx';
import beeswarmCode from './demos/Beeswarm.jsx?raw';
import CalendarHeatmap from './demos/CalendarHeatmap.jsx';
import calendarHeatmapCode from './demos/CalendarHeatmap.jsx?raw';
import RadialHours from './demos/RadialHours.jsx';
import radialHoursCode from './demos/RadialHours.jsx?raw';
import CrossFilterDashboard from './demos/CrossFilterDashboard.jsx';
import crossFilterDashboardCode from './demos/CrossFilterDashboard.jsx?raw';
import majorBarsCode from './demos/MajorBars.jsx?raw';
import weeklyTrendCode from './demos/WeeklyTrend.jsx?raw';

import chartKitCode from './demos/helpers/chartKit.js?raw';
import chartTooltipCode from './demos/helpers/ChartTooltip.jsx?raw';
import dataTableCode from './demos/helpers/DataTable.jsx?raw';
import useTweenedNumberCode from './demos/helpers/useTweenedNumber.js?raw';
import onPointerDownOutsideCode from './demos/helpers/onPointerDownOutside.js?raw';
import swarmLabelsCode from './demos/helpers/swarmLabels.js?raw';
import learnersCode from './demos/data/learners.js?raw';
import submissionsCode from './demos/data/submissions.js?raw';
import enrolmentsCode from './demos/data/enrolments.js?raw';
import activitiesCode from './demos/data/activities.js?raw';
import cohortCode from './demos/data/cohort.js?raw';
import examScoresCode from './demos/data/examScores.js?raw';
import studyLogCode from './demos/data/studyLog.js?raw';
import studyHoursCode from './demos/data/studyHours.js?raw';
import './d3-charts.css';

export default function D3ChartsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Data Visualization (D3)"
        title="Interactive Charts"
        intro="Ten charts that zoom, brush, race, morph and filter each other. Every one uses a real D3 behaviour – d3.zoom, d3.brush, transitions, d3.forceSimulation, d3.Delaunay – inside an ordinary React component, and every Code tab starts by saying which React + D3 pattern it follows."
        concepts={['d3.zoom', 'd3.brush', 'transition()', 'join() + key', 'd3.stack', 'd3.bin', 'd3.forceSimulation', 'd3.Delaunay', 'd3.arc', 'linked views']}
        docs={[
          { label: 'd3-zoom', href: 'https://d3js.org/d3-zoom' },
          { label: 'd3-brush', href: 'https://d3js.org/d3-brush' },
          { label: 'd3-transition', href: 'https://d3js.org/d3-transition' },
          { label: 'D3 gallery (Observable)', href: 'https://observablehq.com/@d3/gallery' },
          { label: 'Synchronizing with Effects', href: 'https://react.dev/learn/synchronizing-with-effects' },
        ]}
      />

      <Callout type="note" title="Two ways to combine React and D3">
        <p>
          <strong>D3 calculates, React renders</strong>: use D3 for the maths (scales, shapes, bins) and return the SVG as
          JSX. <strong>D3 owns the &lt;g&gt;</strong>: React renders an empty group, and an effect lets D3 fill it with{' '}
          <code>selection.join()</code>, transitions and behaviours such as zoom or brush. Every chart on this page uses
          the second pattern, because zoom, brush, forces and interrupted transitions need D3 to own the elements. The
          first pattern still shows up in small pieces: the radial chart&apos;s centre label and the scatter plot&apos;s
          size key are plain JSX. New to D3? <Link to="/d3-basics">D3 Fundamentals</Link> teaches the first pattern
          in depth.
        </p>
      </Callout>

      <SectionTitle
        title="Zoom, pan & brush"
        intro="Long time series need a way in. Let people zoom to the part they care about – and always show them where they are."
      />
      <DemoCard
        title="Focus + context: two years of daily active learners"
        description="Drag the big chart to pan, Ctrl/⌘ + scroll to zoom (or pinch), or drag the window in the overview below – the two stay in sync. Exam periods are shaded bands; the crosshair snaps to the nearest day."
        concepts={['Pattern: D3 owns the <g>', 'd3.zoom', 'd3.brushX', 'transform.rescaleX', 'd3.bisector', 'clipPath']}
        files={[
          { name: 'FocusContext.jsx', code: focusContextCode },
          { name: 'data/learners.js', code: learnersCode },
          { name: 'helpers/chartKit.js', code: chartKitCode },
          { name: 'helpers/ChartTooltip.jsx', code: chartTooltipCode },
          { name: 'helpers/onPointerDownOutside.js', code: onPointerDownOutsideCode },
          { name: 'helpers/DataTable.jsx', code: dataTableCode },
        ]}
      >
        <FocusContext />
      </DemoCard>

      <DemoCard
        title="Many lines, one story: weekly submissions per unit"
        description="Seven lines are spaghetti until you point at one: the nearest line lights up and the others fade to grey. Legend buttons hide units without repainting the rest; end labels push each other apart so they never overlap."
        concepts={['Pattern: D3 owns the <g>', 'join() with a key', 'hover-to-emphasise', 'label relaxation', 'one effect per job']}
        files={[
          { name: 'ManyLines.jsx', code: manyLinesCode },
          { name: 'data/submissions.js', code: submissionsCode },
        ]}
      >
        <ManyLines />
      </DemoCard>

      <Callout type="warning" title="StrictMode runs every effect twice – clean up after D3">
        <p>
          In development React mounts, unmounts and re-mounts each component once. An effect that calls{' '}
          <code>svg.append('path')</code> would draw everything twice, and a zoom listener that is never removed keeps
          firing on a stale chart. Use <code>selection.join()</code> (safe to repeat), and return a cleanup that undoes
          what the effect started: <code>.on('.zoom', null)</code>, <code>.on('.brush', null)</code>,{' '}
          <code>simulation.stop()</code>, <code>timer.stop()</code>, <code>selection.interrupt()</code>.
        </p>
      </Callout>

      <SectionTitle
        title="Animated transitions"
        intro="A transition is not decoration: it lets the eye follow each item from the old picture to the new one. The trick is to give every item a stable identity – the key function."
      />
      <DemoCard
        title="Animated ranking: a bar chart race"
        description="Press Play to watch enrolments per degree from 2016 to 2026, or scrub the year slider. Bars slide to their new rank, the numbers count up and every degree keeps its colour."
        concepts={['Pattern: D3 owns the <g>', 'clock in React state', 'keyed join', 'object constancy', 'textTween', 'd3.interpolateNumber', 'setInterval cleanup']}
        files={[
          { name: 'BarChartRace.jsx', code: barChartRaceCode },
          { name: 'data/enrolments.js', code: enrolmentsCode },
          { name: 'helpers/chartKit.js', code: chartKitCode },
        ]}
      >
        <BarChartRace />
      </DemoCard>

      <DemoCard
        title="Stacked area ↔ 100% ↔ streamgraph"
        description="How does an average student spend their week? Switch the layout and the order: the same d3.stack() data morphs between three shapes. Click the legend to hide an activity – its layer shrinks away."
        concepts={['Pattern: D3 owns the <g>', 'd3.stack', 'stackOffsetExpand', 'stackOffsetWiggle', 'stackOrderInsideOut', 'path morphing']}
        files={[
          { name: 'StreamGraph.jsx', code: streamGraphCode },
          { name: 'data/activities.js', code: activitiesCode },
        ]}
      >
        <StreamGraph />
      </DemoCard>

      <Callout type="tip" title="Object constancy: the key function does the heavy lifting">
        <p>
          <code>.data(rows, (d) =&gt; d.name)</code> tells D3 which DOM element belongs to which row. Without the key,
          D3 matches by position: row 1 keeps the name and colour it was created with, but shows whichever
          degree is now ranked first – the rows never move and the chart lies. It is exactly the same idea as
          React&apos;s <code>key</code> prop on list items.
        </p>
      </Callout>

      <SectionTitle
        title="Relationships & distributions"
        intro="Hundreds of students at once: how two measures relate, how scores are spread, and where each individual sits."
      />
      <DemoCard
        title="Scatter plot with zoom, brush & nearest-point hover"
        description="400 students: study hours against final score, sized by attendance, coloured by campus. Hover anywhere – the nearest student is found for you. Switch to Brush select and drag a box – or press a Quick select button – to list those students in the linked table."
        concepts={['Pattern: D3 owns the <g>', 'd3.Delaunay.find', 'd3.zoom (x + y)', 'd3.brush', 'lifting state up', 'least squares']}
        files={[
          { name: 'ScatterExplorer.jsx', code: scatterExplorerCode },
          { name: 'ScatterPlot.jsx', code: scatterPlotCode },
          { name: 'data/cohort.js', code: cohortCode },
          { name: 'helpers/chartKit.js', code: chartKitCode },
          { name: 'helpers/onPointerDownOutside.js', code: onPointerDownOutsideCode },
          { name: 'helpers/DataTable.jsx', code: dataTableCode },
        ]}
      >
        <ScatterExplorer />
      </DemoCard>

      <DemoCard
        title="Histogram with adjustable bins + density curve"
        description="600 exam scores with two humps. Too few bins hide them, too many turn the chart into noise – drag the slider or pick a classic rule. The smooth density curve (KDE) and the mean/median rules share the same axis."
        concepts={['Pattern: D3 owns the <g>', 'd3.bin in useMemo', 'd3.thresholdSturges', 'kernel density', 'mean vs median']}
        files={[
          { name: 'HistogramBins.jsx', code: histogramBinsCode },
          { name: 'data/examScores.js', code: examScoresCode },
        ]}
      >
        <HistogramBins />
      </DemoCard>

      <DemoCard
        title="Beeswarm: every dot is a student"
        description="A force simulation packs 200 students along the score axis without overlaps. Regroup them by major or year and watch the dots flow to their new rows; type a name to find someone."
        concepts={['Pattern: D3 owns the <g>', 'd3.forceSimulation', 'forceX / forceY', 'forceCollide', 'alpha re-heat', 'simulation.find']}
        files={[
          { name: 'Beeswarm.jsx', code: beeswarmCode },
          { name: 'helpers/swarmLabels.js', code: swarmLabelsCode },
          { name: 'data/cohort.js', code: cohortCode },
          { name: 'helpers/DataTable.jsx', code: dataTableCode },
        ]}
      >
        <Beeswarm />
      </DemoCard>

      <Callout type="tip" title="Make the hit target bigger than the mark">
        <p>
          Nobody can reliably hover a 5-pixel dot. The scatter plot builds a Delaunay triangulation once and asks{' '}
          <code>delaunay.find(x, y)</code> for the nearest student; the beeswarm asks <code>simulation.find(x, y, 20)</code>;
          the histogram and line charts only need the pointer&apos;s x. And every chart also comes with a data table
          (sometimes summarised, e.g. per month) or keyboard-focusable cells, so hovering is never the only way in.
        </p>
      </Callout>

      <SectionTitle
        title="Patterns in time: heatmaps"
        intro="When the question is “when?”, lay time out as a grid – days × weeks, or hours × days around a clock – and let one colour ramp show the amount."
      />
      <DemoCard
        title="Calendar heatmap: a year of study minutes"
        description="GitHub-style: one square per day, a stronger blue = more minutes. Switch the year and the colours sweep across the calendar. Tab into the grid and use the arrow keys to read any day."
        concepts={['Pattern: D3 owns the <g>', 'd3.utcMonday.count', 'd3.scaleThreshold', 'useChartTheme', 'staggered delay', 'roving tabindex']}
        files={[
          { name: 'CalendarHeatmap.jsx', code: calendarHeatmapCode },
          { name: 'data/studyLog.js', code: studyLogCode },
          { name: 'helpers/onPointerDownOutside.js', code: onPointerDownOutsideCode },
        ]}
      >
        <CalendarHeatmap />
      </DemoCard>

      <DemoCard
        title="Radial heatmap: when do students study?"
        description="24 hours around the clock, one ring per day (Monday inside). Switch between the whole week, weekdays and the weekend – the rings grow and shrink into place. Spot the Sunday-night deadline rush?"
        concepts={['Pattern: D3 owns the <g>', 'd3.arc', 'scaleBand (angles)', 'attrTween', 'd3.scaleQuantize', 'CSS variables']}
        files={[
          { name: 'RadialHours.jsx', code: radialHoursCode },
          { name: 'data/studyHours.js', code: studyHoursCode },
        ]}
      >
        <RadialHours />
      </DemoCard>

      <Callout type="note" title="Respect “reduce motion”">
        <p>
          Some people get dizzy from animation and switch it off in their operating system. Every transition on this
          page asks <code>motion(ms)</code> in <code>chartKit.js</code> for its duration, which returns 0 when{' '}
          <code>prefers-reduced-motion</code> is on – the chart still updates, it just doesn&apos;t move.
        </p>
      </Callout>

      <SectionTitle
        title="Linked views"
        intro="A dashboard is several charts that answer questions together. Keep ONE filter state in the parent and derive everything from it."
      />
      <DemoCard
        title="Linked mini-dashboard (cross-filtering)"
        description="Filter by campus, year level or major – or click a bar. The KPI tiles count to their new values, the bars and the line re-draw with transitions, and the chips show (and remove) each active filter."
        concepts={[
          'Pattern: D3 owns the <g>',
          'lifting state up',
          'derived data',
          'props down, events up',
          'useTweenedNumber',
          'refs in D3 handlers',
          'd3.interpolateRound',
        ]}
        files={[
          { name: 'CrossFilterDashboard.jsx', code: crossFilterDashboardCode },
          { name: 'MajorBars.jsx', code: majorBarsCode },
          { name: 'WeeklyTrend.jsx', code: weeklyTrendCode },
          { name: 'helpers/useTweenedNumber.js', code: useTweenedNumberCode },
          { name: 'helpers/DataTable.jsx', code: dataTableCode },
          { name: 'data/cohort.js', code: cohortCode },
        ]}
      >
        <CrossFilterDashboard />
      </DemoCard>

      <Callout type="exercise">
        <ol>
          <li>
            In <code>FocusContext.jsx</code>, add a third preset button “Semester 2, 2024” to <code>PRESETS</code>. Why
            do the brush, the zoom and the “Showing …” text all follow without any extra code?
          </li>
          <li>
            In <code>ManyLines.jsx</code>, change the hover so it only emphasises a line when the pointer is within 20px
            of it (hint: compare <code>Math.abs(y(value) - py)</code> with 20 before calling <code>setEmphasis</code>).
          </li>
          <li>
            Remove the key function from <code>.data(ranked, (d) =&gt; d.name)</code> in <code>BarChartRace.jsx</code> and
            press Play. Describe what goes wrong – then put it back.
          </li>
          <li>
            In <code>ScatterPlot.jsx</code>, draw one trend line per campus instead of one overall line (compute three{' '}
            <code>linearFit</code>s and colour each line with its campus colour).
          </li>
          <li>
            Add a fourth filter “Status” (score ≥ 50 = Passing, otherwise At risk) to <code>CrossFilterDashboard.jsx</code>.
            Which parts only needed a new entry in <code>FILTERS</code>, and which needed real code?
          </li>
        </ol>
      </Callout>
    </>
  );
}
