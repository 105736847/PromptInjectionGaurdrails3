/**
 * MuiTypography – one component for all text. `variant` picks the style,
 * `component` picks the HTML element. Keep them separate: a heading can LOOK
 * like h5 but still be an <h3> for a correct document outline.
 */
import { Stack, Typography } from '@mui/material';

const VARIANTS = ['h4', 'h5', 'h6', 'subtitle1', 'subtitle2', 'body1', 'body2', 'caption', 'overline', 'button'];

export default function MuiTypography() {
  return (
    <Stack spacing={1.5}>
      {VARIANTS.map((variant) => (
        <Stack key={variant} direction="row" spacing={2} sx={{ alignItems: 'baseline' }}>
          <Typography variant="caption" sx={{ width: 80, flexShrink: 0, color: 'text.secondary', fontFamily: 'monospace' }}>
            {variant}
          </Typography>
          {/* component="p" keeps these samples out of the page's heading outline */}
          <Typography variant={variant} component="p">
            Computing Technology Innovation Project
          </Typography>
        </Stack>
      ))}
      <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
        noWrap cuts long text with an ellipsis instead of wrapping it onto the next line – try making the window
        narrower to see this sentence being shortened.
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        (h1–h3 exist too, but they are 6rem, 3.75rem and 3rem tall – too big for this box.)
      </Typography>
    </Stack>
  );
}
