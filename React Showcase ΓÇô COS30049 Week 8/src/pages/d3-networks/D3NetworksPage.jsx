import PageHeader from '../../components/common/PageHeader.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';

import ForceGraph from './demos/ForceGraph.jsx';
import forceGraphCode from './demos/ForceGraph.jsx?raw';
import prerequisitesCode from './demos/data/prerequisites.js?raw';
import AdjacencyMatrix from './demos/AdjacencyMatrix.jsx';
import adjacencyMatrixCode from './demos/AdjacencyMatrix.jsx?raw';
import collaborationCode from './demos/data/collaboration.js?raw';
import HierarchyLayouts from './demos/HierarchyLayouts.jsx';
import hierarchyLayoutsCode from './demos/HierarchyLayouts.jsx?raw';
import assignmentProjectCode from './demos/data/assignmentProject.js?raw';
import CollapsibleTree from './demos/CollapsibleTree.jsx';
import collapsibleTreeCode from './demos/CollapsibleTree.jsx?raw';
import degreeCode from './demos/data/degree.js?raw';
import ProjectTreemap from './demos/ProjectTreemap.jsx';
import projectTreemapCode from './demos/ProjectTreemap.jsx?raw';
import generateProjectTreeCode from './demos/data/generate-project-tree.mjs?raw';
import ZoomableSunburst from './demos/ZoomableSunburst.jsx';
import zoomableSunburstCode from './demos/ZoomableSunburst.jsx?raw';
import enrolmentsCode from './demos/data/enrolments.js?raw';
import ChordDiagram from './demos/ChordDiagram.jsx';
import chordDiagramCode from './demos/ChordDiagram.jsx?raw';
import transfersCode from './demos/data/transfers.js?raw';
import SankeyDiagram from './demos/SankeyDiagram.jsx';
import sankeyDiagramCode from './demos/SankeyDiagram.jsx?raw';
import studentJourneysCode from './demos/data/studentJourneys.js?raw';
import InteractiveGlobe from './demos/InteractiveGlobe.jsx';
import interactiveGlobeCode from './demos/InteractiveGlobe.jsx?raw';
import worldCode from './demos/data/world.js?raw';
import internationalStudentsCode from './demos/data/internationalStudents.js?raw';
import ChoroplethMap from './demos/ChoroplethMap.jsx';
import choroplethMapCode from './demos/ChoroplethMap.jsx?raw';
import chartTooltipCode from './demos/helpers/ChartTooltip.jsx?raw';
import forceGraphDrawCode from './demos/helpers/forceGraphDraw.js?raw';
import forceGraphPartsCode from './demos/helpers/ForceGraphParts.jsx?raw';
import textOnCode from './demos/helpers/textOn.js?raw';
import useTweenCode from './demos/helpers/useTween.js?raw';
import hierarchyLabelsCode from './demos/helpers/hierarchyLabels.js?raw';
import motionCode from './demos/helpers/motion.js?raw';
import scrollFriendlyZoomCode from './demos/helpers/scrollFriendlyZoom.js?raw';
import pageCss from './d3-networks.css?raw';
import './d3-networks.css';

const OWNS = 'Pattern: D3 owns the <g>';
const CALCULATES = 'Pattern: D3 calculates, React renders';
const MIXED = 'Pattern: mixed';

