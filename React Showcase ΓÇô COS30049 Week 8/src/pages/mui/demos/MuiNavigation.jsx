/**
 * MuiNavigation – Tabs, Accordion and Stepper.
 *
 * All three are controlled by state you own: the active tab, the expanded
 * panel, the current step. MUI takes care of the keyboard support and ARIA
 * attributes (role="tab", aria-expanded, …).
 */
import { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { BookOpen, ChevronDown, ClipboardList, MessageSquare } from 'lucide-react';

const TABS = [
  {
    label: 'Overview',
    icon: <BookOpen size={18} />,
    text: 'Build a full-stack app: a React front-end, a FastAPI back-end and a machine-learning model.',
  },
  {
    label: 'Assessment',
    icon: <ClipboardList size={18} />,
    text: 'Three assignments that build on each other – check the unit outline for the weightings.',
  },
  {
    label: 'Discussion',
    icon: <MessageSquare size={18} />,
    text: 'Ask questions in the unit forum – tutors usually reply within two working days.',
  },
];

const FAQ = [
  { q: 'Can I use MUI in Assignment 3?', a: 'Yes – any UI library is fine, as long as you understand the code you submit.' },
  { q: 'Do I need a database?', a: 'Only if your design needs one. A CSV file or SQLite is often enough.' },
  { q: 'How do I avoid CORS errors?', a: 'Add CORSMiddleware to FastAPI, or use the Vite proxy during development.' },
];

const STEPS = ['Choose a dataset', 'Train the model', 'Build the API', 'Build the front-end'];

export default function MuiNavigation() {
  const [tab, setTab] = useState(0);
  const [expanded, setExpanded] = useState(0); // index of the open panel, or false
  const [activeStep, setActiveStep] = useState(1);

  return (
    <Stack spacing={4}>
      {/* --- Tabs --- */}
      <Box>
        <Tabs
          value={tab}
          onChange={(event, newTab) => setTab(newTab)}
          variant="scrollable"
          aria-label="Unit information"
        >
          {TABS.map((t, i) => (
            <Tab
              key={t.label}
              label={t.label}
              icon={t.icon}
              iconPosition="start"
              id={`mui-tab-${i}`}
              aria-controls={`mui-tabpanel-${i}`}
            />
          ))}
        </Tabs>
        <Box
          role="tabpanel"
          id={`mui-tabpanel-${tab}`}
          aria-labelledby={`mui-tab-${tab}`}
          sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}
        >
          <Typography>{TABS[tab].text}</Typography>
        </Box>
      </Box>

      {/* --- Accordion: only one panel open at a time --- */}
      <div>
        {FAQ.map((item, i) => (
          <Accordion
            key={item.q}
            expanded={expanded === i}
            onChange={(event, isOpen) => setExpanded(isOpen ? i : false)}
            disableGutters
          >
            <AccordionSummary
              expandIcon={<ChevronDown size={18} />}
              aria-controls={`mui-faq-${i}`}
              id={`mui-faq-header-${i}`}
            >
              <Typography component="span" sx={{ fontWeight: 600 }}>
                {item.q}
              </Typography>
            </AccordionSummary>
            <AccordionDetails id={`mui-faq-${i}`}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {item.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </div>

      {/* --- Stepper --- */}
      <Stack spacing={2}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
          <Button disabled={activeStep === 0} onClick={() => setActiveStep((s) => s - 1)}>
            Back
          </Button>
          {activeStep < STEPS.length ? (
            <Button variant="contained" onClick={() => setActiveStep((s) => s + 1)}>
              {activeStep === STEPS.length - 1 ? 'Finish' : 'Next'}
            </Button>
          ) : (
            <Button variant="outlined" onClick={() => setActiveStep(0)}>
              Start over
            </Button>
          )}
        </Stack>
        {activeStep === STEPS.length && (
          <Typography sx={{ textAlign: 'center' }}>All steps done – time to submit! 🎉</Typography>
        )}
      </Stack>
    </Stack>
  );
}
