/**
 * FeedbackForm – POST a JSON body to FastAPI and show its validation errors
 * next to the right fields.
 *
 * FastAPI validates the body against the Pydantic model FeedbackIn. When something
 * is wrong it answers 422 with a list of errors; client.js turns that list into
 * error.fieldErrors = { email: '…', rating: '…' }, which maps straight onto the form.
 * Switch on "Skip browser validation" to prove the SERVER checks everything too.
 * An anonymous post leaves name and email out of the body: data you don't need,
 * you don't send (the server's model_validator allows that only when anonymous).
 */
import { useState } from 'react';
import { flushSync } from 'react-dom';
import { Send, Sparkles } from 'lucide-react';

import { api } from '../../../api/client.js';
import useRequest from './useRequest.js';
import ResponseView from './ResponseView.jsx';

const TOPICS = ['content', 'pace', 'labs', 'assessments', 'resources', 'other'];
const GOOD = { name: 'Mia Chen', email: 'mia.chen@student.example.edu', rating: '4', comment: 'The FastAPI lab was great!', tags: ['labs'], anonymous: false };
const BAD = { name: 'M1', email: 'mia@', rating: '7', comment: 'x'.repeat(520), tags: TOPICS, anonymous: false };

/** "Value error, Names can't contain digits" → "Names can't contain digits" */
const clean = (message) => message?.replace(/^Value error, /, '');

