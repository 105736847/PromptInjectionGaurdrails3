/**
 * MuiGridBreakpoints – a responsive card grid with MUI's Grid.
 *
 * The Grid has 12 columns. `size={{ xs: 12, sm: 6, md: 4, lg: 3 }}` means:
 * full width on phones, 2 per row from 600px, 3 from 900px, 4 from 1200px.
 * useMediaQuery + theme.breakpoints tell us which breakpoint is active.
 * (Breakpoints use the WINDOW width – resize your browser to see it change.)
 */
import { Box, Chip, Grid, Paper, Stack, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const ITEMS = ['Lecture', 'Lab', 'Quiz', 'Assignment', 'Project', 'Exam', 'Workshop', 'Consultation'];

export default function MuiGridBreakpoints() {
  const theme = useTheme(); // MUI's theme (not the app's light/dark context)
  // Each call returns true/false and re-renders when the answer changes.
  // noSsr: this app only runs in the browser, so read the answer on the first render.
  const options = { noSsr: true };
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'), options);
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'), options);
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'), options);
  const isXlUp = useMediaQuery(theme.breakpoints.up('xl'), options);

  let active = 'xs';
  if (isXlUp) active = 'xl';
  else if (isLgUp) active = 'lg';
  else if (isMdUp) active = 'md';
  else if (isSmUp) active = 'sm';

  const perRow = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 }[active];

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        {theme.breakpoints.keys.map((key) => (
          <Chip
            key={key}
            label={`${key} ≥ ${theme.breakpoints.values[key]}px`}
            color={key === active ? 'primary' : 'default'}
            variant={key === active ? 'filled' : 'outlined'}
          />
        ))}
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Active: <strong>{active}</strong> → {perRow} per row
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        {ITEMS.map((item, index) => (
          <Grid key={item} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                Week {index + 1}
              </Typography>
              <Typography variant="subtitle1">{item}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* sx can also take breakpoint objects: this box is only shown from md up */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
        <Typography variant="body2">
          This hint only appears from md (900px) up: <code>{"sx={{ display: { xs: 'none', md: 'block' } }}"}</code>
        </Typography>
      </Box>
    </Stack>
  );
}
