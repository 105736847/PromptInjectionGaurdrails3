import PageHeader from '../../components/common/PageHeader.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';

import Clock from './demos/Clock.jsx';
import clockCode from './demos/Clock.jsx?raw';
import DocumentTitle from './demos/DocumentTitle.jsx';
import documentTitleCode from './demos/DocumentTitle.jsx?raw';
import DependencyLab from './demos/DependencyLab.jsx';
import dependencyLabCode from './demos/DependencyLab.jsx?raw';
import LifecycleLog from './demos/LifecycleLog.jsx';
import lifecycleLogCode from './demos/LifecycleLog.jsx?raw';
import TimerComparison from './demos/TimerComparison.jsx';
import timerComparisonCode from './demos/TimerComparison.jsx?raw';
import classTimerCode from './demos/ClassTimer.jsx?raw';
import functionTimerCode from './demos/FunctionTimer.jsx?raw';
import BuggyCounterDemo from './demos/BuggyCounter.jsx';
import buggyCounterCode from './demos/BuggyCounter.jsx?raw';
import errorBoundaryCode from '../../components/common/ErrorBoundary.jsx?raw';
import RefBasics from './demos/RefBasics.jsx';
import refBasicsCode from './demos/RefBasics.jsx?raw';
import Stopwatch from './demos/Stopwatch.jsx';
import stopwatchCode from './demos/Stopwatch.jsx?raw';
import ExpensiveCalc from './demos/ExpensiveCalc.jsx';
import expensiveCalcCode from './demos/ExpensiveCalc.jsx?raw';
import MemoCallback from './demos/MemoCallback.jsx';
import memoCallbackCode from './demos/MemoCallback.jsx?raw';
import ContextDemo from './demos/ContextDemo.jsx';
import contextDemoCode from './demos/ContextDemo.jsx?raw';
import themeContextCode from '../../context/ThemeContext.jsx?raw';
import CustomHooksDemo from './demos/CustomHooksDemo.jsx';
import customHooksDemoCode from './demos/CustomHooksDemo.jsx?raw';
import useDebounceCode from './demos/useDebounce.js?raw';
import useOnlineStatusCode from './demos/useOnlineStatus.js?raw';
import useToggleCode from './demos/useToggle.js?raw';
import SharedHooksDemo from './demos/SharedHooksDemo.jsx';
import sharedHooksDemoCode from './demos/SharedHooksDemo.jsx?raw';
import useLocalStorageCode from '../../hooks/useLocalStorage.js?raw';
import useWindowSizeCode from '../../hooks/useWindowSize.js?raw';
import './hooks.css';

// Class lifecycle methods and their closest hook equivalents.
const LIFECYCLE_MAP = [
  ['constructor() { this.state = {…} }', 'const [value, setValue] = useState(initial)'],
  ['this.setState({ … })', 'setValue(…)'],
  ['componentDidMount()', 'useEffect(() => { … }, [])'],
  ['componentDidUpdate(prevProps, prevState)', 'useEffect(() => { … }, [dep1, dep2])'],
  ['componentWillUnmount()', 'the cleanup function returned from useEffect'],
  ['this.someField (instance variable)', 'useRef()'],
  ['render()', 'the body of the function component'],
];

