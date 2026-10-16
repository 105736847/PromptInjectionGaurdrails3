import PageHeader from '../../components/common/PageHeader.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';

import ModalExamples from './demos/ModalExamples.jsx';
import modalExamplesCode from './demos/ModalExamples.jsx?raw';
import modalCode from './demos/Modal.jsx?raw';
import modalCss from './demos/Modal.module.css?raw';
import focusTrapCode from './demos/useFocusTrap.js?raw';
import ConfirmDelete from './demos/ConfirmDelete.jsx';
import confirmDeleteCode from './demos/ConfirmDelete.jsx?raw';
import useConfirmCode from './demos/useConfirm.jsx?raw';
import NativeDialog from './demos/NativeDialog.jsx';
import nativeDialogCode from './demos/NativeDialog.jsx?raw';
import nativeDialogCss from './demos/NativeDialog.module.css?raw';
import FilterDrawer from './demos/FilterDrawer.jsx';
import filterDrawerCode from './demos/FilterDrawer.jsx?raw';
import drawerCode from './demos/Drawer.jsx?raw';
import drawerCss from './demos/Drawer.module.css?raw';
import ToastPlayground from './demos/ToastPlayground.jsx';
import toastPlaygroundCode from './demos/ToastPlayground.jsx?raw';
import toastContextCode from '../../context/ToastContext.jsx?raw';
import UndoDelete from './demos/UndoDelete.jsx';
import undoDeleteCode from './demos/UndoDelete.jsx?raw';
import undoDeleteCss from './demos/UndoDelete.module.css?raw';
import Alerts from './demos/Alerts.jsx';
import alertsCode from './demos/Alerts.jsx?raw';
import alertsCss from './demos/Alerts.module.css?raw';
import Tooltips from './demos/Tooltips.jsx';
import tooltipsCode from './demos/Tooltips.jsx?raw';
import tooltipsCss from './demos/Tooltips.module.css?raw';
import Popover from './demos/Popover.jsx';
import popoverCode from './demos/Popover.jsx?raw';
import popoverCss from './demos/Popover.module.css?raw';
import CopyFields from './demos/CopyButton.jsx';
import copyButtonCode from './demos/CopyButton.jsx?raw';
import ContextMenu from './demos/ContextMenu.jsx';
import contextMenuCode from './demos/ContextMenu.jsx?raw';
import contextMenuCss from './demos/ContextMenu.module.css?raw';
import UploadProgress from './demos/UploadProgress.jsx';
import uploadProgressCode from './demos/UploadProgress.jsx?raw';
import EnrolmentProgress from './demos/EnrolmentProgress.jsx';
import enrolmentProgressCode from './demos/EnrolmentProgress.jsx?raw';
import progressCss from './demos/Progress.module.css?raw';
import DataStates from './demos/DataStates.jsx';
import dataStatesCode from './demos/DataStates.jsx?raw';
import dataStatesCss from './demos/DataStates.module.css?raw';
import BadgesAvatars from './demos/BadgesAvatars.jsx';
import badgesAvatarsCode from './demos/BadgesAvatars.jsx?raw';
import badgesAvatarsCss from './demos/BadgesAvatars.module.css?raw';
import RatingReactions from './demos/RatingReactions.jsx';
import ratingReactionsCode from './demos/RatingReactions.jsx?raw';
import ratingReactionsCss from './demos/RatingReactions.module.css?raw';

