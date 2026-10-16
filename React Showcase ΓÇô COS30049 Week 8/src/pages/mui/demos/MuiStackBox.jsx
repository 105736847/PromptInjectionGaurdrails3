/**
 * MuiStackBox – layout helpers and the `sx` prop.
 *
 * - <Stack> lays children out in one direction with even spacing (flexbox).
 * - <Box> is a plain <div> that accepts `sx`.
 * - sx = CSS in JavaScript with superpowers: theme colours ('primary.main'),
 *   spacing units (p: 2 → 2 × 8px = 16px) and responsive objects
 *   ({ xs: …, md: … }) that turn into media queries.
 */
import { Box, Divider, Paper, Stack, Typography } from '@mui/material';

function Item({ children }) {
  return (
    <Paper variant="outlined" sx={{ px: 2, py: 1.5, textAlign: 'center', flex: 1 }}>
      {children}
    </Paper>
  );
}

export default function MuiStackBox() {
  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="subtitle2" gutterBottom>
          Stack: a column on phones, a row from sm up, with dividers
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1, sm: 2 }}
          divider={<Divider orientation="vertical" flexItem />}
        >
          <Item>Plan</Item>
          <Item>Build</Item>
          <Item>Test</Item>
        </Stack>
      </div>

      <div>
        <Typography variant="subtitle2" gutterBottom>
          Box + sx: padding, colours and font size change with the screen size
        </Typography>
        <Box
          sx={{
            p: { xs: 1.5, md: 3 }, // 12px on phones, 24px from md
            bgcolor: 'primary.main', // a colour from the theme
            color: 'primary.contrastText',
            borderRadius: 2, // 2 × theme.shape.borderRadius
            fontSize: { xs: '0.9rem', md: '1.1rem' },
            boxShadow: 2,
            '&:hover': { boxShadow: 6 }, // nested selectors work too
            transition: 'box-shadow 200ms',
          }}
        >
          I am a Box. Resize the window to see my padding and text size change.
        </Box>
      </div>

      <div>
        <Typography variant="subtitle2" gutterBottom>
          Box as a CSS Grid container
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
          {['Sidebar', 'Main content', 'Aside'].map((label) => (
            <Box key={label} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, textAlign: 'center' }}>
              {label}
            </Box>
          ))}
        </Box>
      </div>
    </Stack>
  );
}
