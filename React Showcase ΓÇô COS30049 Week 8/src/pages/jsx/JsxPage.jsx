import PageHeader from '../../components/common/PageHeader.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';
import CodeBlock from '../../components/common/CodeBlock.jsx';

import JsxExpressions from './demos/JsxExpressions.jsx';
import jsxExpressionsCode from './demos/JsxExpressions.jsx?raw';
import HtmlVsJsx from './demos/HtmlVsJsx.jsx';
import htmlVsJsxCode from './demos/HtmlVsJsx.jsx?raw';
import Fragments from './demos/Fragments.jsx';
import fragmentsCode from './demos/Fragments.jsx?raw';
import JsxToObject from './demos/JsxToObject.jsx';
import jsxToObjectCode from './demos/JsxToObject.jsx?raw';
import StudentList from './demos/StudentList.jsx';
import studentListCode from './demos/StudentList.jsx?raw';
import studentCardCode from './demos/StudentCard.jsx?raw';
import PropsPlayground from './demos/PropsPlayground.jsx';
import propsPlaygroundCode from './demos/PropsPlayground.jsx?raw';
import UnitPicker from './demos/UnitPicker.jsx';
import unitPickerCode from './demos/UnitPicker.jsx?raw';
import Composition from './demos/Composition.jsx';
import compositionCode from './demos/Composition.jsx?raw';
import ConditionalRendering from './demos/ConditionalRendering.jsx';
import conditionalRenderingCode from './demos/ConditionalRendering.jsx?raw';
import ZeroPitfall from './demos/ZeroPitfall.jsx';
import zeroPitfallCode from './demos/ZeroPitfall.jsx?raw';
import StudentFilter from './demos/StudentFilter.jsx';
import studentFilterCode from './demos/StudentFilter.jsx?raw';
import KeysDemo from './demos/KeysDemo.jsx';
import keysDemoCode from './demos/KeysDemo.jsx?raw';
import PropsDrilling from './demos/PropsDrilling.jsx';
import propsDrillingCode from './demos/PropsDrilling.jsx?raw';
import './jsx.css';

// Shown (not run): what the build tool turns JSX into.
const compiledCode = `// 1. What you write (JSX)
const card = (
  <div className="card">
    <h2>Hello, {name}!</h2>
    <button onClick={handleEnrol}>Enrol</button>
  </div>
);

// 2. What Vite/Babel compiles it into – plain JavaScript function calls
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';

const compiled = _jsxs('div', {
  className: 'card',
  children: [
    _jsxs('h2', { children: ['Hello, ', name, '!'] }),
    _jsx('button', { onClick: handleEnrol, children: 'Enrol' }),
  ],
});

// 3. The classic form you will see in older tutorials – same idea
const classic = React.createElement(
  'div',
  { className: 'card' },
  React.createElement('h2', null, 'Hello, ', name, '!'),
  React.createElement('button', { onClick: handleEnrol }, 'Enrol'),
);

// 4. All three produce a plain object ("a React element"), roughly:
// { type: 'div', props: { className: 'card', children: [ {type: 'h2', …}, {type: 'button', …} ] } }`;

