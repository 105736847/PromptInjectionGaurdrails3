import { Link } from 'react-router-dom';

import PageHeader from '../../components/common/PageHeader.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';

import controlsCode from './demos/Controls.jsx?raw';
import controlsCss from './demos/Controls.css?raw';
import FlexPlayground from './demos/FlexPlayground.jsx';
import flexPlaygroundCode from './demos/FlexPlayground.jsx?raw';
import flexPlaygroundCss from './demos/FlexPlayground.css?raw';
import FlexItemEditor from './demos/FlexItemEditor.jsx';
import flexItemEditorCode from './demos/FlexItemEditor.jsx?raw';
import flexItemEditorCss from './demos/FlexItemEditor.css?raw';
import GridPlayground from './demos/GridPlayground.jsx';
import gridPlaygroundCode from './demos/GridPlayground.jsx?raw';
import gridPlaygroundCss from './demos/GridPlayground.css?raw';
import AutoFitVsFill from './demos/AutoFitVsFill.jsx';
import autoFitVsFillCode from './demos/AutoFitVsFill.jsx?raw';
import autoFitVsFillCss from './demos/AutoFitVsFill.css?raw';
import GridAreas from './demos/GridAreas.jsx';
import gridAreasCode from './demos/GridAreas.jsx?raw';
import gridAreasCss from './demos/GridAreas.css?raw';
import Breakpoints from './demos/Breakpoints.jsx';
import breakpointsCode from './demos/Breakpoints.jsx?raw';
import breakpointsCss from './demos/Breakpoints.css?raw';
import MediaQueryHook from './demos/MediaQueryHook.jsx';
import mediaQueryHookCode from './demos/MediaQueryHook.jsx?raw';
import useMediaQueryCode from './demos/useMediaQuery.js?raw';
import ContainerQueries from './demos/ContainerQueries.jsx';
import containerQueriesCode from './demos/ContainerQueries.jsx?raw';
import containerQueriesCss from './demos/ContainerQueries.css?raw';
import Positioning from './demos/Positioning.jsx';
import positioningCode from './demos/Positioning.jsx?raw';
import positioningCss from './demos/Positioning.css?raw';
import ZIndexStacking from './demos/ZIndexStacking.jsx';
import zIndexStackingCode from './demos/ZIndexStacking.jsx?raw';
import zIndexStackingCss from './demos/ZIndexStacking.css?raw';
import BoxModel from './demos/BoxModel.jsx';
import boxModelCode from './demos/BoxModel.jsx?raw';
import boxModelCss from './demos/BoxModel.css?raw';
import PatternGallery from './demos/PatternGallery.jsx';
import patternGalleryCode from './demos/PatternGallery.jsx?raw';
import patternGalleryCss from './demos/PatternGallery.css?raw';

