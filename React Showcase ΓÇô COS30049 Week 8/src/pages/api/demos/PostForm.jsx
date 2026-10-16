/**
 * PostForm – a small controlled form that hands its data to the parent.
 *
 * It keeps its own field state, disables itself while the request is running
 * (so nobody can double-submit) and only clears the fields if saving worked.
 */
import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function PostForm({ onCreate }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page
    setSaving(true);
    const saved = await onCreate({ title: title.trim(), body: body.trim(), userId: 1 });
    setSaving(false);
    if (saved) {
      setTitle('');
      setBody('');
    }
  }

  return (
    <form className="stack-sm" onSubmit={handleSubmit}>
      <div className="field">
        <label className="label" htmlFor="post-title">
          Title <span className="required">*</span>
        </label>
        <input
          id="post-title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Study group for COS30049"
          required
          maxLength={80}
          disabled={saving}
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="post-body">
          Body
        </label>
        <textarea
          id="post-body"
          className="input"
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Meet in the library, Level 2, Thursday 4pm."
          disabled={saving}
        />
      </div>
      <div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !title.trim()}>
          {saving ? <span className="spinner api-spinner-sm" aria-hidden="true" /> : <Plus size={15} />}
          {saving ? 'Saving…' : 'Create post'}
        </button>
      </div>
    </form>
  );
}
