import PageHeader from '../../components/common/PageHeader.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';

import Counter from './demos/Counter.jsx';
import counterCode from './demos/Counter.jsx?raw';
import UpdaterPitfall from './demos/UpdaterPitfall.jsx';
import updaterPitfallCode from './demos/UpdaterPitfall.jsx?raw';
import BooleanToggles from './demos/BooleanToggles.jsx';
import booleanTogglesCode from './demos/BooleanToggles.jsx?raw';
import ProfileEditor from './demos/ProfileEditor.jsx';
import profileEditorCode from './demos/ProfileEditor.jsx?raw';
import ArrayState from './demos/ArrayState.jsx';
import arrayStateCode from './demos/ArrayState.jsx?raw';
import EventsPlayground from './demos/EventsPlayground.jsx';
import eventsPlaygroundCode from './demos/EventsPlayground.jsx?raw';
import EventPropagation from './demos/EventPropagation.jsx';
import eventPropagationCode from './demos/EventPropagation.jsx?raw';
import PreventDefault from './demos/PreventDefault.jsx';
import preventDefaultCode from './demos/PreventDefault.jsx?raw';
import TextMirror from './demos/TextMirror.jsx';
import textMirrorCode from './demos/TextMirror.jsx?raw';
import TemperatureConverter from './demos/TemperatureConverter.jsx';
import temperatureConverterCode from './demos/TemperatureConverter.jsx?raw';
import TodoApp from './demos/TodoApp.jsx';
import todoAppCode from './demos/TodoApp.jsx?raw';
import todoReducerCode from './demos/todoReducer.js?raw';
import StateSnapshot from './demos/StateSnapshot.jsx';
import stateSnapshotCode from './demos/StateSnapshot.jsx?raw';
import './state.css';

