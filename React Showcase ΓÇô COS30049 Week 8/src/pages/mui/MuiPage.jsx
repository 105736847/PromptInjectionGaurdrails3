/**
 * MuiPage – everything on this page is wrapped in MUI's <ThemeProvider>, so
 * all MUI components below share one theme. The theme is rebuilt whenever the
 * app switches between light and dark mode (the moon/sun button in the header).
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';

import PageHeader from '../../components/common/PageHeader.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';
import CodeBlock from '../../components/common/CodeBlock.jsx';
// Renamed on import: MUI also exports a hook called useTheme.
import { useTheme as useAppTheme } from '../../context/ThemeContext.jsx';

import { createShowcaseTheme } from './demos/muiTheme.js';
import muiThemeCode from './demos/muiTheme.js?raw';
import MuiButtons from './demos/MuiButtons.jsx';
import muiButtonsCode from './demos/MuiButtons.jsx?raw';
import MuiTextFields from './demos/MuiTextFields.jsx';
import muiTextFieldsCode from './demos/MuiTextFields.jsx?raw';
import MuiSelectionControls from './demos/MuiSelectionControls.jsx';
import muiSelectionControlsCode from './demos/MuiSelectionControls.jsx?raw';
import MuiSignUpForm from './demos/MuiSignUpForm.jsx';
import muiSignUpFormCode from './demos/MuiSignUpForm.jsx?raw';
import MuiCards from './demos/MuiCards.jsx';
import muiCardsCode from './demos/MuiCards.jsx?raw';
import MuiGridBreakpoints from './demos/MuiGridBreakpoints.jsx';
import muiGridBreakpointsCode from './demos/MuiGridBreakpoints.jsx?raw';
import MuiStackBox from './demos/MuiStackBox.jsx';
import muiStackBoxCode from './demos/MuiStackBox.jsx?raw';
import MuiTypography from './demos/MuiTypography.jsx';
import muiTypographyCode from './demos/MuiTypography.jsx?raw';
import MuiFeedback from './demos/MuiFeedback.jsx';
import muiFeedbackCode from './demos/MuiFeedback.jsx?raw';
import MuiProgressTooltip from './demos/MuiProgressTooltip.jsx';
import muiProgressTooltipCode from './demos/MuiProgressTooltip.jsx?raw';
import MuiNavigation from './demos/MuiNavigation.jsx';
import muiNavigationCode from './demos/MuiNavigation.jsx?raw';
import MuiDataDisplay from './demos/MuiDataDisplay.jsx';
import muiDataDisplayCode from './demos/MuiDataDisplay.jsx?raw';
import MuiAppLayout from './demos/MuiAppLayout.jsx';
import muiAppLayoutCode from './demos/MuiAppLayout.jsx?raw';
import './mui.css';

const INSTALL = `# MUI and its styling engine (Emotion)
npm install @mui/material @emotion/react @emotion/styled

# Optional: Google's Material icons (this project uses lucide-react instead)
npm install @mui/icons-material`;

const PROVIDER = `import { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { useTheme as useAppTheme } from '../../context/ThemeContext.jsx'; // renamed!
import { createShowcaseTheme } from './demos/muiTheme.js';

export default function MuiPage() {
  const { theme: mode } = useAppTheme(); // 'light' | 'dark' from the header toggle
  // Only build a new theme object when the mode changes
  const muiTheme = useMemo(() => createShowcaseTheme(mode), [mode]);

  return <ThemeProvider theme={muiTheme}>{/* …all MUI demos… */}</ThemeProvider>;
}

// A whole app built with MUI usually wraps <App /> once, in main.jsx:
//   <ThemeProvider theme={theme}>
//     <CssBaseline />   ← resets the browser's default styles (margins, fonts…)
//     <App />
//   </ThemeProvider>`;

