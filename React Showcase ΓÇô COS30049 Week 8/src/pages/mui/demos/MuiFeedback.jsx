/**
 * MuiFeedback – telling the user what happened.
 *
 * - <Alert>: an inline message with a severity (success/info/warning/error).
 * - <Snackbar>: a short-lived message at the edge of the screen.
 * - <Dialog>: a modal that asks a question. MUI handles focus trapping,
 *   Escape to close, the backdrop and returning focus afterwards.
 */
import { useState } from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Stack,
} from '@mui/material';

export default function MuiFeedback() {
  const [showWarning, setShowWarning] = useState(true);
  // Keep the message while the snackbar slides out, so only `open` changes.
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'success', message: '' });
  const [dialogOpen, setDialogOpen] = useState(false);

  function notify(severity, message) {
    setSnackbar({ open: true, severity, message });
  }

  function handleSnackbarClose(event, reason) {
    if (reason === 'clickaway') return; // don't close when the user clicks elsewhere
    setSnackbar((current) => ({ ...current, open: false }));
  }

  function handleConfirmDelete() {
    setDialogOpen(false);
    notify('success', 'Submission deleted.');
  }

  return (
    <Stack spacing={2}>
      <Alert severity="success">Your assignment was submitted.</Alert>
      <Alert severity="info" variant="outlined">
        Marks are released two weeks after the due date.
      </Alert>
      {showWarning && (
        <Alert severity="warning" onClose={() => setShowWarning(false)}>
          <AlertTitle>Due tomorrow</AlertTitle>
          Assignment 3 closes at 11:59 pm. (Click × to dismiss.)
        </Alert>
      )}
      <Alert
        severity="error"
        variant="filled"
        action={
          <Button color="inherit" size="small" onClick={() => notify('info', 'Retrying…')}>
            Retry
          </Button>
        }
      >
        Could not reach the prediction server.
      </Alert>

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={() => notify('success', 'Draft saved.')}>
          Show snackbar
        </Button>
        <Button variant="outlined" color="error" onClick={() => setDialogOpen(true)}>
          Delete submission…
        </Button>
        {!showWarning && <Button onClick={() => setShowWarning(true)}>Bring the warning back</Button>}
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {/* An Alert inside a Snackbar gives it an icon and colour */}
        <Alert severity={snackbar.severity} variant="filled" onClose={handleSnackbarClose}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} aria-labelledby="mui-dialog-title">
        <DialogTitle id="mui-dialog-title">Delete this submission?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your uploaded report will be removed. You can submit again until the due date.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} autoFocus>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