export default function HooksPage() {
  return (
    <>
      <PageHeader
        eyebrow="React Fundamentals"
        title="Hooks & Lifecycle"
        intro="Hooks are functions that let a component remember things (useState, useRef), synchronise with the world outside React (useEffect), share data without prop drilling (useContext) and skip unnecessary work (useMemo, memo, useCallback). You can also combine them into your own custom hooks."
        concepts={['useEffect', 'cleanup', 'dependency array', 'mount / update / unmount', 'class components', 'Error Boundary', 'useRef', 'useMemo', 'memo', 'useCallback', 'useContext', 'custom hooks']}
        docs={[
          { label: 'Built-in hooks', href: 'https://react.dev/reference/react/hooks' },
          { label: 'Synchronizing with effects', href: 'https://react.dev/learn/synchronizing-with-effects' },
          { label: 'You might not need an effect', href: 'https://react.dev/learn/you-might-not-need-an-effect' },
          { label: 'Reusing logic with custom hooks', href: 'https://react.dev/learn/reusing-logic-with-custom-hooks' },
          { label: 'Component (class)', href: 'https://react.dev/reference/react/Component' },
        ]}
      />

      <SectionTitle
        title="useEffect: synchronising with the outside world"
        intro="Rendering should only calculate JSX. Anything that touches the outside world – timers, the document title, network requests, event listeners on window – goes into an effect, which runs AFTER React has updated the screen."
      />
      <DemoCard
        title="A live clock and a live tab title"
        description="The clock starts an interval when it mounts and clears it in the cleanup. The message counter copies state into document.title – watch your browser tab."
        concepts={['useEffect', 'setInterval', 'cleanup', 'document.title', '[deps]']}
        files={[
          { name: 'Clock.jsx', code: clockCode },
          { name: 'DocumentTitle.jsx', code: documentTitleCode },
        ]}
      >
        <div className="grid-2">
          <Clock />
          <DocumentTitle />
        </div>
      </DemoCard>

      <DemoCard
        title="Dependency array lab"
        description="One component, three effects: no array, an empty array and [value]. Change the watched value, change an unwatched value, or remount the component, and read which effects ran."
        concepts={['useEffect(fn)', 'useEffect(fn, [])', 'useEffect(fn, [value])', 'memo', 'key to remount']}
        code={dependencyLabCode}
        filename="DependencyLab.jsx"
      >
        <DependencyLab />
      </DemoCard>

      <Callout type="warning" title="Effects are not for everything">
        <p>
          If a value can be calculated from props or state, calculate it while rendering (like the filtered list or
          the character count on the other pages) – don’t copy it into state with an effect. Every effect that calls a
          setter causes an extra render, and an effect without a dependency array that sets state will loop forever.
        </p>
      </Callout>

      <SectionTitle
        title="Component lifecycle"
        intro="Every component is mounted (appears), updated (re-renders with new props or state) any number of times, and finally unmounted (removed). Function components express this with effects and their cleanups; class components use special methods."
      />
      <DemoCard
        title="Mount → update → unmount, logged"
        description="The badge writes every lifecycle event into a log owned by its parent. Change its props, then unmount it and mount it again."
        concepts={['mount', 'update', 'cleanup', 'unmount', 'useRef for previous props', 'StrictMode']}
        code={lifecycleLogCode}
        filename="LifecycleLog.jsx"
      >
        <LifecycleLog />
      </DemoCard>

      <DemoCard
        title="Class component vs function component"
        description="The same timer written twice: as a class with lifecycle methods (as in the lecture slides) and as a function with hooks. Switch them off to trigger componentWillUnmount / the effect cleanup."
        concepts={['class … extends Component', 'constructor', 'this.setState', 'componentDidMount', 'componentDidUpdate', 'componentWillUnmount']}
        files={[
          { name: 'ClassTimer.jsx', code: classTimerCode },
          { name: 'FunctionTimer.jsx', code: functionTimerCode },
          { name: 'TimerComparison.jsx', code: timerComparisonCode },
        ]}
      >
        <TimerComparison />
      </DemoCard>

      <div className="table-wrap mb-2">
        <table className="table">
          <caption>Class lifecycle methods → hooks</caption>
          <thead>
            <tr>
              <th scope="col">Class component</th>
              <th scope="col">Function component</th>
            </tr>
          </thead>
          <tbody>
            {LIFECYCLE_MAP.map(([classVersion, hookVersion]) => (
              <tr key={classVersion}>
                <td><code>{classVersion}</code></td>
                <td><code>{hookVersion}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DemoCard
        title="Error boundary: contain the crash"
        description="Each counter throws an error while rendering when it reaches 3. Its error boundary shows a fallback with a reset button – the other counter and the rest of the page keep working."
        concepts={['ErrorBoundary', 'getDerivedStateFromError', 'componentDidCatch', 'fallback(error, reset)']}
        files={[
          { name: 'BuggyCounter.jsx', code: buggyCounterCode },
          { name: 'ErrorBoundary.jsx', code: errorBoundaryCode },
        ]}
      >
        <BuggyCounterDemo />
      </DemoCard>

      <SectionTitle
        title="useRef"
        intro="A ref is a box that React keeps between renders but never watches. Use it to reach a DOM element, or to remember something (a timer id, a previous value) whose change should not update the screen."
      />
      <DemoCard
        title="DOM refs, silent values and previous values"
        description="Focus and select an input, compare a counter kept in a ref with one kept in state, and remember the previous slider value."
        concepts={['useRef', 'ref={…}', 'ref.current', 'no re-render', 'render counter']}
        code={refBasicsCode}
        filename="RefBasics.jsx"
      >
        <RefBasics />
      </DemoCard>

      <DemoCard
        title="Stopwatch with laps"
        description="The interval id lives in a ref: our code needs it to stop the timer, but the screen never shows it. The elapsed time and laps are state because they are displayed."
        concepts={['useRef', 'setInterval / clearInterval', 'state vs ref', 'unmount cleanup']}
        code={stopwatchCode}
        filename="Stopwatch.jsx"
      >
        <Stopwatch />
      </DemoCard>

      <SectionTitle
        title="Performance: useMemo, memo & useCallback"
        intro="React is fast by default – reach for these only when you measure a problem. useMemo caches a calculated value, memo lets a component skip re-rendering, and useCallback keeps a function the same between renders so memo can do its job."
      />
      <DemoCard
        title="useMemo: cache an expensive calculation"
        description="Counting primes the slow way takes real time. Toggle the unrelated highlight: with useMemo the result is reused; without it, the work is repeated on every render."
        concepts={['useMemo', 'dependency array', 'performance.now()', 'hooks can’t be conditional']}
        code={expensiveCalcCode}
        filename="ExpensiveCalc.jsx"
      >
        <ExpensiveCalc />
      </DemoCard>

      <DemoCard
        title="memo + useCallback: skip child re-renders"
        description="Three identical children with visible render counters. Only the memo’d child that receives a stable (useCallback) function stays still when the parent re-renders."
        concepts={['React.memo', 'useCallback', 'referential equality', 'custom hook useRenderCount']}
        code={memoCallbackCode}
        filename="MemoCallback.jsx"
      >
        <MemoCallback />
      </DemoCard>

      <SectionTitle
        title="useContext"
        intro="Context delivers a value to every component inside a provider, however deep, without passing props through each level. It is ideal for app-wide settings such as the language, the colour theme or the signed-in user."
      />
      <DemoCard
        title="Language context + the app’s theme context"
        description="Pick a language: only the deeply nested Greeting reads it. The right-hand subtree has its own provider. The theme button uses the real app-wide ThemeContext – it changes the whole site."
        concepts={['createContext', '<Context value>', 'useContext', 'nearest provider wins', 'useTheme()']}
        files={[
          { name: 'ContextDemo.jsx', code: contextDemoCode },
          { name: 'ThemeContext.jsx', code: themeContextCode },
        ]}
      >
        <ContextDemo />
      </DemoCard>

      <SectionTitle
        title="Custom hooks"
        intro="When two components need the same stateful logic, move it into a function whose name starts with use. Custom hooks share logic, not state: each component that calls one gets its own independent copy."
      />
      <DemoCard
        title="useDebounce, useOnlineStatus & useToggle"
        description="Type quickly in the search box: the search only runs once you pause. Go offline in DevTools to see the badge change, and use the switch to show emails."
        concepts={['custom hook', 'useDebounce', 'online/offline events', 'useToggle', 'returning an array']}
        files={[
          { name: 'CustomHooksDemo.jsx', code: customHooksDemoCode },
          { name: 'useDebounce.js', code: useDebounceCode },
          { name: 'useOnlineStatus.js', code: useOnlineStatusCode },
          { name: 'useToggle.js', code: useToggleCode },
        ]}
      >
        <CustomHooksDemo />
      </DemoCard>

      <DemoCard
        title="Shared hooks: useLocalStorage & useWindowSize"
        description="Notes typed here are saved in your browser and survive a refresh. The window size updates live as you resize – both come from the app’s own src/hooks folder."
        concepts={['useLocalStorage', 'useWindowSize', 'resize event', 'localStorage']}
        files={[
          { name: 'SharedHooksDemo.jsx', code: sharedHooksDemoCode },
          { name: 'useLocalStorage.js', code: useLocalStorageCode },
          { name: 'useWindowSize.js', code: useWindowSizeCode },
        ]}
      >
        <SharedHooksDemo />
      </DemoCard>

      <Callout type="warning" title="The Rules of Hooks">
        <ol>
          <li>
            <strong>Only call hooks at the top level</strong> of your component – never inside <code>if</code>, loops,
            nested functions or after an early <code>return</code>. React identifies each hook by its call order, so
            the order must be the same on every render.
          </li>
          <li>
            <strong>Only call hooks from React functions</strong>: function components and custom hooks – not from
            regular JavaScript functions or class components.
          </li>
          <li>
            <strong>Custom hooks must start with <code>use</code></strong> (<code>useDebounce</code>, not{' '}
            <code>debounce</code>) so React and the linter know the rules apply to them.
          </li>
          <li>
            <strong>List every value your effect uses in its dependency array.</strong> The{' '}
            <code>eslint-plugin-react-hooks</code> linter will warn you when you forget one.
          </li>
        </ol>
      </Callout>

      <Callout type="exercise">
        <ol>
          <li>
            In <code>Clock.jsx</code>, add a “Pause” switch. Hint: when paused, the effect should not start an interval
            – what must you add to the dependency array?
          </li>
          <li>
            In <code>Stopwatch.jsx</code>, add a keyboard shortcut: pressing the space bar starts/stops the stopwatch.
            Add the <code>keydown</code> listener to <code>window</code> in a <code>useEffect</code> and remove it in
            the cleanup.
          </li>
          <li>
            Write a <code>useFetch</code>-style hook of your own, <code>useStudent(id)</code>, that loads{' '}
            <code className="hooks-break">https://jsonplaceholder.typicode.com/users/&#123;id&#125;</code> and returns{' '}
            <code>{'{ data, loading, error }'}</code>. Use it in a new component.
          </li>
          <li>
            In <code>ContextDemo.jsx</code>, add a fourth language and a <code>goodbye</code> message, then show it in a
            new component nested inside <code>Page</code> – without adding any props.
          </li>
          <li>
            In <code>MemoCallback.jsx</code>, give the memo’d children a <code>style</code> prop written inline as{' '}
            <code>{'style={{ padding: 8 }}'}</code>. What happens to their render counters – and how would{' '}
            <code>useMemo</code> fix it?
          </li>
        </ol>
      </Callout>
    </>
  );
}