const COMPARISON = [
  ['Getting started', 'Slower – you design and build every widget', 'Fast – dozens of ready-made components'],
  ['Look & feel', 'Exactly your design', 'Material Design by default; a theme changes colours, shapes, fonts'],
  ['Accessibility', 'Your job: ARIA, focus, keyboard support', 'Mostly built in (dialogs trap focus, menus use arrow keys…)'],
  ['Download size', 'Only what you write', 'Bigger – but only imported components are bundled'],
  ['Learning', 'You learn HTML, CSS and React deeply', 'You also learn the library’s props and conventions'],
  ['Good for', 'Small projects, unique designs, learning', 'Dashboards, admin tools, forms, tight deadlines (e.g. Assignment 3)'],
];

export default function MuiPage() {
  const { theme: mode } = useAppTheme();
  const muiTheme = useMemo(() => createShowcaseTheme(mode), [mode]);

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="mui-page">
        <PageHeader
          eyebrow="Libraries"
          title="Material UI (MUI)"
          intro="You don’t have to build every button, dialog and date field yourself. A component library such as MUI gives you a complete, accessible, themeable set – you compose them with props. Everything on this page is a real MUI component that follows the app’s light/dark theme."
          concepts={['component library', 'ThemeProvider', 'createTheme', 'sx prop', 'Grid', 'breakpoints', 'useMediaQuery', 'slotProps']}
          docs={[
            { label: 'MUI: Getting started', href: 'https://mui.com/material-ui/getting-started/' },
            { label: 'MUI: All components', href: 'https://mui.com/material-ui/all-components/' },
            { label: 'MUI: The sx prop', href: 'https://mui.com/system/getting-started/the-sx-prop/' },
            { label: 'MUI: Breakpoints', href: 'https://mui.com/material-ui/customization/breakpoints/' },
          ]}
        />

        <SectionTitle
          title="Setting up MUI"
          intro="Install the packages, create a theme and wrap your components in a ThemeProvider. That’s all – then import components from @mui/material."
        />
        <div className="demo-card">
          <CodeBlock code={INSTALL} filename="Terminal" language="shell" />
        </div>
        <div className="grid-2 mui-setup">
          <div className="demo-card">
            <CodeBlock code={muiThemeCode} filename="demos/muiTheme.js" />
          </div>
          <div className="demo-card">
            <CodeBlock code={PROVIDER} filename="MuiPage.jsx (simplified)" />
          </div>
        </div>

        <Callout type="note" title="Why no <CssBaseline /> here?">
          <p>
            MUI’s <code>&lt;CssBaseline /&gt;</code> resets global styles – body background, fonts, margins – for the{' '}
            <em>whole document</em>. This showcase already has its own global stylesheet (<code>index.css</code>), and
            MUI only lives on this one page, so a global reset would restyle every other page too. Instead the theme
            copies the app’s colours (<code>palette.background</code>) and font (<code>fontFamily: &apos;inherit&apos;</code>).
            In an app built entirely with MUI, do add <code>&lt;CssBaseline /&gt;</code> once, next to your ThemeProvider.
          </p>
        </Callout>

        <SectionTitle title="Buttons" />
        <DemoCard
          title="Button, ButtonGroup and IconButton"
          description="Variants, colours, sizes, icons and a loading state – all controlled with props."
          concepts={['variant', 'color', 'size', 'startIcon', 'loading', 'aria-label']}
          code={muiButtonsCode}
          filename="MuiButtons.jsx"
        >
          <MuiButtons />
        </DemoCard>

        <SectionTitle
          title="Inputs and forms"
          intro="MUI inputs are still controlled components: you pass value and onChange exactly as with a plain <input>."
        />
        <DemoCard
          title="TextField, Select and Autocomplete"
          description="Three TextField variants, helper and error text, icons as adornments, a multiline field, two ways to build a select, and an autocomplete with single and multiple values."
          concepts={['TextField', 'helperText', 'error', 'slotProps', 'InputAdornment', 'Select', 'Autocomplete']}
          code={muiTextFieldsCode}
          filename="MuiTextFields.jsx"
        >
          <MuiTextFields />
        </DemoCard>

        <DemoCard
          title="Checkbox, Radio, Switch, Slider, Rating and ToggleButton"
          description="Every control updates state; the line at the bottom prints the current values."
          concepts={['FormControlLabel', 'RadioGroup', 'Switch', 'Slider', 'Rating', 'ToggleButtonGroup']}
          code={muiSelectionControlsCode}
          filename="MuiSelectionControls.jsx"
        >
          <MuiSelectionControls />
        </DemoCard>

        <DemoCard
          title="A sign-up form built with MUI"
          description="Validation messages appear after you leave a field or press Sign up. The button shows a spinner while “submitting”."
          concepts={['Grid', 'error + helperText', 'validation', 'touched state', 'Button loading']}
          code={muiSignUpFormCode}
          filename="MuiSignUpForm.jsx"
        >
          <MuiSignUpForm />
        </DemoCard>

        <SectionTitle
          title="Layout: Grid, breakpoints, Stack and Box"
          intro="MUI’s breakpoints are xs (0), sm (600px), md (900px), lg (1200px) and xl (1536px). Grid sizes, Stack directions and any sx value can change at each breakpoint."
        />
        <DemoCard
          title="Responsive Grid + the active breakpoint"
          description="Resize the browser window: the cards go from 1 to 2, 3 and 4 per row, and the highlighted chip shows the breakpoint reported by useMediaQuery."
          concepts={['Grid container', 'size={{ xs, sm, md, lg }}', 'spacing', 'useMediaQuery', 'theme.breakpoints']}
          code={muiGridBreakpointsCode}
          filename="MuiGridBreakpoints.jsx"
        >
          <MuiGridBreakpoints />
        </DemoCard>

        <DemoCard
          title="Stack, Box and the sx prop"
          description="Stack for one-direction layouts, Box + sx for everything else – with theme colours, spacing units and responsive values."
          concepts={['Stack', 'Box', 'sx', 'responsive values', 'theme spacing']}
          code={muiStackBoxCode}
          filename="MuiStackBox.jsx"
        >
          <MuiStackBox />
        </DemoCard>

        <DemoCard
          title="Typography"
          description="The same sentence in each Typography variant."
          concepts={['variant', 'component', 'noWrap', 'color']}
          code={muiTypographyCode}
          filename="MuiTypography.jsx"
        >
          <MuiTypography />
        </DemoCard>

        <DemoCard
          title="Cards"
          description="CardHeader, CardMedia, CardContent and CardActions combined into event cards. Try the bookmark button."
          concepts={['Card', 'CardHeader', 'CardMedia', 'CardActions', 'Chip']}
          code={muiCardsCode}
          filename="MuiCards.jsx"
        >
          <MuiCards />
        </DemoCard>

        <SectionTitle title="Feedback" />
        <DemoCard
          title="Alert, Snackbar and Dialog"
          description="Inline alerts, a snackbar that disappears by itself, and a confirmation dialog (try the keyboard: Tab stays inside, Escape closes)."
          concepts={['Alert', 'AlertTitle', 'Snackbar', 'Dialog', 'focus trap']}
          code={muiFeedbackCode}
          filename="MuiFeedback.jsx"
        >
          <MuiFeedback />
        </DemoCard>

        <DemoCard
          title="Progress indicators and Tooltip"
          description="Start the fake upload to see determinate progress; hover or focus the buttons for tooltips."
          concepts={['LinearProgress', 'CircularProgress', 'Tooltip', 'useEffect timer']}
          code={muiProgressTooltipCode}
          filename="MuiProgressTooltip.jsx"
        >
          <MuiProgressTooltip />
        </DemoCard>

        <SectionTitle title="Navigation and data display" />
        <DemoCard
          title="Tabs, Accordion and Stepper"
          description="Three ways to split content into parts. Tabs support the arrow keys; only one accordion panel is open at a time."
          concepts={['Tabs', 'Accordion', 'Stepper', 'controlled components']}
          code={muiNavigationCode}
          filename="MuiNavigation.jsx"
        >
          <MuiNavigation />
        </DemoCard>

        <DemoCard
          title="Chip, Avatar, Badge and Table"
          description="Click a campus chip to filter the table, delete skill chips, and sort the table by score."
          concepts={['Chip', 'AvatarGroup', 'Badge', 'Table', 'TableSortLabel']}
          code={muiDataDisplayCode}
          filename="MuiDataDisplay.jsx"
        >
          <MuiDataDisplay />
        </DemoCard>

        <DemoCard
          title="App shell: AppBar + Drawer"
          description="A typical layout for an ML dashboard – a top bar with a menu button that opens a navigation drawer. (Kept inside a box for this demo.)"
          concepts={['AppBar', 'Toolbar', 'Drawer', 'List', 'ListItemButton']}
          code={muiAppLayoutCode}
          filename="MuiAppLayout.jsx"
        >
          <MuiAppLayout />
        </DemoCard>

        <SectionTitle
          title="Build it yourself, or use a library?"
          intro="The UI Components page of this showcase builds tabs, accordions, dropdowns and more by hand. Compare that with MUI:"
        />
        <div className="table-wrap mui-compare">
          <table className="table">
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col">Build it yourself</th>
                <th scope="col">Component library (MUI)</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(([aspect, diy, library]) => (
                <tr key={aspect}>
                  <th scope="row">{aspect}</th>
                  <td>{diy}</td>
                  <td>{library}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Callout type="tip" title="Where to go next">
          <ul>
            <li>
              See the hand-made versions on the <Link to="/components">UI Components</Link> page – knowing how they
              work makes any library easier to use.
            </li>
            <li>
              Browse the <a href="https://mui.com/material-ui/getting-started/" target="_blank" rel="noreferrer">MUI documentation</a>:
              every component page has live examples you can copy, plus an API table of all props.
            </li>
            <li>
              Following an older tutorial? MUI v7+ renamed a few things: <code>Grid</code> uses{' '}
              <code>size=&#123;&#123; xs: 12 &#125;&#125;</code> (no <code>item</code>/<code>xs</code> props), inputs use{' '}
              <code>slotProps</code> instead of <code>InputProps</code>, and <code>Button</code> has a built-in{' '}
              <code>loading</code> prop.
            </li>
            <li>Pick ONE library per project – mixing two design systems looks messy and doubles the download.</li>
          </ul>
        </Callout>

        <Callout type="exercise">
          <ol>
            <li>
              In <code>muiTheme.js</code>, add a <code>secondary</code> colour and set{' '}
              <code>typography.button.textTransform</code> to <code>&apos;none&apos;</code>. Which demos change?
            </li>
            <li>
              In <code>MuiSignUpForm.jsx</code>, add a “Confirm password” field that must match the password.
            </li>
            <li>
              In <code>MuiGridBreakpoints.jsx</code>, change the Grid so it shows 2 cards per row on md and 6 per row
              on xl.
            </li>
            <li>
              Rebuild the prediction form from the Fetching Data page (<code>PredictForm.jsx</code>) with MUI:{' '}
              <code>TextField type=&quot;number&quot;</code>, a <code>Button</code> with <code>loading</code> and an{' '}
              <code>Alert</code> for errors.
            </li>
            <li>
              In <code>MuiAppLayout.jsx</code>, show the Drawer permanently on md screens and up (hint:{' '}
              <code>useMediaQuery</code> and <code>variant=&quot;permanent&quot;</code>).
            </li>
          </ol>
        </Callout>
      </div>
    </ThemeProvider>
  );
}
