/**
 * MuiSignUpForm – a complete form built only from MUI components.
 *
 * The React part is the same as with plain HTML: one state object for the
 * values, a validate() function, errors shown after a field is touched or the
 * form is submitted. MUI just gives us nicer building blocks
 * (error + helperText props, Grid for the layout, Button with `loading`).
 */
import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';

const INITIAL = { firstName: '', lastName: '', email: '', password: '', course: '', agree: false };

function validate(values) {
  const errors = {};
  if (!values.firstName.trim()) errors.firstName = 'First name is required';
  if (!values.lastName.trim()) errors.lastName = 'Last name is required';
  if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = 'Enter a valid email address';
  if (values.password.length < 8) errors.password = 'At least 8 characters';
  if (!values.course) errors.course = 'Choose your course';
  if (!values.agree) errors.agree = 'You must accept the terms';
  return errors;
}

export default function MuiSignUpForm() {
  const [values, setValues] = useState(INITIAL);
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'done'

  const errors = validate(values); // derived on every render – never stored in state
  const showError = (field) => Boolean(touched[field] && errors[field]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleBlur(event) {
    setTouched((current) => ({ ...current, [event.target.name]: true }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    // Mark every field as touched so all errors become visible.
    setTouched(Object.fromEntries(Object.keys(INITIAL).map((key) => [key, true])));
    if (Object.keys(errors).length > 0) return;
    setStatus('submitting');
    setTimeout(() => setStatus('done'), 1200); // pretend to call the server
  }

  function reset() {
    setValues(INITIAL);
    setTouched({});
    setStatus('idle');
  }

  if (status === 'done') {
    return (
      <Alert
        severity="success"
        action={
          <Button color="inherit" size="small" onClick={reset}>
            Start again
          </Button>
        }
      >
        Welcome aboard, {values.firstName}! (Nothing was sent – this is a demo.)
      </Alert>
    );
  }

  // Props shared by every text field.
  const fieldProps = (name) => ({
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    error: showError(name),
    helperText: showError(name) ? errors[name] : ' ', // ' ' keeps the height stable
    fullWidth: true,
  });

  return (
    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ maxWidth: 560 }}>
      <Typography variant="h6" component="h4" gutterBottom>
        Create your student account
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="First name" autoComplete="given-name" required {...fieldProps('firstName')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Last name" autoComplete="family-name" required {...fieldProps('lastName')} />
        </Grid>
        <Grid size={12}>
          <TextField label="Student email" type="email" autoComplete="email" required {...fieldProps('email')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            {...fieldProps('password')}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField select label="Course" required {...fieldProps('course')}>
            <MenuItem value="bcs">Bachelor of Computer Science</MenuItem>
            <MenuItem value="bse">Bachelor of Software Engineering</MenuItem>
            <MenuItem value="bit">Bachelor of Information Technology</MenuItem>
          </TextField>
        </Grid>
        <Grid size={12}>
          <FormControlLabel
            control={<Checkbox name="agree" checked={values.agree} onChange={handleChange} onBlur={handleBlur} />}
            label="I accept the terms of use"
          />
          {showError('agree') && <FormHelperText error>{errors.agree}</FormHelperText>}
        </Grid>
        <Grid size={12}>
          <Button type="submit" variant="contained" size="large" loading={status === 'submitting'} fullWidth>
            Sign up
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
