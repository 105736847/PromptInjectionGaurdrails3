import { Link } from 'react-router-dom';

import PageHeader from '../../components/common/PageHeader.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';

import KpiCards from './demos/KpiCards.jsx';
import kpiCardsCode from './demos/KpiCards.jsx?raw';
import weeklyScoresCode from './demos/weeklyScores.js?raw';
import BasicTable from './demos/BasicTable.jsx';
import basicTableCode from './demos/BasicTable.jsx?raw';
import StudentExplorer from './demos/StudentExplorer.jsx';
import studentExplorerCode from './demos/StudentExplorer.jsx?raw';
import studentTableCode from './demos/StudentTable.jsx?raw';
import studentCardsCode from './demos/StudentCards.jsx?raw';
import indeterminateCheckboxCode from './demos/IndeterminateCheckbox.jsx?raw';
import gradeBadgeCode from './demos/GradeBadge.jsx?raw';
import csvCode from './demos/csv.js?raw';
import GradeBarChart from './demos/GradeBarChart.jsx';
import gradeBarChartCode from './demos/GradeBarChart.jsx?raw';
import MajorDonutChart from './demos/MajorDonutChart.jsx';
import majorDonutChartCode from './demos/MajorDonutChart.jsx?raw';
import ScoreLineChart from './demos/ScoreLineChart.jsx';
import scoreLineChartCode from './demos/ScoreLineChart.jsx?raw';
import GroupedList from './demos/GroupedList.jsx';
import groupedListCode from './demos/GroupedList.jsx?raw';
import MasterDetail from './demos/MasterDetail.jsx';
import masterDetailCode from './demos/MasterDetail.jsx?raw';
import './data.css';

