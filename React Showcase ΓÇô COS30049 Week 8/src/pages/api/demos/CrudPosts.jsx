/**
 * CrudPosts – Create (POST), Read (GET), Update (PATCH) and Delete (DELETE).
 *
 * - Create/Update are "pessimistic": wait for the server, then update the UI.
 * - Delete is "optimistic": remove the row at once (the app feels instant),
 *   and put it back ("roll back") if the server says no.
 * JSONPlaceholder is a fake API: it answers correctly but never really saves.
 */
import { useEffect, useRef, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext.jsx';
import { getPosts, createPost, updatePost, deletePost, deletePostBroken } from './postsApi.js';
import PostForm from './PostForm.jsx';

export default function CrudPosts() {
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [editing, setEditing] = useState(null); // { key, title } of the post being edited
  const [failDeletes, setFailDeletes] = useState(false);
  const [exchange, setExchange] = useState(null); // last request + response, for display
  const nextKey = useRef(1);

  // READ: load three posts once. `key` is our own id for React (see handleCreate).
  useEffect(() => {
    let ignore = false;
    getPosts(3)
      .then(({ data }) => {
        if (ignore) return;
        setPosts(data.map((post) => ({ ...post, key: `server-${post.id}` })));
        setLoadState('ready');
      })
      .catch(() => {
        if (!ignore) setLoadState('error');
      });
    return () => {
      ignore = true;
    };
  }, []);

  // CREATE – returns true/false so the form knows whether to clear itself.
  async function handleCreate(newPost) {
    try {
      const { status, data } = await createPost(newPost);
      // JSONPlaceholder gives EVERY new post id 101, so we add a unique key ourselves.
      const key = `new-${nextKey.current++}`;
      setPosts((current) => [{ ...data, key, isNew: true }, ...current]);
      setExchange({ request: `POST /posts\n${JSON.stringify(newPost, null, 2)}`, status, response: data });
      showToast({ type: 'success', title: 'Post created', message: `Server replied ${status} with id ${data.id}.` });
      return true;
    } catch (err) {
      showToast({ type: 'error', title: 'Could not create the post', message: err.message });
      return false;
    }
  }

  // UPDATE
  async function handleSaveTitle(event, post) {
    event.preventDefault();
    const changes = { title: editing.title.trim() };
    try {
      const { status, data } = await updatePost(post.id, changes);
      setPosts((current) => current.map((p) => (p.key === post.key ? { ...p, ...data } : p)));
      setExchange({ request: `PATCH /posts/${post.id}\n${JSON.stringify(changes, null, 2)}`, status, response: data });
      setEditing(null);
    } catch (err) {
      showToast({ type: 'error', title: 'Update failed', message: err.message });
    }
  }

  // DELETE (optimistic)
  async function handleDelete(post) {
    const index = posts.findIndex((p) => p.key === post.key);
    // 1. Update the UI immediately.
    setPosts((current) => current.filter((p) => p.key !== post.key));
    try {
      // 2. Then tell the server.
      const request = failDeletes ? deletePostBroken : deletePost;
      const { status, data } = await request(post.id);
      setExchange({ request: `DELETE /posts/${post.id}`, status, response: data });
    } catch (err) {
      // 3. The server said no → put the post back where it was.
      setPosts((current) => [...current.slice(0, index), post, ...current.slice(index)]);
      setExchange({ request: `DELETE /posts/${post.id}`, status: 'failed', response: err.message });
      showToast({ type: 'error', title: 'Delete failed – post restored', message: err.message });
    }
  }

  return (
    <div className="api-split">
      <div className="stack">
        <PostForm onCreate={handleCreate} />
        <label className="switch small">
          <input type="checkbox" checked={failDeletes} onChange={(e) => setFailDeletes(e.target.checked)} />
          <span className="switch-track" />
          Make DELETE fail (to see the rollback)
        </label>

        {loadState === 'loading' && <span className="spinner" role="status" aria-label="Loading posts" />}
        {loadState === 'error' && <p className="error-text">Could not load the posts.</p>}

        <ul className="api-crud-list">
          {posts.map((post) => (
            <li key={post.key} className="api-post">
              {editing?.key === post.key ? (
                <form className="row" onSubmit={(event) => handleSaveTitle(event, post)}>
                  <input
                    className="input api-edit-input"
                    aria-label="New title"
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-sm btn-primary" disabled={!editing.title.trim()}>
                    Save
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="api-crud-row">
                  <strong>
                    {post.title} {post.isNew && <span className="badge badge-success">new</span>}
                  </strong>
                  <span className="row">
                    {/* New posts don't really exist on the fake server, so PATCH would fail */}
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => setEditing({ key: post.key, title: post.title })}
                      disabled={post.isNew}
                      aria-label={`Edit “${post.title}”`}
                      title={post.isNew ? 'Only posts loaded from the server can be edited' : 'Edit title'}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleDelete(post)}
                      aria-label={`Delete “${post.title}”`}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="stack-sm">
        <strong className="small">Last request → response</strong>
        <pre className="demo-output api-log">
          {exchange
            ? `${exchange.request}\n\n← ${exchange.status}\n${JSON.stringify(exchange.response, null, 2)}`
            : 'Create, edit or delete a post to see the HTTP traffic here.'}
        </pre>
      </div>
    </div>
  );
}
