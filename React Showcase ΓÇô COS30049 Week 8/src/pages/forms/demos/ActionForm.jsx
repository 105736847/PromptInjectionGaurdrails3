import { useActionState, useId } from 'react';
import { useFormStatus } from 'react-dom';
import { CircleCheck, CircleAlert } from 'lucide-react';

/**
 * React 19 form actions: <form action={fn}> + useActionState + useFormStatus.
 *
 * - Pass a FUNCTION to <form action>. React calls it with the FormData –
 *   no onSubmit, no preventDefault, no useState per field.
 * - useActionState(action, initialState) → [state, formAction, isPending].
 *   Whatever the action RETURNS becomes the new `state` (e.g. a message).
 * - useFormStatus() tells a component INSIDE the form whether it is pending.
 * - After an action finishes, React resets uncontrolled fields automatically;
 *   defaultValue={state.email} puts the text back when there was an error.
 */
const INITIAL_STATE = { ok: null, message: '', email: '', topic: 'assignments', subscribers: [] };

// The action receives the previous state and the submitted FormData.
async function subscribeAction(previousState, formData) {
  const email = String(formData.get('email')).trim();
  const topic = String(formData.get('topic'));
  await new Promise((resolve) => setTimeout(resolve, 1200)); // pretend network + server

  const base = { ...previousState, email, topic }; // keep what the user typed
  if (!email) return { ...base, ok: false, message: 'Please enter your email address.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ...base, ok: false, message: `“${email}” is not a valid email.` };
  if (previousState.subscribers.includes(email.toLowerCase())) {
    return { ...base, ok: false, message: 'That address is already subscribed.' };
  }
  return {
    ...base,
    ok: true,
    email: '', // clear the input on success
    message: `Subscribed ${email} to ${topic} updates.`,
    subscribers: [...previousState.subscribers, email.toLowerCase()],
  };
}

// Must be rendered INSIDE the <form> – useFormStatus reads the nearest parent form.
function SubmitButton() {
  const { pending, data } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending && (
        <span className="spinner" aria-hidden="true"
          style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'currentColor', borderTopColor: 'transparent' }} />
      )}
      {pending ? `Subscribing ${data.get('email') || ''}…` : 'Subscribe'}
    </button>
  );
}

export default function ActionForm() {
  const id = useId();
  const [state, formAction, isPending] = useActionState(subscribeAction, INITIAL_STATE);

  return (
    <div className="stack">
      {/* noValidate: let our "server" action do the validation for this demo */}
      <form action={formAction} noValidate className="row" style={{ alignItems: 'flex-end' }}>
        <div className="field" style={{ flex: '1 1 220px' }}>
          <label className="label" htmlFor={`${id}-email`}>Email</label>
          <input id={`${id}-email`} name="email" type="email" className="input" placeholder="you@student.example.edu.au"
            defaultValue={state.email} aria-invalid={state.ok === false} aria-describedby={`${id}-status`} />
        </div>
        <div className="field" style={{ flex: '0 1 180px' }}>
          <label className="label" htmlFor={`${id}-topic`}>Topic</label>
          {/* A <select> ignores LATER changes to defaultValue, so key={…} remounts it with the new one */}
          <select key={state.topic} id={`${id}-topic`} name="topic" className="input" defaultValue={state.topic}>
            <option value="assignments">Assignments</option>
            <option value="lectures">Lecture notes</option>
            <option value="events">Hackathons & events</option>
          </select>
        </div>
        <SubmitButton />
      </form>

      <div id={`${id}-status`} role="status">
        {state.ok === true && (
          <div className="alert alert-success"><CircleCheck size={18} aria-hidden="true" /> {state.message}</div>
        )}
        {state.ok === false && (
          <div className="alert alert-danger"><CircleAlert size={18} aria-hidden="true" /> {state.message}</div>
        )}
      </div>

      <pre className="demo-output">
        {`isPending: ${isPending}\nstate: ${JSON.stringify(state, null, 2)}`}
      </pre>
    </div>
  );
}
