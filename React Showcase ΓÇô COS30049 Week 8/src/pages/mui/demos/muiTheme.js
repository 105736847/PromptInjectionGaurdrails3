/**
 * muiTheme.js – one function that builds the MUI theme for light or dark mode.
 *
 * createTheme() fills in everything we don't specify (spacing, shadows,
 * breakpoints, typography sizes…) with MUI's defaults. We only change a few
 * values so MUI's components match the colours of the rest of this app.
 */
import { createTheme } from '@mui/material/styles';

export function createShowcaseTheme(mode) {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode, // 'light' | 'dark' – MUI adjusts text, dividers, hovers… automatically
      primary: { main: isDark ? '#8b85ff' : '#4f46e5' },
      // Same surface colours as the app's CSS variables (index.css)
      background: {
        default: isDark ? '#0f1218' : '#f6f7fb',
        paper: isDark ? '#171b24' : '#ffffff',
      },
    },
    shape: { borderRadius: 10 }, // theme.shape.borderRadius – sx={{ borderRadius: 2 }} means 2 × 10px
    typography: {
      fontFamily: 'inherit', // use the app's font instead of Roboto
    },
  });
}