export default function D3NetworksPage() {
  return (
    <>
      <PageHeader
        eyebrow="Data Visualization (D3)"
        title="Networks, Trees & Maps"
        intro="Some data is not a list of numbers but a set of relationships: units that unlock other units, folders inside folders, students moving between majors, countries on a globe. D3’s layout modules turn those structures into positions, angles and paths – and React decides who draws them."
        concepts={['d3-force', 'd3-hierarchy', 'd3-chord', 'd3-sankey', 'd3-geo', 'TopoJSON', 'd3-zoom', 'd3-drag', 'transitions', 'useRef + useEffect']}
        docs={[
          { label: 'd3-force', href: 'https://d3js.org/d3-force' },
          { label: 'd3-hierarchy', href: 'https://d3js.org/d3-hierarchy' },
          { label: 'd3-chord', href: 'https://d3js.org/d3-chord' },
          { label: 'd3-geo', href: 'https://d3js.org/d3-geo' },
          { label: 'd3-sankey', href: 'https://github.com/d3/d3-sankey' },
        ]}
      />

      <Callout type="note" title="Two ways to combine React and D3 (plus a mix) – every card says which one it uses">
        <p>
          <strong>D3 calculates, React renders:</strong> D3 only computes numbers and path strings (layouts, scales,
          projections) and JSX draws the <code>&lt;svg&gt;</code>. Hover and selection are ordinary React state.
        </p>
        <p>
          <strong>D3 owns the &lt;g&gt;:</strong> React renders an empty <code>&lt;g ref=&#123;gRef&#125; /&gt;</code> and a{' '}
          <code>useEffect</code> hands it to D3 for things React can’t do well – physics simulations, drag, zoom and
          enter/exit transitions. React never touches what is inside that group.
        </p>
        <p>
          <strong>Mixed:</strong> React still draws every mark, but a D3 <em>behaviour</em> such as{' '}
          <code>d3.zoom</code> listens to the pointer on the <code>&lt;svg&gt;</code> and reports its result (a zoom
          transform) into React state.
        </p>
      </Callout>

      <SectionTitle
        title="Networks"
        intro="A network (graph) is just nodes plus links. A node-link diagram is best for following paths; an adjacency matrix is best for spotting clusters – and it never turns into a hairball."
      />
      <DemoCard
        title="Force-directed graph"
        description="A prerequisite network of 30 units. Hover a unit to light up everything it depends on and everything it unlocks. Drag nodes to pin them (double-click to release), Ctrl/⌘ + scroll or pinch to zoom, search to jump to a unit, and play with the physics sliders. Reset zoom undoes the zoom; Reset clears pins, search and sliders."
        concepts={[OWNS, 'd3.forceSimulation', 'forceLink / ManyBody / Collide', 'custom force', 'd3.drag (fx, fy)', 'd3.zoom + filter', 'SVG <marker>', 'alpha().restart()']}
        files={[
          { name: 'ForceGraph.jsx', code: forceGraphCode },
          { name: 'helpers/forceGraphDraw.js', code: forceGraphDrawCode },
          { name: 'helpers/ForceGraphParts.jsx', code: forceGraphPartsCode },
          { name: 'helpers/scrollFriendlyZoom.js', code: scrollFriendlyZoomCode },
          { name: 'data/prerequisites.js', code: prerequisitesCode },
          { name: 'helpers/ChartTooltip.jsx', code: chartTooltipCode },
        ]}
      >
        <ForceGraph />
      </DemoCard>

      <Callout type="warning" title="StrictMode runs every effect twice in development">
        <p>
          React mounts, unmounts and re-mounts each component once to flush out missing clean-ups. D3 code in an effect
          must therefore be <strong>idempotent</strong> (use <code>selection.join()</code>, not a bare{' '}
          <code>append()</code>) and must <strong>undo everything it started</strong>: <code>simulation.stop()</code>,{' '}
          <code>svg.on('.zoom', null)</code>, <code>node.on('.drag', null)</code>, <code>timer.stop()</code>,{' '}
          <code>selection.interrupt()</code>. Without that you would get two simulations fighting over the same nodes.
        </p>
      </Callout>

      <DemoCard
        title="Adjacency matrix"
        description="18 students, three project studios. A filled cell means two students worked together; stronger colour = more shared projects. Re-order the rows and watch the clusters appear – rows and columns slide into place with staggered transitions."
        concepts={[OWNS, 'd3.scaleBand', 'nested transitions', 'transition.delay()', 'd3.pointer', 'Array.sort comparators']}
        files={[
          { name: 'AdjacencyMatrix.jsx', code: adjacencyMatrixCode },
          { name: 'data/collaboration.js', code: collaborationCode },
        ]}
      >
        <AdjacencyMatrix />
      </DemoCard>

      <SectionTitle
        title="Hierarchies"
        intro="Folders, org charts, degree structures: anything nested. d3.hierarchy() wraps nested data once; then any of the hierarchy layouts can position it."
      />
      <DemoCard
        title="One hierarchy, five layouts"
        description="The same 22 files and folders of an Assignment 3 project drawn as a tree, a dendrogram (cluster), a treemap, a circle pack and an icicle. Switch layouts and every node morphs to its new shape – the data never changes, only the layout function."
        concepts={[CALCULATES, 'd3.hierarchy', '.sum() / .sort()', 'tree · cluster · treemap · pack · partition', 'custom hook', 'd3.interpolate + d3.timer']}
        files={[
          { name: 'HierarchyLayouts.jsx', code: hierarchyLayoutsCode },
          { name: 'data/assignmentProject.js', code: assignmentProjectCode },
          { name: 'helpers/hierarchyLabels.js', code: hierarchyLabelsCode },
          { name: 'helpers/useTween.js', code: useTweenCode },
          { name: 'd3-networks.css', code: pageCss },
        ]}
      >
        <HierarchyLayouts />
      </DemoCard>

      <DemoCard
        title="Collapsible tree"
        description="Degree → majors → units. Click a filled node (or a legend entry) to open it: new nodes grow out of their parent, closed ones shrink back into it. Hover a unit to trace its path back to the degree."
        concepts={[OWNS, 'd3.tree().nodeSize()', 'enter / update / exit', 'key function', 'd3.linkHorizontal', 'state in React, animation in D3']}
        files={[
          { name: 'CollapsibleTree.jsx', code: collapsibleTreeCode },
          { name: 'data/degree.js', code: degreeCode },
          { name: 'helpers/motion.js', code: motionCode },
          { name: 'd3-networks.css', code: pageCss },
        ]}
      >
        <CollapsibleTree />
      </DemoCard>

      <DemoCard
        title="Zoomable treemap of this project’s source code"
        description="Every file in this app’s src/ folder, sized by lines of code and coloured by top-level folder (once you zoom in: by sub-folder). Click a folder to zoom in; the breadcrumb zooms back out. The data comes from a small Node script that walks the folder tree."
        concepts={[CALCULATES, 'd3.treemap', 'treemapSquarify', 'custom tile function', 'animated scales', 'Node.js fs', 'JSON import']}
        files={[
          { name: 'ProjectTreemap.jsx', code: projectTreemapCode },
          { name: 'data/generate-project-tree.mjs', code: generateProjectTreeCode },
          { name: 'helpers/useTween.js', code: useTweenCode },
          { name: 'helpers/textOn.js', code: textOnCode },
        ]}
      >
        <ProjectTreemap />
      </DemoCard>

      <Callout type="tip" title="Flat table instead of nested JSON?">
        <p>
          Data from a database or a CSV usually arrives as rows with a <code>parent</code> column, not as nested{' '}
          <code>children</code>. <code>d3.stratify().id((d) =&gt; d.id).parentId((d) =&gt; d.parent)(rows)</code> builds
          the same hierarchy from it. And remember: call <code>.sum()</code> (and usually <code>.sort()</code>) before
          treemap, pack or partition – they size nodes by <code>node.value</code>.
        </p>
      </Callout>

      <DemoCard
        title="Zoomable sunburst"
        description="Enrolments by faculty, school, degree and major. Click any ring to zoom into it; click the centre or the breadcrumb to zoom out. Labels only appear on arcs big enough to hold them."
        concepts={[OWNS, 'd3.partition', 'd3.arc', 'arc tween', 'transition.tween()', 'attrTween']}
        files={[
          { name: 'ZoomableSunburst.jsx', code: zoomableSunburstCode },
          { name: 'data/enrolments.js', code: enrolmentsCode },
        ]}
      >
        <ZoomableSunburst />
      </DemoCard>

      <SectionTitle
        title="Flows"
        intro="How many went from A to B? Chord diagrams show two-way flows inside one group; Sankey diagrams show flows through a sequence of stages."
      />
      <DemoCard
        title="Chord diagram"
        description="Students switching between six majors last year. Six colours on crossing ribbons would be impossible to tell apart, so only one major is shown in colour at a time and everything else stays grey. It opens with the busiest major pinned; hover (or Tab to) another major to light up its flows, click it to pin the highlight, or hover a ribbon to read the flow in both directions. The arrow tip points to the major students joined."
        concepts={[CALCULATES, 'd3.chordDirected', 'd3.ribbonArrow', 'd3.arc', 'square matrix', 'grey + one highlight colour']}
        files={[
          { name: 'ChordDiagram.jsx', code: chordDiagramCode },
          { name: 'data/transfers.js', code: transfersCode },
        ]}
      >
        <ChordDiagram />
      </DemoCard>

      <DemoCard
        title="Sankey diagram"
        description="Entry pathway → major → outcome for 1,190 students. All bands are grey; hovering (or tabbing to) an entry pathway follows its students all the way through in one colour, a major or a band shows its part of the journey, and a click pins the highlight."
        concepts={[CALCULATES, 'd3-sankey', 'sankeyLinkHorizontal', 'nodes + links', 'stroke-width = value', 'grey + one highlight colour']}
        files={[
          { name: 'SankeyDiagram.jsx', code: sankeyDiagramCode },
          { name: 'data/studentJourneys.js', code: studentJourneysCode },
        ]}
      >
        <SankeyDiagram />
      </DemoCard>

      <SectionTitle
        title="Maps"
        intro="A projection turns longitude/latitude into x/y; d3.geoPath turns GeoJSON shapes into SVG paths. Country outlines come from the world-atlas package as compact TopoJSON."
      />
      <DemoCard
        title="Interactive globe"
        description="Great-circle routes from twelve countries to Melbourne, with flowing dashes. Drag to spin the globe (or use the arrow keys), toggle auto-rotation, or fly to Melbourne. Hover a country for its number of international students."
        concepts={[OWNS, 'd3.geoOrthographic', 'd3.geoGraticule', 'topojson feature / mesh', 'd3.drag', 'd3.timer', 'transition.tween()']}
        files={[
          { name: 'InteractiveGlobe.jsx', code: interactiveGlobeCode },
          { name: 'data/world.js', code: worldCode },
          { name: 'data/internationalStudents.js', code: internationalStudentsCode },
          { name: 'd3-networks.css', code: pageCss },
        ]}
      >
        <InteractiveGlobe />
      </DemoCard>

      <DemoCard
        title="Choropleth world map"
        description="International students by country of origin in seven bins of one colour; hatched countries have no data. Click a country – or a row in the data table – to fly to it; click again or press Reset zoom to zoom out. Ctrl/⌘ + scroll (or pinch) zooms, dragging pans."
        concepts={[MIXED, 'd3.geoEqualEarth', 'projection.fitSize', 'd3.scaleThreshold', 'd3.zoom → React state', 'path.bounds()', 'SVG <pattern>']}
        files={[
          { name: 'ChoroplethMap.jsx', code: choroplethMapCode },
          { name: 'data/internationalStudents.js', code: internationalStudentsCode },
          { name: 'data/world.js', code: worldCode },
          { name: 'helpers/scrollFriendlyZoom.js', code: scrollFriendlyZoomCode },
        ]}
      >
        <ChoroplethMap />
      </DemoCard>

      <Callout type="warning" title="Pick the projection for the job">
        <p>
          Web maps often use Mercator, which makes countries near the poles look huge. For a choropleth, where colour
          is spread over area, use an <strong>equal-area</strong> projection such as <code>d3.geoEqualEarth</code>. And
          remember that big totals often just mean “big population” – for a fair comparison, map a rate (students per
          million people) rather than a raw count. The map above shows raw counts to keep the code short: turning it
          into a rate is a good exercise.
        </p>
      </Callout>

      <Callout type="exercise">
        <ol>
          <li>
            <code>ForceGraph.jsx</code>: add a fourth <code>&lt;Slider&gt;</code> for the strength of{' '}
            <code>forceY</code> (set it in the UPDATE effect) and watch the year levels form clear rows – or melt into
            one cloud.
          </li>
          <li>
            <code>collaboration.js</code>: add a fourth entry “By total shared projects” to <code>ORDERS</code>. Why does{' '}
            <code>AdjacencyMatrix.jsx</code> not need a single change?
          </li>
          <li>
            <code>ProjectTreemap.jsx</code>: add a “Size by lines / bytes” toggle that changes the{' '}
            <code>.sum()</code> accessor. Then create a new file in <code>src/</code>, run{' '}
            <code>generate-project-tree.mjs</code> again and find your file in the treemap.
          </li>
          <li>
            <code>HierarchyLayouts.jsx</code>: add a sixth layout – a radial tree using{' '}
            <code>d3.tree().size([2 * Math.PI, radius])</code> – by converting each node’s angle and radius to x/y.
          </li>
          <li>
            <code>ChoroplethMap.jsx</code>: replace the fixed <code>THRESHOLDS</code> with a{' '}
            <code>d3.scaleQuantile()</code> over the data. Which countries change colour, and how could that mislead a
            reader?
          </li>
        </ol>
      </Callout>
    </>
  );
}
