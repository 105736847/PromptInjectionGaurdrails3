/**
 * MuiSelectionControls – checkboxes, radios, switches, sliders, ratings and
 * toggle buttons. They are all controlled components: value + onChange.
 *
 * Note the MUI signature for many of them: onChange(event, newValue).
 */
import { useState } from 'react';
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Radio,
  RadioGroup,
  Rating,
  Slider,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { LayoutGrid, List, Table2 } from 'lucide-react';

const TOPICS = ['React', 'FastAPI', 'Machine learning'];

export default function MuiSelectionControls() {
  const [topics, setTopics] = useState(['React']);
  const [mode, setMode] = useState('on-campus');
  const [notifications, setNotifications] = useState(true);
  const [hours, setHours] = useState(10);
  const [rating, setRating] = useState(4);
  const [view, setView] = useState('grid');

  function toggleTopic(topic) {
    setTopics((current) => (current.includes(topic) ? current.filter((t) => t !== topic) : [...current, topic]));
  }

  return (
    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
      <FormControl component="fieldset">
        <FormLabel component="legend">Topics you enjoy</FormLabel>
        <FormGroup>
          {TOPICS.map((topic) => (
            <FormControlLabel
              key={topic}
              control={<Checkbox checked={topics.includes(topic)} onChange={() => toggleTopic(topic)} />}
              label={topic}
            />
          ))}
        </FormGroup>
      </FormControl>

      <FormControl>
        <FormLabel id="mui-mode-label">Study mode</FormLabel>
        <RadioGroup aria-labelledby="mui-mode-label" value={mode} onChange={(e) => setMode(e.target.value)}>
          <FormControlLabel value="on-campus" control={<Radio />} label="On campus" />
          <FormControlLabel value="online" control={<Radio />} label="Online" />
          <FormControlLabel value="blended" control={<Radio />} label="Blended" />
        </RadioGroup>
      </FormControl>

      <Stack spacing={1}>
        <FormControlLabel
          control={<Switch checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />}
          label="Email me about new assignments"
        />
        <Typography id="mui-hours-label" variant="body2">
          Study hours per week: <strong>{hours}</strong>
        </Typography>
        <Slider
          aria-labelledby="mui-hours-label"
          value={hours}
          onChange={(event, newValue) => setHours(newValue)}
          min={0}
          max={40}
          step={2}
          marks={[
            { value: 0, label: '0' },
            { value: 20, label: '20' },
            { value: 40, label: '40' },
          ]}
          valueLabelDisplay="auto"
        />
      </Stack>

      <Stack spacing={2}>
        {/* Rating is a group of radio buttons, so a fieldset + legend names it */}
        <Box component="fieldset" sx={{ border: 0, p: 0, m: 0 }}>
          <Typography component="legend" variant="body2" sx={{ p: 0 }}>
            Rate this unit
          </Typography>
          <Rating name="unit-rating" value={rating} onChange={(event, newValue) => setRating(newValue)} />
        </Box>
        <div>
          <Typography variant="body2" id="mui-view-label" gutterBottom>
            View
          </Typography>
          {/* exclusive = only one can be selected (like radio buttons) */}
          <ToggleButtonGroup
            exclusive
            size="small"
            aria-labelledby="mui-view-label"
            value={view}
            onChange={(event, newView) => {
              if (newView !== null) setView(newView); // null = the active button was clicked again
            }}
          >
            <ToggleButton value="grid" aria-label="Grid view">
              <LayoutGrid size={18} />
            </ToggleButton>
            <ToggleButton value="list" aria-label="List view">
              <List size={18} />
            </ToggleButton>
            <ToggleButton value="table" aria-label="Table view">
              <Table2 size={18} />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </Stack>

      <Typography
        variant="caption"
        component="pre"
        sx={{ gridColumn: '1 / -1', m: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      >
        {JSON.stringify({ topics, mode, notifications, hours, rating, view })}
      </Typography>
    </Box>
  );
}
