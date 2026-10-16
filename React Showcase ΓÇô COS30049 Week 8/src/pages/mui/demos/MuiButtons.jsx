/**
 * MuiButtons – MUI's <Button> comes in three variants, six colours and three
 * sizes, all chosen with props. Icons go in startIcon / endIcon.
 *
 * Material Icons are NOT installed in this project, so we pass lucide-react
 * icons instead – any React element works.
 */
import { useState } from 'react';
import { Button, ButtonGroup, IconButton, Stack, Typography } from '@mui/material';
import { Bold, Download, Heart, Italic, Send, Trash2, Underline } from 'lucide-react';

const COLORS = ['primary', 'secondary', 'success', 'error', 'warning', 'info'];

export default function MuiButtons() {
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(false);

  function handleSave() {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500); // pretend to talk to a server
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="overline">Variants</Typography>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Button variant="text">Text</Button>
          <Button variant="outlined">Outlined</Button>
          <Button variant="contained">Contained</Button>
          <Button variant="contained" disabled>
            Disabled
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="overline">Colours</Typography>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {COLORS.map((color) => (
            <Button key={color} variant="contained" color={color}>
              {color}
            </Button>
          ))}
        </Stack>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="overline">Sizes, icons and loading</Typography>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <Button size="small" variant="outlined">
            Small
          </Button>
          <Button size="medium" variant="outlined">
            Medium
          </Button>
          <Button size="large" variant="outlined">
            Large
          </Button>
          <Button variant="contained" startIcon={<Download size={18} />}>
            Download
          </Button>
          <Button variant="outlined" color="error" endIcon={<Trash2 size={18} />}>
            Delete
          </Button>
          {/* `loading` shows a spinner and disables the button */}
          <Button
            variant="contained"
            loading={loading}
            loadingPosition="start"
            startIcon={<Send size={18} />}
            onClick={handleSave}
          >
            {loading ? 'Saving…' : 'Save'}
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="overline">ButtonGroup and IconButton</Typography>
        <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <ButtonGroup variant="outlined" aria-label="Text formatting">
            <Button aria-label="Bold">
              <Bold size={18} />
            </Button>
            <Button aria-label="Italic">
              <Italic size={18} />
            </Button>
            <Button aria-label="Underline">
              <Underline size={18} />
            </Button>
          </ButtonGroup>
          {/* Icon-only buttons need an aria-label, otherwise screen readers just say "button" */}
          <IconButton
            aria-label={liked ? 'Unlike' : 'Like'}
            aria-pressed={liked}
            color={liked ? 'error' : 'default'}
            onClick={() => setLiked(!liked)}
          >
            <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
          </IconButton>
          <IconButton aria-label="Delete" color="error" size="small">
            <Trash2 size={18} />
          </IconButton>
        </Stack>
      </Stack>
    </Stack>
  );
}