export default function FeedbackPage() {
  return (
    <>
      <PageHeader
        eyebrow="UI & Layout"
        title="Overlays & Feedback"
        intro="Dialogs, drawers, toasts, tooltips, progress bars and loading states – the pieces that tell people what is happening and ask them what to do next. All of them are built from scratch, so you can see exactly how focus, timers and portals are handled."
        concepts={['createPortal', 'focus trap', 'useRef', 'useEffect cleanup', 'useLayoutEffect', 'async confirm()', 'useToast (context)', 'aria-live', 'timers', 'derived state']}
        docs={[
          { label: 'createPortal', href: 'https://react.dev/reference/react-dom/createPortal' },
          { label: 'useLayoutEffect', href: 'https://react.dev/reference/react/useLayoutEffect' },
          { label: '<dialog> (MDN)', href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog' },
          { label: 'ARIA live regions', href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions' },
          { label: 'Clipboard API', href: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API' },
        ]}
      />

      <SectionTitle
        title="Dialogs & drawers"
        intro="Overlays that sit on top of the page and take over keyboard focus until they are closed. Open each one and try it with only the keyboard: Tab, Shift+Tab, Enter and Esc."
      />
      <DemoCard
        title="Modal dialog (custom)"
        description="A reusable <Modal> rendered with createPortal. Focus moves into it and is trapped there, Esc or a click on the backdrop closes it, focus returns to the button you started from, and the page behind can't scroll."
        concepts={['createPortal', 'useFocusTrap', 'aria-modal', 'aria-labelledby', 'scroll lock', 'FormData', 'form="…" attribute']}
        files={[
          { name: 'ModalExamples.jsx', code: modalExamplesCode },
          { name: 'Modal.jsx', code: modalCode },
          { name: 'useFocusTrap.js', code: focusTrapCode },
          { name: 'Modal.module.css', code: modalCss },
        ]}
      >
        <ModalExamples />
      </DemoCard>

      <DemoCard
        title="Async confirm() dialog"
        description="Delete a submission: the code simply writes `if (await confirm(…))`. The custom hook turns a dialog into a Promise. Compare it with the browser’s own window.confirm()."
        concepts={['custom hook', 'Promise', 'async / await', 'useRef', 'role="alertdialog"', 'safe default focus']}
        files={[
          { name: 'ConfirmDelete.jsx', code: confirmDeleteCode },
          { name: 'useConfirm.jsx', code: useConfirmCode },
        ]}
      >
        <ConfirmDelete />
      </DemoCard>

      <DemoCard
        title="Native <dialog> element"
        description="The browser’s built-in modal, opened with ref.current.showModal(). It gives you the backdrop, focus handling and Esc for free – see the comparison table."
        concepts={['useRef', 'showModal()', 'form method="dialog"', 'returnValue', '::backdrop', 'onClose']}
        files={[
          { name: 'NativeDialog.jsx', code: nativeDialogCode },
          { name: 'NativeDialog.module.css', code: nativeDialogCss },
        ]}
      >
        <NativeDialog />
      </DemoCard>

      <DemoCard
        title="Drawer (side sheet)"
        description="A filters panel that slides in from the right. The results update live while you change the filters, and the button shows how many filters are active."
        concepts={['createPortal', 'inert', 'CSS transitions', 'lifted state', 'derived counts']}
        files={[
          { name: 'FilterDrawer.jsx', code: filterDrawerCode },
          { name: 'Drawer.jsx', code: drawerCode },
          { name: 'Drawer.module.css', code: drawerCss },
          { name: 'useFocusTrap.js', code: focusTrapCode },
        ]}
      >
        <FilterDrawer />
      </DemoCard>

      <Callout type="tip" title="Portals keep React’s event rules">
        <p>
          <code>createPortal(child, document.body)</code> moves the <em>DOM</em> of the dialog to the end of{' '}
          <code>&lt;body&gt;</code>, but in React it is still a child of the component that rendered it. It can read
          the same context (e.g. <code>useToast()</code>), and its events bubble up through the <em>React</em> tree, not
          the DOM tree.
        </p>
      </Callout>

      <SectionTitle
        title="Notifications"
        intro="Messages that report what just happened. Choose the loudness to match the message: a toast for “saved”, an inline alert for something the user must act on."
      />
      <DemoCard
        title="Toast notifications"
        description="Every button calls showToast() from the app-wide ToastContext. Change the duration, make a toast sticky, or dismiss the last one from code."
        concepts={['useContext', 'custom hook useToast()', 'createPortal', 'aria-live', 'setTimeout']}
        files={[
          { name: 'ToastPlayground.jsx', code: toastPlaygroundCode },
          { name: 'ToastContext.jsx (shared)', code: toastContextCode },
        ]}
      >
        <ToastPlayground />
      </DemoCard>

      <DemoCard
        title="Delete with Undo"
        description="Delete a note: it disappears at once and a snackbar offers Undo for 5 seconds. Only when the time runs out does the delete become final."
        concepts={['optimistic UI', 'setTimeout in useEffect', 'cleanup cancels the timer', 'slice() to re-insert', 'key restarts animation']}
        files={[
          { name: 'UndoDelete.jsx', code: undoDeleteCode },
          { name: 'UndoDelete.module.css', code: undoDeleteCss },
        ]}
      >
        <UndoDelete />
      </DemoCard>

      <DemoCard
        title="Alerts & banners"
        description="Four alert variants built from the global .alert classes – dismissible, one with action buttons – and a sticky announcement banner inside a scrolling box."
        concepts={['conditional rendering', 'array of dismissed ids', 'role="alert"', 'position: sticky']}
        files={[
          { name: 'Alerts.jsx', code: alertsCode },
          { name: 'Alerts.module.css', code: alertsCss },
        ]}
      >
        <Alerts />
      </DemoCard>

      <Callout type="warning" title="Don’t shout with role=&quot;alert&quot;">
        <p>
          <code>role=&quot;alert&quot;</code> interrupts whatever a screen reader is saying. Keep it for urgent problems
          (a failed payment, a lost connection). For “Saved” or “3 results found” use{' '}
          <code>role=&quot;status&quot;</code> / <code>aria-live=&quot;polite&quot;</code>, which waits for a pause.
        </p>
      </Callout>

      <SectionTitle
        title="Hints, popovers & menus"
        intro="Small overlays attached to one element. They must open and close with the keyboard too – hover alone is never enough."
      />
      <DemoCard
        title="Tooltips and popover"
        description="Hover or Tab to the buttons to see tooltips on all four sides (Esc hides them); on a narrow screen they flip or slide so they are never cut off. The “Your tutor” popover opens on click and can contain links and buttons."
        concepts={['aria-describedby', 'role="tooltip"', 'render prop', 'onFocus / onBlur', 'getBoundingClientRect', 'click outside', 'aria-expanded']}
        files={[
          { name: 'Tooltips.jsx', code: tooltipsCode },
          { name: 'Popover.jsx', code: popoverCode },
          { name: 'Tooltips.module.css', code: tooltipsCss },
          { name: 'Popover.module.css', code: popoverCss },
        ]}
      >
        <div className="stack-lg">
          <Tooltips />
          <Popover />
        </div>
      </DemoCard>

      <DemoCard
        title="Copy to clipboard & context menu"
        description="Copy buttons give instant “Copied!” feedback. Right-click the file card for a custom context menu that opens at the cursor and closes on outside click, Esc or scroll."
        concepts={['navigator.clipboard', 'async / await', 'onContextMenu', 'useLayoutEffect', 'position: fixed', 'window listeners']}
        files={[
          { name: 'CopyButton.jsx', code: copyButtonCode },
          { name: 'ContextMenu.jsx', code: contextMenuCode },
          { name: 'ContextMenu.module.css', code: contextMenuCss },
        ]}
      >
        <div className="stack-lg">
          <CopyFields />
          <ContextMenu />
        </div>
      </DemoCard>

      <SectionTitle
        title="Progress & loading"
        intro="When something takes time, show that it is happening – and, if you can, how far along it is."
      />
      <DemoCard
        title="Progress indicators"
        description="A simulated upload drives both a linear bar and an SVG ring (start, pause, reset). Below: an indeterminate bar, a multi-step checklist and a loading button that can't be double-clicked."
        concepts={['setInterval in useEffect', 'derived “finished”', 'role="progressbar"', 'SVG stroke-dashoffset', 'aria-busy', 'disabled']}
        files={[
          { name: 'UploadProgress.jsx', code: uploadProgressCode },
          { name: 'EnrolmentProgress.jsx', code: enrolmentProgressCode },
          { name: 'Progress.module.css', code: progressCss },
        ]}
      >
        <div className="stack-lg">
          <UploadProgress />
          <hr className="m-0" />
          <EnrolmentProgress />
        </div>
      </DemoCard>

      <DemoCard
        title="Loading, empty and error states"
        description="Pick what the next (fake) request should return, then watch: skeleton placeholders while loading, then the real content, an empty state or an error state with a retry button."
        concepts={['status state', 'Promise', 'ignore flag', 'skeleton', 'aria-busy', 'reusable EmptyState']}
        files={[
          { name: 'DataStates.jsx', code: dataStatesCode },
          { name: 'DataStates.module.css', code: dataStatesCss },
        ]}
      >
        <DataStates />
      </DemoCard>

      <Callout type="note" title="Skeleton or spinner?">
        <p>
          Use a <strong>skeleton</strong> when you know the shape of what is coming (a list of cards) – the page doesn’t
          jump when the data arrives. Use a <strong>spinner</strong> for short, shapeless waits, such as a button that
          is saving. For your Assignment 3 front-end, every call to your FastAPI back-end needs a loading, an error and
          (often) an empty state.
        </p>
      </Callout>

      <SectionTitle
        title="Badges, avatars & ratings"
        intro="Compact ways to show status and to let people give quick feedback."
      />
      <DemoCard
        title="Badges, avatars & chips"
        description="A notification badge capped at 99+, avatars with status dots and an initials fallback (one photo URL is deliberately broken), an avatar group with “+3”, and removable chips."
        concepts={['conditional rendering', 'onError fallback', 'slice()', 'filter()', 'aria-label']}
        files={[
          { name: 'BadgesAvatars.jsx', code: badgesAvatarsCode },
          { name: 'BadgesAvatars.module.css', code: badgesAvatarsCss },
        ]}
      >
        <BadgesAvatars />
      </DemoCard>

      <DemoCard
        title="Star rating & reactions"
        description="Hover the stars to preview, click to rate, or use ← → on the keyboard. Below it, read-only ratings with half stars. On the right, toggle reactions like on a forum post."
        concepts={['radio inputs', 'hover state', ':has()', 'clipping with overflow', 'aria-pressed', 'map() to update']}
        files={[
          { name: 'RatingReactions.jsx', code: ratingReactionsCode },
          { name: 'RatingReactions.module.css', code: ratingReactionsCss },
        ]}
      >
        <RatingReactions />
      </DemoCard>

      <Callout type="exercise">
        <ol>
          <li>
            In <code>ModalExamples.jsx</code>, add a third modal with a long list of unit rules so the body has to
            scroll. Check that only the dialog scrolls, not the page behind it.
          </li>
          <li>
            Extend <code>useConfirm.jsx</code> so <code>confirm()</code> can also ask for text – e.g. “Type DELETE to
            confirm” – and only enables the confirm button when the text matches.
          </li>
          <li>
            In <code>UndoDelete.jsx</code>, support deleting several notes quickly: keep a <em>list</em> of pending deletes,
            each with its own timer.
          </li>
          <li>
            In <code>DataStates.jsx</code>, replace <code>fakeFetch()</code> with a real request to{' '}
            <code style={{ overflowWrap: 'anywhere' }}>https://jsonplaceholder.typicode.com/posts?_limit=3</code> using the
            shared <code>useFetch</code> hook.
          </li>
          <li>
            In <code>ContextMenu.jsx</code>, make “Rename” open the custom <code>Modal</code> with a text field, and show
            the new file name on the card.
          </li>
        </ol>
      </Callout>
    </>
  );
}
