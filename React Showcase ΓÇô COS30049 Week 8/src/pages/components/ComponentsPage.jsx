import PageHeader from '../../components/common/PageHeader.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';

import Tabs from './demos/Tabs.jsx';
import tabsCode from './demos/Tabs.jsx?raw';
import tabsCss from './demos/Tabs.module.css?raw';
import ResponsiveNavbar from './demos/ResponsiveNavbar.jsx';
import navbarCode from './demos/ResponsiveNavbar.jsx?raw';
import navbarCss from './demos/ResponsiveNavbar.module.css?raw';
import Breadcrumbs from './demos/Breadcrumbs.jsx';
import breadcrumbsCode from './demos/Breadcrumbs.jsx?raw';
import breadcrumbsCss from './demos/Breadcrumbs.module.css?raw';
import Pagination from './demos/Pagination.jsx';
import paginationCode from './demos/Pagination.jsx?raw';
import paginationCss from './demos/Pagination.module.css?raw';
import Accordion from './demos/Accordion.jsx';
import accordionCode from './demos/Accordion.jsx?raw';
import accordionCss from './demos/Accordion.module.css?raw';
import DropdownMenu from './demos/DropdownMenu.jsx';
import dropdownCode from './demos/DropdownMenu.jsx?raw';
import dropdownCss from './demos/DropdownMenu.module.css?raw';
import CustomSelect from './demos/CustomSelect.jsx';
import selectCode from './demos/CustomSelect.jsx?raw';
import selectCss from './demos/CustomSelect.module.css?raw';
import ToggleGroups from './demos/ToggleGroups.jsx';
import toggleCode from './demos/ToggleGroups.jsx?raw';
import toggleCss from './demos/ToggleGroups.module.css?raw';
import SubmitWizard from './demos/SubmitWizard.jsx';
import wizardCode from './demos/SubmitWizard.jsx?raw';
import wizardCss from './demos/SubmitWizard.module.css?raw';
import Carousel from './demos/Carousel.jsx';
import carouselCode from './demos/Carousel.jsx?raw';
import carouselCss from './demos/Carousel.module.css?raw';
import KanbanBoard from './demos/KanbanBoard.jsx';
import kanbanCode from './demos/KanbanBoard.jsx?raw';
import kanbanCss from './demos/KanbanBoard.module.css?raw';
import CalendarMonth from './demos/CalendarMonth.jsx';
import calendarCode from './demos/CalendarMonth.jsx?raw';
import calendarCss from './demos/CalendarMonth.module.css?raw';
import Timeline from './demos/Timeline.jsx';
import timelineCode from './demos/Timeline.jsx?raw';
import timelineCss from './demos/Timeline.module.css?raw';
import MasterDetail from './demos/MasterDetail.jsx';
import masterDetailCode from './demos/MasterDetail.jsx?raw';
import masterDetailCss from './demos/MasterDetail.module.css?raw';