export default function DataPage() {
  return (
    <>
      <PageHeader
        eyebrow="Data & Navigation"
        title="Data Display"
        intro="Most apps are lists of things: students, products, predictions. This page turns one array of 32 mock students into summary cards, a searchable table, a card grid, hand-drawn SVG charts and a master–detail view – all from the same data, all derived while rendering."
        concepts={['map()', 'filter()', 'reduce()', 'sort()', 'useMemo', 'derived state', 'SVG', 'Blob', 'aria-sort']}
        docs={[
          { label: 'Rendering lists', href: 'https://react.dev/learn/rendering-lists' },
          { label: 'Choosing the state structure', href: 'https://react.dev/learn/choosing-the-state-structure' },
          { label: 'useMemo', href: 'https://react.dev/reference/react/useMemo' },
          { label: 'MDN: <table>', href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table' },
          { label: 'MDN: SVG tutorial', href: 'https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial' },
        ]}
      />

      <SectionTitle
        title="Summaries"
        intro="Start a dashboard with the few numbers people actually care about. reduce() folds a whole array into one value (or one object of values)."
      />
      <DemoCard
        title="KPI cards"
        description="Total, average, pass rate and at-risk count are computed from the data on every render, with a tiny SVG sparkline for the trend."
        concepts={['reduce()', 'derived values', 'Intl.NumberFormat', 'SVG polyline']}
        files={[
          { name: 'KpiCards.jsx', code: kpiCardsCode },
          { name: 'weeklyScores.js', code: weeklyScoresCode },
        ]}
      >
        <KpiCards />
      </DemoCard>

      <SectionTitle
        title="Tables"
        intro="A table is the right tool when people need to compare exact values across rows. Begin with plain map(), then add features one state variable at a time."
      />
      <DemoCard
        title="A basic table"
        description="map() each student to a <tr> with a stable key. The rows are sorted on a copy, and the footer average is computed with reduce()."
        concepts={['map()', 'key', '[...array].sort()', '<caption>', 'scope', '<tfoot>']}
        code={basicTableCode}
        filename="BasicTable.jsx"
      >
        <BasicTable />
      </DemoCard>

      <DemoCard
        title="Student explorer: search, filter, sort, paginate, select, export"
        description="Search by name, email or ID, combine filters, click the column headers to sort, pick rows (the header checkbox shows a dash when only some are selected), run a bulk action, switch to cards, or export what you see to CSV."
        concepts={['useMemo', 'derived state', 'aria-sort', 'Set in state', 'useRef', 'lifting state up', 'Blob', 'URL.createObjectURL']}
        files={[
          { name: 'StudentExplorer.jsx', code: studentExplorerCode },
          { name: 'StudentTable.jsx', code: studentTableCode },
          { name: 'StudentCards.jsx', code: studentCardsCode },
          { name: 'IndeterminateCheckbox.jsx', code: indeterminateCheckboxCode },
          { name: 'GradeBadge.jsx', code: gradeBadgeCode },
          { name: 'csv.js', code: csvCode },
        ]}
      >
        <StudentExplorer />
      </DemoCard>

      <Callout type="warning" title="Don’t copy derived data into state">
        <p>
          A common beginner pattern is <code>const [filtered, setFiltered] = useState([])</code> plus a{' '}
          <code>useEffect</code> that recalculates it whenever the search changes. It works, but it renders twice
          and the two copies can drift apart. Instead, calculate <code>filtered</code> directly in the component
          body – and wrap it in <code>useMemo</code> only if the calculation is genuinely slow.
        </p>
      </Callout>

      <SectionTitle
        title="Charts with plain SVG"
        intro="You don’t need a chart library for simple charts. A chart is just data → scales → shapes. Each chart below has a hover tooltip, a text alternative (aria-label) and a “Show data table” button for people who can’t see or hover it."
      />
      <DemoCard
        title="Column chart: grade distribution"
        description="One colour for one series, value labels on top of each bar, light gridlines and a hover tooltip."
        concepts={['SVG viewBox', 'scales', 'reduce()', 'onPointerEnter', 'role="img"']}
        code={gradeBarChartCode}
        filename="GradeBarChart.jsx"
      >
        <GradeBarChart />
      </DemoCard>

      <DemoCard
        title="Donut chart: students by major"
        description="Slices are built from arcs. Hover a slice or a legend row – the centre of the donut shows the value. The legend lists every number, so nothing depends on hovering."
        concepts={['SVG path arcs', 'Math.sin / Math.cos', 'CSS variables', 'legend']}
        code={majorDonutChartCode}
        filename="MajorDonutChart.jsx"
      >
        <MajorDonutChart />
      </DemoCard>

      <DemoCard
        title="Line & area chart: average score per week"
        description="Move the pointer across the chart: a crosshair snaps to the nearest week and the tooltip lists both series. Lines are labelled directly at their ends."
        concepts={['SVG path', 'onPointerMove', 'getBoundingClientRect', 'crosshair', 'direct labels']}
        files={[
          { name: 'ScoreLineChart.jsx', code: scoreLineChartCode },
          { name: 'weeklyScores.js', code: weeklyScoresCode },
        ]}
      >
        <ScoreLineChart />
      </DemoCard>

      <Callout type="tip" title="When to reach for a library">
        <p>
          Hand-made SVG is perfect for learning and for two or three simple charts. For zooming, many series,
          animations or big datasets, a library such as Recharts, Chart.js or D3 saves a lot of work – but the
          ideas (scales, axes, legends, a table alternative) stay exactly the same.
        </p>
        <p>
          Ready for more? The <Link to="/d3-basics">Data Visualization (D3)</Link> section picks up exactly
          here: the same scales and SVG shapes, plus zooming, brushing, animated transitions, networks, maps and
          charts for your machine-learning results.
        </p>
      </Callout>

      <SectionTitle
        title="Grouping and drilling down"
        intro="Two more everyday patterns: grouping rows under collapsible headings, and a list that opens the details of whatever you click."
      />
      <DemoCard
        title="Group by campus, major or year"
        description="reduce() turns the flat array into groups. Each heading shows the group size and average and can be collapsed."
        concepts={['reduce() into an object', 'Object.entries', 'aria-expanded', 'Set in state']}
        files={[
          { name: 'GroupedList.jsx', code: groupedListCode },
          { name: 'GradeBadge.jsx', code: gradeBadgeCode },
        ]}
      >
        <GroupedList />
      </DemoCard>

      <DemoCard
        title="Master–detail view"
        description="Click a student on the left to see their details on the right, including a score meter with the pass mark."
        concepts={['selected id in state', 'find()', 'role="meter"', '<dl>', 'CSS custom property']}
        files={[
          { name: 'MasterDetail.jsx', code: masterDetailCode },
          { name: 'GradeBadge.jsx', code: gradeBadgeCode },
        ]}
      >
        <MasterDetail />
      </DemoCard>

      <Callout type="exercise">
        <ol>
          <li>
            In <code>StudentExplorer.jsx</code>, add a “Year” filter (1, 2 or 3). You only need to add one entry to
            the <code>FILTERS</code> array and one key to <code>NO_FILTERS</code> – why does everything else just work?
          </li>
          <li>
            In <code>StudentTable.jsx</code>, add a sortable “Enrolled” column. Then check how{' '}
            <code>compareBy()</code> in <code>StudentExplorer.jsx</code> sorts it – does sorting date strings as text
            give the right order?
          </li>
          <li>
            Give <code>GradeBarChart.jsx</code> a “Group by major” option that shows student counts per major
            instead of per grade. Which parts of the chart had to change, and which stayed the same?
          </li>
          <li>
            In <code>ScoreLineChart.jsx</code>, add a third series (for example “Online students”) to{' '}
            <code>weeklyScores.js</code> and the <code>SERIES</code> array, using <code>--chart-3</code>.
          </li>
          <li>
            In <code>MasterDetail.jsx</code>, let the Arrow Up / Arrow Down keys move the selection through the list.
          </li>
        </ol>
      </Callout>
    </>
  );
}