export default function JsxPage() {
  return (
    <>
      <PageHeader
        eyebrow="React Fundamentals"
        title="JSX & Components"
        intro="React apps are built from components: small JavaScript functions that return JSX, an HTML-like syntax that describes what should appear on screen. Parents pass data down to their children as props, and the whole UI becomes a tree of reusable pieces."
        concepts={['JSX', '{ expressions }', 'Fragments', 'components', 'props', 'children', 'conditional rendering', 'map()', 'key']}
        docs={[
          { label: 'Writing markup with JSX', href: 'https://react.dev/learn/writing-markup-with-jsx' },
          { label: 'Passing props', href: 'https://react.dev/learn/passing-props-to-a-component' },
          { label: 'Conditional rendering', href: 'https://react.dev/learn/conditional-rendering' },
          { label: 'Rendering lists', href: 'https://react.dev/learn/rendering-lists' },
        ]}
      />

      <SectionTitle
        title="JSX basics"
        intro="JSX lets you write markup inside JavaScript. It looks like HTML, but curly braces open a window back into JavaScript, and a few attribute names are different."
      />
      <DemoCard
        title="Expressions, attributes and styles"
        description="Edit the fields: the card is re-drawn from the new values. Everything inside { } is a JavaScript expression – a variable, a calculation, a function call or a template string."
        concepts={['{ expression }', 'className', 'htmlFor', 'style={{ }}', 'onChange', 'self-closing tags']}
        code={jsxExpressionsCode}
        filename="JsxExpressions.jsx"
      >
        <JsxExpressions />
      </DemoCard>

      <DemoCard
        title="HTML vs JSX – spot the difference"
        description="The rules that catch everyone out at first. Turn on quiz mode to test yourself before the lab."
        concepts={['className', 'htmlFor', 'camelCase', 'map()']}
        code={htmlVsJsxCode}
        filename="HtmlVsJsx.jsx"
      >
        <HtmlVsJsx />
      </DemoCard>

      <DemoCard
        title="One parent element: Fragments"
        description="A component can only return one element. A Fragment groups siblings without adding an extra DOM node – toggle it off and watch the grid layout break."
        concepts={['<>…</>', '<Fragment key>', 'one root element']}
        code={fragmentsCode}
        filename="Fragments.jsx"
      >
        <Fragments />
      </DemoCard>

      <SectionTitle
        title="JSX is just JavaScript"
        intro="Browsers cannot read JSX. Before your code runs, Vite (using a compiler such as Babel or SWC) rewrites every tag into a function call. This is why JSX can live inside variables, arrays and return statements."
      />
      <div className="demo-card">
        <CodeBlock code={compiledCode} filename="what-the-compiler-sees.js" />
      </div>

      <DemoCard
        title="A JSX element is just an object"
        description="Pick an example: on the left React renders it, on the right you see the plain object that the JSX expression produced."
        concepts={['React element', 'type', 'props', 'props.children']}
        code={jsxToObjectCode}
        filename="JsxToObject.jsx"
      >
        <JsxToObject />
      </DemoCard>

      <SectionTitle
        title="Components & props"
        intro="A component is a function whose name starts with a capital letter. Props are its arguments: the parent passes them like HTML attributes, and the component reads them from a single object (usually destructured)."
      />
      <DemoCard
        title="One component, many cards"
        description="StudentCard is written once and used three times with different props. The third card leaves some props out, so the default values kick in."
        concepts={['function component', 'props', 'destructuring', 'default values', 'boolean props']}
        files={[
          { name: 'StudentList.jsx', code: studentListCode },
          { name: 'StudentCard.jsx', code: studentCardCode },
        ]}
      >
        <StudentList />
      </DemoCard>

      <DemoCard
        title="Props flow down (and are read-only)"
        description="The parent keeps the data in state and passes it down; the card just displays it. The red button tries to change a prop from inside the child – React does not allow it."
        concepts={['one-way data flow', 'props are immutable', 'array props']}
        files={[
          { name: 'PropsPlayground.jsx', code: propsPlaygroundCode },
          { name: 'StudentCard.jsx', code: studentCardCode },
        ]}
      >
        <PropsPlayground />
      </DemoCard>

      <Callout type="warning" title="Props are read-only">
        <p>
          A component must behave like a pure function of its props: same props in, same JSX out. Never assign to{' '}
          <code>props.something</code>. If a value needs to change over time, it belongs in <strong>state</strong> –
          usually in the parent, which then passes the new value down.
        </p>
      </Callout>

      <DemoCard
        title="Functions as props: child → parent"
        description="Data only flows down, so the parent passes callbacks (onSelect, onToggleEnrol) to each UnitCard. Clicking inside a child calls the parent's function, and the parent updates its state."
        concepts={['callback props', 'onSelect', 'lifting state up', 'aria-pressed']}
        code={unitPickerCode}
        filename="UnitPicker.jsx"
      >
        <UnitPicker />
      </DemoCard>

      <SectionTitle
        title="children & composition"
        intro="Instead of building one giant component with many options, build small containers and fill them with whatever you need. React favours composition over inheritance."
      />
      <DemoCard
        title="A reusable Panel with slots"
        description="One Panel component, four different uses. Whatever you put between the tags arrives as props.children; the actions and footer props are extra 'slots' for JSX."
        concepts={['props.children', 'slot props', 'composition', 'JSX as a prop']}
        code={compositionCode}
        filename="Composition.jsx"
      >
        <Composition />
      </DemoCard>

      <SectionTitle
        title="Conditional rendering"
        intro="JSX has no if-statement, but it doesn't need one: use plain JavaScript – an early return, the ternary operator, && or an object lookup."
      />
      <DemoCard
        title="Four ways to render conditionally"
        description="Change the controls on the left and watch the card on the right choose different UI."
        concepts={['early return', 'cond ? a : b', 'cond && a', 'object lookup']}
        code={conditionalRenderingCode}
        filename="ConditionalRendering.jsx"
      >
        <ConditionalRendering />
      </DemoCard>

      <DemoCard
        title="The 0 && pitfall"
        description="Set the counter to 0. The left version prints a stray '0' because React renders numbers; the right version compares first, so it gets a real boolean."
        concepts={['&&', 'falsy values', 'count > 0']}
        code={zeroPitfallCode}
        filename="ZeroPitfall.jsx"
      >
        <ZeroPitfall />
      </DemoCard>

      <SectionTitle
        title="Lists & keys"
        intro="Use map() to turn an array of data into an array of elements, and filter() to choose which items to show. Each item needs a key so React can tell the items apart between renders."
      />
      <DemoCard
        title="Filter + map a list of students"
        description="The visible list is calculated from the data and three pieces of state on every render – nothing is copied into extra state."
        concepts={['filter()', 'map()', 'key={id}', 'derived data', 'empty state']}
        code={studentFilterCode}
        filename="StudentFilter.jsx"
      >
        <StudentFilter />
      </DemoCard>

      <DemoCard
        title="Why key={index} is wrong"
        description="Type a different note next to each name, then click 'Add to top' or 'Shuffle'. On the left the notes stay where they were and end up next to the wrong student; on the right they move with their student."
        concepts={['key', 'reconciliation', 'uncontrolled input', 'key to reset']}
        code={keysDemoCode}
        filename="KeysDemo.jsx"
      >
        <KeysDemo />
      </DemoCard>

      <Callout type="tip" title="Choosing a key">
        <ul>
          <li>Use a stable, unique id from your data (a database id, student ID, unit code…).</li>
          <li>Keys only need to be unique among <em>siblings</em>, not in the whole app.</li>
          <li>
            <code>key={'{index}'}</code> is only safe if the list is never reordered, filtered or inserted into.
          </li>
          <li>Never generate keys while rendering (<code>Math.random()</code>) – every render would create new rows.</li>
        </ul>
      </Callout>

      <SectionTitle
        title="The component tree"
        intro="Components nest inside each other to form a tree. Data travels down the tree through props, one level at a time."
      />
      <DemoCard
        title="Passing a prop down three levels"
        description="Each box is a component. App owns the state; only UserMenu uses it, but Dashboard and Sidebar have to hand it down. Edit the name and watch it flow through the tree."
        concepts={['component tree', 'prop drilling', 'single source of truth']}
        code={propsDrillingCode}
        filename="PropsDrilling.jsx"
      >
        <PropsDrilling />
      </DemoCard>

      <Callout type="exercise">
        <ol>
          <li>
            In <code>StudentCard.jsx</code>, add an optional <code>year</code> prop (default <code>1</code>) and show
            it as a badge. Pass a different year to each card in <code>StudentList.jsx</code>.
          </li>
          <li>
            In <code>UnitPicker.jsx</code>, pass a <code>disabled</code> prop to <code>UnitCard</code> so the Enrol
            button is disabled once the maximum of four units is reached.
          </li>
          <li>
            In <code>StudentFilter.jsx</code>, add a “Sort by score” checkbox. Sort a <em>copy</em> of the filtered
            array (<code>[...visible].sort(…)</code>) and show each student’s score.
          </li>
          <li>
            Add a <code>danger</code> tone to the <code>Panel</code> in <code>Composition.jsx</code> using a{' '}
            <code>tone</code> prop that changes the header colour, then use it for an “Overdue” panel.
          </li>
          <li>
            In <code>KeysDemo.jsx</code>, add a “Remove first” button and predict what happens to the typed notes in
            each list before you try it.
          </li>
        </ol>
      </Callout>
    </>
  );
}