export default function ComponentsPage() {
  return (
    <>
      <PageHeader
        eyebrow="UI & Layout"
        title="UI Components"
        intro="Tabs, menus, carousels, steppers, boards and calendars – the widgets you see on almost every website, each built from scratch with plain React, a CSS Module and no UI library. Every one of them works with the keyboard and a screen reader, not just the mouse."
        concepts={['WAI-ARIA roles', 'keyboard navigation', 'roving tabindex', 'controlled components', 'useRef', 'useEffect cleanup', 'derived state', 'CSS Modules', 'container queries', 'drag and drop']}
        docs={[
          { label: 'useRef', href: 'https://react.dev/reference/react/useRef' },
          { label: 'useId', href: 'https://react.dev/reference/react/useId' },
          { label: 'ARIA (MDN)', href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA' },
          { label: 'Keyboard-navigable widgets', href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets' },
          { label: 'Container queries', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries' },
        ]}
      />

      <Callout type="note" title="How these demos are styled">
        <p>
          Each widget has its own <strong>CSS Module</strong> (<code>Tabs.module.css</code>, …) – open the second
          file tab in the Code view. Vite renames the classes (<code>.tab</code> → <code>._tab_x7f2a</code>), so
          they can never clash with other pages. Notice how often the CSS styles an <em>ARIA attribute</em> such as{' '}
          <code>[aria-selected=&apos;true&apos;]</code>: the accessible state and the visual state can never disagree.
        </p>
      </Callout>

      <SectionTitle
        title="Navigation"
        intro="Components that help people find their way around: switching views, moving through pages and knowing where they are."
      />
      <DemoCard
        title="Tabs (horizontal and vertical)"
        description="Click a tab, or focus one and use ← → (↑ ↓ for the vertical tabs), Home and End. The parent component owns the active tab, so the button below the tabs can change it too."
        concepts={['role="tablist"', 'aria-selected', 'roving tabindex', 'controlled component', 'useId', 'ref callback']}
        files={[{ name: 'Tabs.jsx', code: tabsCode }, { name: 'Tabs.module.css', code: tabsCss }]}
      >
        <Tabs />
      </DemoCard>

      <DemoCard
        title="Responsive navbar with hamburger menu"
        description="Switch the preview to “Mobile”: the links collapse into a ☰ menu. The switch is a CSS container query on the frame, so it works on a wide screen too. Esc closes the open menu."
        concepts={['@container', 'aria-expanded', 'aria-controls', 'aria-current="page"', 'conditional rendering']}
        files={[{ name: 'ResponsiveNavbar.jsx', code: navbarCode }, { name: 'ResponsiveNavbar.module.css', code: navbarCss }]}
      >
        <ResponsiveNavbar />
      </DemoCard>

      <DemoCard
        title="Breadcrumbs"
        description="Open folders to go deeper, click a crumb to jump back up. The whole trail is rendered from one array in state."
        concepts={['array → JSX', 'slice()', 'aria-current', '<nav>', 'CSS ::before separators']}
        files={[{ name: 'Breadcrumbs.jsx', code: breadcrumbsCode }, { name: 'Breadcrumbs.module.css', code: breadcrumbsCss }]}
      >
        <Breadcrumbs />
      </DemoCard>

      <DemoCard
        title="Pagination"
        description="195 forum posts split into pages. Watch the ellipsis logic (1 … 4 5 6 … 20) as you move around, and change the page size."
        concepts={['derived state', 'slice()', 'pure helper function', 'aria-current="page"', '<ol start>']}
        files={[{ name: 'Pagination.jsx', code: paginationCode }, { name: 'Pagination.module.css', code: paginationCss }]}
      >
        <Pagination />
      </DemoCard>

      <SectionTitle
        title="Disclosure & menus"
        intro="Widgets that show and hide content. The hard parts are not the looks – they are focus management, closing at the right moment and cleaning up event listeners."
      />
      <DemoCard
        title="Accordion"
        description="An FAQ for the unit. Toggle the switch to allow several sections open at once. The height animation is pure CSS."
        concepts={['aria-expanded', 'aria-controls', 'array state', 'inert', 'grid-template-rows animation']}
        files={[{ name: 'Accordion.jsx', code: accordionCode }, { name: 'Accordion.module.css', code: accordionCss }]}
      >
        <Accordion />
      </DemoCard>

      <DemoCard
        title="Dropdown menu"
        description="Click the button or focus it and press ↓. Use ↑ ↓ Home End to move, Enter to choose, Esc to close (focus returns to the button). Clicking anywhere else closes it."
        concepts={['useRef', 'document listener', 'useEffect cleanup', 'focus management', 'role="menu"']}
        files={[{ name: 'DropdownMenu.jsx', code: dropdownCode }, { name: 'DropdownMenu.module.css', code: dropdownCss }]}
      >
        <DropdownMenu />
      </DemoCard>

      <DemoCard
        title="Custom select (listbox)"
        description="A styled replacement for <select>. Try the keyboard: ↓ to open, ↑ ↓ to move, type “t” to jump, Enter to pick, Esc to cancel. Full classes are disabled. The native element is shown for comparison."
        concepts={['role="combobox"', 'role="listbox"', 'aria-activedescendant', 'onBlur', 'type-ahead']}
        files={[{ name: 'CustomSelect.jsx', code: selectCode }, { name: 'CustomSelect.module.css', code: selectCss }]}
      >
        <CustomSelect />
      </DemoCard>

      <Callout type="warning" title="The first rule of ARIA: use native HTML when you can">
        <p>
          A native <code>&lt;select&gt;</code>, <code>&lt;details&gt;</code> or <code>&lt;dialog&gt;</code> comes with
          keyboard support, screen-reader support and mobile pickers for free. Build a custom widget only when the
          native one really cannot do the job – and then you are responsible for <em>all</em> of that behaviour, as the
          code above shows.
        </p>
      </Callout>

      <SectionTitle
        title="Choices & multi-step flows"
        intro="Letting people pick one option, several options, or walk through a longer task one step at a time."
      />
      <DemoCard
        title="Segmented control and filter chips"
        description="The segmented control (pick one) switches the layout; the chips (pick many) filter the unit list. The count updates automatically because it is derived from state."
        concepts={['radio inputs', 'aria-pressed', 'array state', 'filter()', 'derived state']}
        files={[{ name: 'ToggleGroups.jsx', code: toggleCode }, { name: 'ToggleGroups.module.css', code: toggleCss }]}
      >
        <ToggleGroups />
      </DemoCard>

      <DemoCard
        title="Stepper: submit an assignment"
        description="A four-step wizard with validation on every step. Try clicking Next with empty fields, then go Back – your answers are kept."
        concepts={['step state', 'object state', 'validation function', 'onSubmit', 'focus management', 'aria-current="step"']}
        files={[{ name: 'SubmitWizard.jsx', code: wizardCode }, { name: 'SubmitWizard.module.css', code: wizardCss }]}
      >
        <SubmitWizard />
      </DemoCard>

      <SectionTitle
        title="Rich interactive widgets"
        intro="Bigger components that combine state, effects, timers, pointer events and a fair amount of CSS."
      />
      <DemoCard
        title="Carousel"
        description="Use the arrows, the dots, ← → keys, or drag / swipe the image. Auto-play pauses while you hover or focus the carousel, and is turned off if your system asks for reduced motion."
        concepts={['setTimeout in useEffect', 'Pointer Events', 'setPointerCapture', 'matchMedia', 'prefers-reduced-motion', 'custom hook']}
        files={[{ name: 'Carousel.jsx', code: carouselCode }, { name: 'Carousel.module.css', code: carouselCss }]}
      >
        <Carousel />
      </DemoCard>

      <DemoCard
        title="Kanban board"
        description="Tasks for a group assignment. Drag cards between columns (or use the ← → buttons), add new tasks and delete finished ones. The counts are derived from the one cards array."
        concepts={['HTML5 drag and drop', 'dataTransfer', 'onDragOver', 'map() to update', 'keyboard alternative']}
        files={[{ name: 'KanbanBoard.jsx', code: kanbanCode }, { name: 'KanbanBoard.module.css', code: kanbanCss }]}
      >
        <KanbanBoard />
      </DemoCard>

      <DemoCard
        title="Calendar month view"
        description="Due dates are shown as coloured dots. Click a day (or use the arrow keys inside the grid) to see its events; move between months with the chevrons."
        concepts={['Date maths', 'toLocaleDateString', 'CSS Grid', 'roving tabindex', 'derived data']}
        files={[{ name: 'CalendarMonth.jsx', code: calendarCode }, { name: 'CalendarMonth.module.css', code: calendarCss }]}
      >
        <CalendarMonth />
      </DemoCard>

      <Callout type="tip" title="Dates are harder than they look">
        <p>
          <code>new Date().toISOString()</code> returns the date in <strong>UTC</strong>. In Melbourne (UTC+10/11) that
          is still “yesterday” until 10 or 11 am! When you need a local <code>YYYY-MM-DD</code> string, build it from{' '}
          <code>getFullYear()</code>, <code>getMonth()</code> and <code>getDate()</code> – as <code>CalendarMonth.jsx</code>{' '}
          does – or use <code>toLocaleDateString()</code> for display.
        </p>
      </Callout>

      <SectionTitle
        title="Structured content"
        intro="Two common ways to present a set of related items: in time order, or as a list with a detail view."
      />
      <DemoCard
        title="Timeline"
        description="Semester milestones. Whether a milestone is done, next or upcoming is worked out from today's date every time the component renders."
        concepts={['<ol>', '<time dateTime>', 'derived status', 'CSS pseudo-elements']}
        files={[{ name: 'Timeline.jsx', code: timelineCode }, { name: 'Timeline.module.css', code: timelineCss }]}
      >
        <Timeline />
      </DemoCard>

      <DemoCard
        title="Master–detail view"
        description="Select a student on the left to see their details on the right (↑ ↓ work in the list). Make the window narrow: only one pane is shown at a time, with a Back button."
        concepts={['store the id, not the object', 'find()', 'search filter', 'container query', '<dl>', '<meter>']}
        files={[{ name: 'MasterDetail.jsx', code: masterDetailCode }, { name: 'MasterDetail.module.css', code: masterDetailCss }]}
      >
        <MasterDetail />
      </DemoCard>

      <Callout type="exercise">
        <ol>
          <li>
            In <code>Tabs.jsx</code>, add a <code>disabled: true</code> option to a tab. Disabled tabs should be greyed
            out and skipped by the arrow keys.
          </li>
          <li>
            In <code>Pagination.jsx</code>, keep the current page in the URL (<code>?page=3</code>) with React
            Router’s <code>useSearchParams</code>, so a refresh or a shared link opens the same page.
          </li>
          <li>
            In <code>KanbanBoard.jsx</code>, replace <code>useState</code> with the shared <code>useLocalStorage</code>{' '}
            hook so the board survives a page refresh. Bonus: allow re-ordering cards inside a column.
          </li>
          <li>
            In <code>CalendarMonth.jsx</code>, move <code>EVENTS</code> into state and add a small form that creates an
            event on the selected day.
          </li>
          <li>
            In <code>SubmitWizard.jsx</code>, add a “Team members” step between Details and Upload that requires at
            least two names.
          </li>
        </ol>
      </Callout>
    </>
  );
}
