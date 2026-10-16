/**
 * postsApi.js – every call to the server lives in ONE module.
 *
 * Components call createPost(post) instead of repeating fetch() everywhere,
 * so the base URL, headers and error handling are written once.
 * Do the same in Assignment 3: an api.js with predict(), getHistory() …
 */
export const BASE_URL = 'https://jsonplaceholder.typicode.com';

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    // Tell the server we are sending JSON (only when there is a body).
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Some responses (e.g. an error page) are not JSON – don't crash on them.
  const data = await response.json().catch(() => null);

  // fetch() does NOT throw for 404 or 500, so we check response.ok ourselves.
  if (!response.ok) {
    throw new Error(`${method} ${path} failed with status ${response.status}`);
  }
  return { status: response.status, data };
}

export const getPosts = (limit = 3) => request(`/posts?_limit=${limit}`);

export const createPost = (post) => request('/posts', { method: 'POST', body: post });

export const updatePost = (id, changes) => request(`/posts/${id}`, { method: 'PATCH', body: changes });

export const deletePost = (id) => request(`/posts/${id}`, { method: 'DELETE' });

/** Calls an endpoint that doesn't exist – handy for practising error handling. */
export const deletePostBroken = (id) => request(`/no-such-endpoint/${id}`, { method: 'DELETE' });
