/**
 * MuiTextFields – TextField is MUI's all-in-one input: label, helper text,
 * error state and adornments are just props.
 *
 * MUI v7+ passes props to the inner parts through `slotProps`
 * (e.g. slotProps.input.startAdornment) – older tutorials use the removed
 * `InputProps` / `inputProps` props instead.
 */
import { useState } from 'react';
import {
  Autocomplete,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { Mail, Search } from 'lucide-react';

const UNITS = [
  'COS10009 Introduction to Programming',
  'COS20007 Object Oriented Programming',
  'COS30049 Computing Technology Innovation Project',
  'COS30019 Introduction to AI',
  'SWE30003 Software Architectures and Design',
  'TNE10006 Networks and Switching',
];

export default function MuiTextFields() {
  const [email, setEmail] = useState('not-an-email');
  const [campus, setCampus] = useState('hawthorn');
  const [year, setYear] = useState('');
  const [favouriteUnit, setFavouriteUnit] = useState(null);
  const [enrolledUnits, setEnrolledUnits] = useState([UNITS[2]]);

  const emailInvalid = email !== '' && !/^\S+@\S+\.\S+$/.test(email);

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="Outlined" variant="outlined" defaultValue="Default style" fullWidth />
        <TextField label="Filled" variant="filled" fullWidth />
        <TextField label="Standard" variant="standard" fullWidth />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailInvalid}
          helperText={emailInvalid ? 'Please enter a valid email address' : 'We will never share it'}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Mail size={18} />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          label="Search units"
          placeholder="e.g. COS30049"
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      <TextField label="Why did you choose this unit?" multiline minRows={2} maxRows={5} fullWidth />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        {/* Option 1: TextField with the `select` prop */}
        <TextField select label="Campus" value={campus} onChange={(e) => setCampus(e.target.value)} fullWidth>
          <MenuItem value="hawthorn">Hawthorn</MenuItem>
          <MenuItem value="sarawak">Sarawak</MenuItem>
          <MenuItem value="online">Online</MenuItem>
        </TextField>

        {/* Option 2: FormControl + InputLabel + Select (more control over the parts) */}
        <FormControl fullWidth>
          <InputLabel id="mui-year-label">Year of study</InputLabel>
          <Select labelId="mui-year-label" label="Year of study" value={year} onChange={(e) => setYear(e.target.value)}>
            <MenuItem value="">
              <em>Not selected</em>
            </MenuItem>
            <MenuItem value={1}>Year 1</MenuItem>
            <MenuItem value={2}>Year 2</MenuItem>
            <MenuItem value={3}>Year 3</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {/* Autocomplete: a text box with a filtered list of suggestions */}
        <Autocomplete
          options={UNITS}
          value={favouriteUnit}
          onChange={(event, newValue) => setFavouriteUnit(newValue)}
          renderInput={(params) => <TextField {...params} label="Favourite unit" />}
          fullWidth
        />
        <Autocomplete
          multiple
          options={UNITS}
          value={enrolledUnits}
          onChange={(event, newValue) => setEnrolledUnits(newValue)}
          renderInput={(params) => <TextField {...params} label="Enrolled units" placeholder="Add a unit" />}
          fullWidth
        />
      </Stack>
    </Stack>
  );
}