export default function LayoutPage() {
  return (
    <>
      <PageHeader
        eyebrow="UI & Layout"
        title="Layout & Responsive"
        intro="Layout is where most front-end time goes. These playgrounds let you poke at Flexbox, CSS Grid, breakpoints, container queries and positioning, and every one of them prints the CSS it produces so you can copy it straight into your own project."
        concepts={['Flexbox', 'CSS Grid', 'grid-template-areas', 'media queries', 'breakpoints', 'container queries', 'position', 'box model']}
        docs={[
          { label: 'MDN: Flexbox', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox' },
          { label: 'MDN: CSS Grid', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Basic_concepts_of_grid_layout' },
          { label: 'MDN: Media queries', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries' },
          { label: 'MDN: Container queries', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries' },
        ]}
      />

      <SectionTitle
        title="Flexbox – one direction at a time"
        intro="A flex container lines its children up in a single row or column and shares out the free space. It is the everyday tool for navbars, toolbars, button rows and centring things."
      />
      <DemoCard
        title="Flexbox playground"
        description="Change the container properties and watch the items move. Try the presets, then copy the generated CSS."
        concepts={['display: flex', 'flex-direction', 'justify-content', 'align-items', 'flex-wrap', 'gap', 'style={{…}}']}
        files={[
          { name: 'FlexPlayground.jsx', code: flexPlaygroundCode },
          { name: 'FlexPlayground.css', code: flexPlaygroundCss },
          { name: 'Controls.jsx', code: controlsCode },
          { name: 'Controls.css', code: controlsCss },
        ]}
      >
        <FlexPlayground />
      </DemoCard>

      <Callout type="tip" title="Main axis vs. cross axis">
        <p>
          <code>justify-content</code> works along the <strong>main axis</strong> (the direction set by{' '}
          <code>flex-direction</code>); <code>align-items</code> works across it on the <strong>cross axis</strong>.
          Switch to <code>column</code> and the two properties swap what they do on screen. The small{' '}
          <code>Segmented</code> and <code>Slider</code> components used by every playground live in{' '}
          <code>Controls.jsx</code> – reusable components with props, just like your own should be.
        </p>
      </Callout>

      <DemoCard
        title="Flex item properties"
        description="Click an item to select it, then change how it grows, shrinks, where it starts (basis), its order and its own alignment. Narrow the container to see flex-shrink at work."
        concepts={['flex-grow', 'flex-shrink', 'flex-basis', 'order', 'align-self', 'immutable update']}
        files={[
          { name: 'FlexItemEditor.jsx', code: flexItemEditorCode },
          { name: 'FlexItemEditor.css', code: flexItemEditorCss },
        ]}
      >
        <FlexItemEditor />
      </DemoCard>

      <SectionTitle
        title="CSS Grid – rows and columns together"
        intro="Grid is two-dimensional: you define the tracks on the container and the items drop into the cells. It shines for card galleries, dashboards and whole-page layouts."
      />
      <DemoCard
        title="Grid playground"
        description="Pick a grid-template-columns preset or type your own (it is validated with CSS.supports). Click a cell to make it span several columns or rows."
        concepts={['display: grid', 'grid-template-columns', 'fr unit', 'repeat()', 'minmax()', 'span', 'grid-auto-flow: dense']}
        files={[
          { name: 'GridPlayground.jsx', code: gridPlaygroundCode },
          { name: 'GridPlayground.css', code: gridPlaygroundCss },
        ]}
      >
        <GridPlayground />
      </DemoCard>

      <DemoCard
        title="auto-fill vs. auto-fit"
        description="The one-line responsive grid. With fewer items than columns, auto-fill keeps the empty tracks (dashed) while auto-fit collapses them so the items stretch."
        concepts={['repeat(auto-fill, …)', 'repeat(auto-fit, …)', 'ResizeObserver', 'useRef', 'useEffect cleanup']}
        files={[
          { name: 'AutoFitVsFill.jsx', code: autoFitVsFillCode },
          { name: 'AutoFitVsFill.css', code: autoFitVsFillCss },
        ]}
      >
        <AutoFitVsFill />
      </DemoCard>

      <DemoCard
        title="Page layout with grid-template-areas"
        description="Draw the page with names, then assign each region to an area. Switch presets, and shrink the preview to see it collapse into a single column."
        concepts={['grid-template-areas', 'grid-area', 'CSS custom properties', '@container']}
        files={[
          { name: 'GridAreas.jsx', code: gridAreasCode },
          { name: 'GridAreas.css', code: gridAreasCss },
        ]}
      >
        <GridAreas />
      </DemoCard>

      <Callout type="note" title="Flexbox or Grid?">
        <p>
          <strong>Flexbox</strong> is content-first and one-dimensional: the items decide their sizes and wrap as
          needed. <strong>Grid</strong> is layout-first and two-dimensional: the container decides the tracks. Real
          pages use both – Grid for the page skeleton, Flexbox inside the components.
        </p>
      </Callout>

      <SectionTitle
        title="Responsive design"
        intro="One code base, every screen size. Media queries respond to the window, container queries respond to the space a component is given, and a hook lets JavaScript join in when the markup itself must change."
      />
      <DemoCard
        title="Breakpoints (MUI names)"
        description="Resize your browser window. The ruler is drawn by React from useWindowSize(); the card grid and the badges below it change with CSS media queries only."
        concepts={['useWindowSize', '@media (min-width)', 'mobile-first', 'xs sm md lg xl']}
        files={[
          { name: 'Breakpoints.jsx', code: breakpointsCode },
          { name: 'Breakpoints.css', code: breakpointsCss },
        ]}
      >
        <Breakpoints />
      </DemoCard>

      <DemoCard
        title="A custom useMediaQuery hook"
        description="window.matchMedia() is the JavaScript version of @media. The hook re-renders only when the answer flips – and it can check things a width never tells you, like dark mode or a touch screen."
        concepts={['custom hook', 'window.matchMedia', 'change event', 'useEffect cleanup', 'rules of hooks']}
        files={[
          { name: 'MediaQueryHook.jsx', code: mediaQueryHookCode },
          { name: 'useMediaQuery.js', code: useMediaQueryCode },
        ]}
      >
        <MediaQueryHook />
      </DemoCard>

      <Callout type="tip" title="Think mobile-first">
        <p>
          Write the base styles for the smallest screen, then add <code>@media (min-width: …)</code> rules as space
          grows – exactly what <code>Breakpoints.css</code> does. And keep{' '}
          <code>{'<meta name="viewport" content="width=device-width, initial-scale=1">'}</code> in{' '}
          <code>index.html</code>, otherwise phones pretend to be 980px wide and your media queries never fire. MUI
          uses the same breakpoint names in its <code>Grid</code> and <code>sx</code> prop – see the{' '}
          <Link to="/mui">Material UI page</Link>.
        </p>
      </Callout>

      <DemoCard
        title="Container queries"
        description="The profile card switches between three layouts based on the width of its container, not the window. Drag the handle in the corner of the dashed box."
        concepts={['container-type', '@container', 'resize: horizontal', 'ResizeObserver', 'content: via CSS']}
        files={[
          { name: 'ContainerQueries.jsx', code: containerQueriesCode },
          { name: 'ContainerQueries.css', code: containerQueriesCss },
        ]}
      >
        <ContainerQueries />
      </DemoCard>

      <SectionTitle
        title="Positioning & stacking"
        intro="Sometimes an element has to break out of the normal flow: a badge on an avatar, a sticky table header, a dropdown menu or a modal."
      />
      <DemoCard
        title="The position property"
        description="Choose a value and move the offsets, then scroll inside the mini viewport. The coloured alert tells you whether the box still takes up space."
        concepts={['static', 'relative', 'absolute', 'fixed', 'sticky', 'containing block']}
        files={[
          { name: 'Positioning.jsx', code: positioningCode },
          { name: 'Positioning.css', code: positioningCss },
        ]}
      >
        <Positioning />
      </DemoCard>

      <DemoCard
        title="z-index and stacking contexts"
        description="Change the numbers to reorder the cards. Then trap card C inside a parent with its own z-index and try to rescue it with 999."
        concepts={['z-index', 'stacking context', 'position: absolute', 'controlled number input']}
        files={[
          { name: 'ZIndexStacking.jsx', code: zIndexStackingCode },
          { name: 'ZIndexStacking.css', code: zIndexStackingCss },
        ]}
      >
        <ZIndexStacking />
      </DemoCard>

      <SectionTitle
        title="The box model"
        intro="Every element is a rectangle made of content, padding, border and margin. Knowing how they add up explains most “why is this 20px too wide?” bugs."
      />
      <DemoCard
        title="Box model visualiser"
        description="Move the sliders and compare the DevTools-style diagram with the real element. Flip box-sizing to see why most projects switch to border-box."
        concepts={['margin', 'border', 'padding', 'box-sizing', 'derived values', 'ResizeObserver']}
        files={[
          { name: 'BoxModel.jsx', code: boxModelCode },
          { name: 'BoxModel.css', code: boxModelCss },
        ]}
      >
        <BoxModel />
      </DemoCard>

      <SectionTitle
        title="Common layout patterns"
        intro="A small cookbook. Each tile is a pattern you will need in Assignment 3, with the handful of CSS lines that make it work."
      />
      <DemoCard
        title="Pattern gallery"
        description="Centring three ways, pushing an item to the end, a sidebar that wraps without media queries, sticky headers, masonry-style columns and aspect-ratio boxes."
        concepts={['place-items', 'margin-left: auto', 'flex-wrap', 'position: sticky', 'columns', 'aspect-ratio']}
        files={[
          { name: 'PatternGallery.jsx', code: patternGalleryCode },
          { name: 'PatternGallery.css', code: patternGalleryCss },
        ]}
      >
        <PatternGallery />
      </DemoCard>

      <Callout type="exercise">
        <ol>
          <li>
            In <code>FlexPlayground.jsx</code>, add a <strong>“Footer links”</strong> preset to <code>PRESETS</code>{' '}
            (wrapping, centred, 16px gap) and check that the generated CSS updates.
          </li>
          <li>
            In <code>GridAreas.jsx</code>, add a fourth <strong>“Dashboard”</strong> preset where{' '}
            <code>main</code> spans two columns and <code>aside</code> sits under the sidebar.
          </li>
          <li>
            In <code>Breakpoints.css</code>, show only two columns at <code>md</code> and add a{' '}
            <code>.layout-bp-down-sm</code> class that is visible <em>below</em> 600px only (hint:{' '}
            <code>max-width: 599.98px</code>).
          </li>
          <li>
            In <code>ContainerQueries.css</code>, add a fourth layout for containers wider than 800px that shows the
            stats in a single row next to the buttons.
          </li>
          <li>
            In <code>BoxModel.jsx</code>, add a <strong>height</strong> slider and extend the output to calculate the
            total height as well.
          </li>
        </ol>
      </Callout>
    </>
  );
}
