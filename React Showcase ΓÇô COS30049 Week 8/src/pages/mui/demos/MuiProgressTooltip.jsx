/**
 * MuiProgressTooltip – progress indicators and tooltips.
 *
 * - Determinate progress (you know how far along you are) takes a `value` 0–100.
 * - Indeterminate progress (you don't) just spins or slides.
 * - <Tooltip> wraps ONE child element and shows `title` on hover and focus.
 */
import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, IconButton, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import { CircleHelp, Upload } from 'lucide-react';

export default function MuiProgressTooltip() {
  const [progress, setProgress] = useState(null); // null = not uploading

  // A fake upload: +10% every 300 ms until 100%.
  useEffect(() => {
    if (progress === null || progress >= 100) return undefined;
    const timer = setTimeout(() => setProgress((p) => Math.min(100, p + 10)), 300);
    return () => clearTimeout(timer);
  }, [progress]);

  const uploading = progress !== null && progress < 100;

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<Upload size={18} />}
            onClick={() => setProgress(0)}
            disabled={uploading}
          >
            {progress === 100 ? 'Upload again' : 'Upload report'}
          </Button>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {progress === null ? 'No file uploaded yet' : `${progress}%${progress === 100 ? ' – done!' : ''}`}
          </Typography>
        </Stack>
        <LinearProgress variant="determinate" value={progress ?? 0} aria-label="Upload progress" />
      </Stack>

      <Stack direction="row" spacing={4} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <Stack spacing={1} sx={{ alignItems: 'center' }}>
          <CircularProgress aria-label="Loading" />
          <Typography variant="caption">Indeterminate</Typography>
        </Stack>
        {/* A circular progress with the value written in the middle */}
        <Stack spacing={1} sx={{ alignItems: 'center' }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress variant="determinate" value={progress ?? 0} aria-label="Upload progress" />
            <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{`${progress ?? 0}%`}</Typography>
            </Box>
          </Box>
          <Typography variant="caption">Determinate</Typography>
        </Stack>
        <Box sx={{ flex: '1 1 200px' }}>
          <LinearProgress aria-label="Loading" />
          <Typography variant="caption">Indeterminate linear</Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Tooltip title="Accepted formats: PDF or DOCX, up to 10 MB" arrow>
          <IconButton aria-label="Upload help">
            <CircleHelp size={20} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Tooltips can sit on any side" placement="right">
          <Button variant="outlined">Hover or focus me</Button>
        </Tooltip>
        {/* A disabled button fires no events, so wrap it in a <span> for the tooltip */}
        <Tooltip title="Submissions have closed">
          <span>
            <Button variant="contained" disabled>
              Submit
            </Button>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  );
}