export default function StatePage() {
  return (
    <>
      <PageHeader
        eyebrow="React Fundamentals"
        title="State & Events"
        intro="State is a component's memory: data that changes while the app is running. Events (clicks, key presses, typing) call your handlers, the handlers update state, and React re-renders the UI to match. That State → View → Event loop is the heart of every React app."
        concepts={['useState', 'setState', 'updater function', 'immutable updates', 'event handlers', 'controlled inputs', 'lifting state up', 'useReducer']}
        docs={[
          { label: 'State: a component’s memory', href: 'https://react.dev/learn/state-a-components-memory' },
          { label: 'Responding to events', href: 'https://react.dev/learn/responding-to-events' },
          { label: 'Updating objects in state', href: 'https://react.dev/learn/updating-objects-in-state' },
          { label: 'useReducer', href: 'https://react.dev/reference/react/useReducer' },
          { label: 'MDN: Event reference', href: 'https://developer.mozilla.org/en-US/docs/Web/Events' },
        ]}
      />

      <SectionTitle
        title="useState basics"
        intro="useState returns a pair: the current value and a setter. Calling the setter stores a new value and schedules a re-render – that is the only way to make React update the screen."
      />
      <DemoCard
        title="Counter with step, limits and reset"
        description="Two pieces of state (count and step) plus values derived from them. The buttons disable themselves at the limits."
        concepts={['useState', 'onClick', 'disabled', 'derived values', '<output>', '<meter>']}
        code={counterCode}
        filename="Counter.jsx"
      >
        <Counter />
      </DemoCard>

      <DemoCard
        title="+3: setCount(count + 1) vs setCount(c => c + 1)"
        description="Both buttons call the setter three times. Only one of them actually adds 3 – the log explains what React queued."
        concepts={['state snapshot', 'updater function', 'update queue']}
        code={updaterPitfallCode}
        filename="UpdaterPitfall.jsx"
      >
        <UpdaterPitfall />
      </DemoCard>

      <DemoCard
        title="Booleans: show/hide, like, read more"
        description="Three everyday widgets, each driven by a single true/false value. Each is its own component, so each keeps its own state."
        concepts={['boolean state', 'toggle', 'aria-pressed', 'aria-expanded', 'isolated state']}
        code={booleanTogglesCode}
        filename="BooleanToggles.jsx"
      >
        <BooleanToggles />
      </DemoCard>

      <SectionTitle
        title="Objects & arrays in state"
        intro="Treat state as read-only. To change an object or array, create a new one (spread, map, filter) and pass it to the setter. React compares the old and new reference to decide whether anything changed."
      />
      <DemoCard
        title="Editing an object: a student profile"
        description="One change handler updates any field using the input's name attribute. The nested address object is copied level by level."
        concepts={['{ ...spread }', '[name]: value', 'nested objects', 'checkbox checked']}
        code={profileEditorCode}
        filename="ProfileEditor.jsx"
      >
        <ProfileEditor />
      </DemoCard>

      <DemoCard
        title="Editing an array: a study plan"
        description="Add, tick, delete and re-order tasks – every action builds a new array. Then press the red button, which mutates the array directly, and see why that is a bug."
        concepts={['[...array, item]', 'filter()', 'map()', 'swap in a copy', 'mutation bug']}
        code={arrayStateCode}
        filename="ArrayState.jsx"
      >
        <ArrayState />
      </DemoCard>

      <Callout type="warning" title="Why doesn't mutating state re-render?">
        <p>
          When you call <code>setTasks(tasks)</code>, React compares the new value with the old one using{' '}
          <code>Object.is</code>. After <code>tasks.push(…)</code> it is still <em>the same array</em>, so React
          decides nothing changed and skips the render. Your data changed, the screen didn’t – and the next unrelated
          update will suddenly reveal it. Always create a new array or object: <code>[...tasks, item]</code>,{' '}
          <code>tasks.filter(…)</code>, <code>tasks.map(…)</code>, <code>{'{ ...profile, name }'}</code>. Watch out
          for the mutating methods <code>push</code>, <code>pop</code>, <code>splice</code>, <code>sort</code> and{' '}
          <code>reverse</code> – copy first (<code>[...tasks].sort()</code>) or use <code>toSorted()</code>.
        </p>
      </Callout>

      <SectionTitle
        title="Handling events"
        intro="Pass a function to an event prop such as onClick or onKeyDown. React calls it with an event object that works the same in every browser."
      />
      <DemoCard
        title="Events playground"
        description="Click, double-click, right-click, move the mouse, type, focus, copy, paste and scroll – every handler writes into the log (newest first, 12 entries max)."
        concepts={['onClick', 'onDoubleClick', 'onContextMenu', 'onMouseMove', 'onKeyDown', 'onFocus/onBlur', 'onCopy/onPaste', 'onScroll']}
        code={eventsPlaygroundCode}
        filename="EventsPlayground.jsx"
      >
        <EventsPlayground />
      </DemoCard>

      <Callout type="tip" title="onClick={handleClick} – not onClick={handleClick()}">
        <p>
          Pass the function, don’t call it. <code>onClick={'{handleClick()}'}</code> runs <em>during rendering</em>{' '}
          (and a setter inside it causes an endless loop). To pass an argument, wrap it in an arrow function:{' '}
          <code>onClick={'{() => handleDelete(task.id)}'}</code>.
        </p>
      </Callout>

      <DemoCard
        title="Event propagation: bubbling & stopPropagation"
        description="Click the inner button and read the order in which the handlers ran. Then tick a stopPropagation box, or switch on the capture phase, and click again."
        concepts={['bubbling', 'e.stopPropagation()', 'e.target vs e.currentTarget', 'onClickCapture']}
        code={eventPropagationCode}
        filename="EventPropagation.jsx"
      >
        <EventPropagation />
      </DemoCard>

      <DemoCard
        title="preventDefault: links, forms and keys"
        description="Cancel what the browser would normally do: follow a link, reload the page on submit, or type a character."
        concepts={['e.preventDefault()', 'onSubmit', 'FormData', 'onKeyDown']}
        code={preventDefaultCode}
        filename="PreventDefault.jsx"
      >
        <PreventDefault />
      </DemoCard>

      <SectionTitle
        title="Controlled inputs & lifting state up"
        intro="When React state drives an input's value, the input is 'controlled': React is the single source of truth. When two components need the same data, move the state up to their closest common parent."
      />
      <DemoCard
        title="Controlled textarea: live mirror"
        description="Type in the box. Counts, previews and the length warning are all calculated from one piece of state during rendering."
        concepts={['value + onChange', 'derived state', 'aria-invalid', 'maximum length']}
        code={textMirrorCode}
        filename="TextMirror.jsx"
      >
        <TextMirror />
      </DemoCard>

      <DemoCard
        title="Lifting state up: temperature converter"
        description="Type in either box – the other updates. The two inputs are siblings with no state of their own; the parent owns the value and passes it down, and the children report changes back up."
        concepts={['lifting state up', 'single source of truth', 'controlled components', 'callback props']}
        code={temperatureConverterCode}
        filename="TemperatureConverter.jsx"
      >
        <TemperatureConverter />
      </DemoCard>

      <SectionTitle
        title="useReducer"
        intro="When a piece of state can change in many different ways, collect all the update logic into a reducer function. Components dispatch actions that describe what happened; the reducer returns the next state."
      />
      <DemoCard
        title="Todo list with useReducer"
        description="Add, tick, edit (double-click or pencil), delete, filter and clear completed. Each interaction dispatches an action – watch them appear on the right."
        concepts={['useReducer', 'dispatch', 'action.type', 'switch', 'pure reducer', 'inline editing']}
        files={[
          { name: 'TodoApp.jsx', code: todoAppCode },
          { name: 'todoReducer.js', code: todoReducerCode },
        ]}
      >
        <TodoApp />
      </DemoCard>

      <SectionTitle
        title="State is a snapshot"
        intro="The state variable in your handler never changes while the handler is running. React batches the updates and gives you the new value in the next render."
      />
      <DemoCard
        title="Reading state right after setting it"
        description="Each button logs what the handler sees immediately after calling the setter. Try 'Read count in 3 s' and then click '+1' quickly a few times."
        concepts={['snapshot', 'batching', 'closures', 'setTimeout']}
        code={stateSnapshotCode}
        filename="StateSnapshot.jsx"
      >
        <StateSnapshot />
      </DemoCard>

      <Callout type="note" title="useState or useReducer?">
        <p>
          Start with <code>useState</code>. Switch to <code>useReducer</code> when several state values change
          together, when the next state depends on the previous one in complicated ways, or when the same update is
          triggered from many places. Both work the same way underneath – a reducer is just a more organised setter.
        </p>
      </Callout>

      <Callout type="exercise">
        <ol>
          <li>
            In <code>Counter.jsx</code>, add a “Double” button that multiplies the count by 2 (respecting the maximum)
            using an updater function.
          </li>
          <li>
            In <code>ArrayState.jsx</code>, add a “Sort A–Z” button. Make sure you sort a <em>copy</em> of the array,
            not the state itself.
          </li>
          <li>
            In <code>todoReducer.js</code>, add a <code>'toggled_all'</code> action that marks every todo done (or
            undone), then dispatch it from a new button in <code>TodoApp.jsx</code>.
          </li>
          <li>
            Extend <code>TemperatureConverter.jsx</code> with a third input for Kelvin (K = °C + 273.15). Notice that
            almost all of the work happens in the parent – the child component barely changes.
          </li>
          <li>
            In <code>EventsPlayground.jsx</code>, log <code>onWheel</code> events on the mouse area, showing{' '}
            <code>event.deltaY</code>. Why might you not want to log every single one?
          </li>
        </ol>
      </Callout>
    </>
  );
}