export default function FeedbackForm() {
  const [values, setValues] = useState(GOOD);
  const [skipBrowser, setSkipBrowser] = useState(false);
  const [sendExtra, setSendExtra] = useState(false);
  const [errors, setErrors] = useState({});
  const { send, loading, request, result } = useRequest();

  function update(field, value) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined })); // editing clears that field's error
  }

  function toggleTag(tag) {
    update('tags', values.tags.includes(tag) ? values.tags.filter((t) => t !== tag) : [...values.tags, tag]);
  }

  // The JSON body, built from state. Pydantic will check every key.
  const { name, email, ...rest } = values;
  const body = {
    ...(values.anonymous ? {} : { name, email }), // anonymous → personal data is not even sent
    ...rest,
    rating: values.rating === '' ? null : Number(values.rating),
    ...(sendExtra && { is_admin: true }), // extra="forbid" on the server rejects this
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (!skipBrowser && values.tags.length > 5) {
      setErrors({ tags: 'Pick at most 5 topics' }); // a check HTML attributes can't do
      return;
    }
    setErrors({});
    const outcome = await send('POST', '/api/basics/feedback', (signal) => api.post('/api/basics/feedback', body, { signal }), 201);
    if (outcome?.error?.status !== 422) return;
    const fieldErrors = outcome.error.fieldErrors; // { name: '…', body: '…' }
    // flushSync renders the error texts right now, so the field we focus next already
    // "says" what is wrong (aria-describedby) – keyboard and screen-reader users land on it.
    flushSync(() => setErrors(fieldErrors));
    const first = Object.keys(fieldErrors).map((field) => document.getElementById(`fb-${field}`)).find(Boolean);
    first?.focus();
  }

  function reset() {
    setValues(GOOD);
    setErrors({});
    setSkipBrowser(false);
    setSendExtra(false); // an is_admin error stops the model_validator rules from running at all
  }

  // Browser checks (required, maxLength…) only when the switch is off.
  const html = (attributes) => (skipBrowser ? {} : attributes);
  const fieldProps = (field) => ({
    id: `fb-${field}`,
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': errors[field] ? `fb-${field}-error` : undefined,
  });
  const errorFor = (field, prefix = '') =>
    errors[field] && <p className="error-text" id={`fb-${field}-error`}>{prefix}{clean(errors[field])}</p>;

  return (
    <div className="stack-lg">
      <div className="row">
        <label className="switch">
          <input type="checkbox" checked={skipBrowser} onChange={(e) => setSkipBrowser(e.target.checked)} />
          <span className="switch-track" /> Skip browser validation
        </label>
        <label className="switch">
          <input type="checkbox" id="fb-is_admin" checked={sendExtra} onChange={(e) => setSendExtra(e.target.checked)} aria-describedby={errors.is_admin ? 'fb-is_admin-error' : undefined} />
          <span className="switch-track" /> Also send <code>&quot;is_admin&quot;: true</code>
        </label>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setValues(BAD); setErrors({}); }}>
          <Sparkles size={14} aria-hidden="true" /> Fill with invalid data
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={reset}>
          Reset
        </button>
      </div>

      <form className="fastapi-form" onSubmit={handleSubmit} noValidate={skipBrowser}>
        {errors.body && (
          <p className="alert alert-danger m-0" role="alert" id="fb-body" tabIndex={-1}>
            {/* A model_validator error has loc ["body"]: it belongs to no single field. */}
            {clean(errors.body)}
          </p>
        )}
        <div className="grid-2">
          <div className="field">
            <label className="label" htmlFor="fb-name">Name <span className="required">*</span></label>
            <input className="input" value={values.name} onChange={(e) => update('name', e.target.value)} disabled={values.anonymous} {...fieldProps('name')} {...html({ required: true, minLength: 2, maxLength: 40 })} />
            {errorFor('name')}
          </div>
          <div className="field">
            <label className="label" htmlFor="fb-email">Email <span className="required">*</span></label>
            <input className="input" type={skipBrowser ? 'text' : 'email'} value={values.email} onChange={(e) => update('email', e.target.value)} disabled={values.anonymous} {...fieldProps('email')} {...html({ required: true })} />
            {errorFor('email')}
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="fb-rating">Rating (1–5) <span className="required">*</span></label>
          <input className="input fastapi-input-sm" type="number" value={values.rating} onChange={(e) => update('rating', e.target.value)} {...fieldProps('rating')} {...html({ required: true, min: 1, max: 5 })} />
          {errorFor('rating')}
        </div>
        <div className="field">
          <label className="label" htmlFor="fb-comment">Comment</label>
          <textarea className="input" rows={3} value={values.comment} onChange={(e) => update('comment', e.target.value)} {...fieldProps('comment')} {...html({ maxLength: 500 })} />
          <p className="hint">{values.comment.length} / 500 characters · a rating of 1–2 needs at least 10</p>
          {errorFor('comment')}
        </div>
        <fieldset aria-describedby={errors.tags ? 'fb-tags-error' : undefined}>
          <legend>Topics (max 5)</legend>
          <div className="row">
            {TOPICS.map((tag) => (
              <label key={tag} className="check">
                <input type="checkbox" checked={values.tags.includes(tag)} onChange={() => toggleTag(tag)} /> {tag}
              </label>
            ))}
          </div>
          {errorFor('tags')}
        </fieldset>
        <label className="switch">
          {/* A new mode → the old errors no longer apply. */}
          <input type="checkbox" checked={values.anonymous} onChange={(e) => { update('anonymous', e.target.checked); setErrors({}); }} />
          <span className="switch-track" /> Post anonymously – name and email are not sent
        </label>
        {errorFor('is_admin', 'is_admin: ')}
        <div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Send size={16} aria-hidden="true" /> {loading ? 'Sending…' : 'Send feedback'}
          </button>
        </div>
      </form>

      <div className="fastapi-compare">
        <div className="stack-sm">
          <strong className="small">Request body (JSON)</strong>
          <pre className="demo-output">{JSON.stringify(body, (key, value) => (key === 'comment' && value.length > 60 ? `${value.slice(0, 60)}… (${value.length} chars)` : value), 2)}</pre>
        </div>
        <div className="stack-sm">
          <strong className="small">
            Response {result?.status === 201 && <span className="badge badge-success">id and received_at were added by the server</span>}
          </strong>
          {request ? <ResponseView request={request} result={result} loading={loading} /> : <p className="muted small">Send the form to see FastAPI’s answer.</p>}
        </div>
      </div>
    </div>
  );
}
