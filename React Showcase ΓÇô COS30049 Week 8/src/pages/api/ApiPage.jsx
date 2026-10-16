import PageHeader from '../../components/common/PageHeader.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';
import CodeBlock from '../../components/common/CodeBlock.jsx';
import useFetchCode from '../../hooks/useFetch.js?raw';

import PostsWithEffect from './demos/PostsWithEffect.jsx';
import postsWithEffectCode from './demos/PostsWithEffect.jsx?raw';
import TodosWithUseFetch from './demos/TodosWithUseFetch.jsx';
import todosWithUseFetchCode from './demos/TodosWithUseFetch.jsx?raw';
import ApiExplorer from './demos/ApiExplorer.jsx';
import apiExplorerCode from './demos/ApiExplorer.jsx?raw';
import UserPosts from './demos/UserPosts.jsx';
import userPostsCode from './demos/UserPosts.jsx?raw';
import CrudPosts from './demos/CrudPosts.jsx';
import crudPostsCode from './demos/CrudPosts.jsx?raw';
import postFormCode from './demos/PostForm.jsx?raw';
import postsApiCode from './demos/postsApi.js?raw';
import InfiniteList from './demos/InfiniteList.jsx';
import infiniteListCode from './demos/InfiniteList.jsx?raw';
import DebouncedSearch from './demos/DebouncedSearch.jsx';
import debouncedSearchCode from './demos/DebouncedSearch.jsx?raw';
import PredictForm from './demos/PredictForm.jsx';
import predictFormCode from './demos/PredictForm.jsx?raw';
import fakeApiCode from './demos/fakeApi.js?raw';
import networkTogglesCode from './demos/NetworkToggles.jsx?raw';

import predictSnippet from './snippets/predict.js?raw';
import envSnippet from './snippets/example.env?raw';
import viteConfigSnippet from './snippets/vite.config.example.js?raw';
import fastApiSnippet from './snippets/main.py?raw';
import axiosSnippet from './snippets/axiosClient.js?raw';
import './api.css';

const METHODS = [
  { method: 'GET', meaning: 'Read data', example: 'GET /students/3', fastapi: '@app.get("/students/{id}")' },
  { method: 'POST', meaning: 'Create something / run an action', example: 'POST /predict', fastapi: '@app.post("/predict")' },
  { method: 'PUT', meaning: 'Replace a whole resource', example: 'PUT /students/3', fastapi: '@app.put("/students/{id}")' },
  { method: 'PATCH', meaning: 'Change some fields', example: 'PATCH /students/3', fastapi: '@app.patch("/students/{id}")' },
  { method: 'DELETE', meaning: 'Remove a resource', example: 'DELETE /students/3', fastapi: '@app.delete("/students/{id}")' },
];

const STATUS_CODES = [
  { code: 200, name: 'OK', ui: 'Show the data.' },
  { code: 201, name: 'Created', ui: 'Show the new item / a success message.' },
  { code: 204, name: 'No Content', ui: 'Success, but there is no body – don’t call response.json().' },
  { code: 400, name: 'Bad Request', ui: 'Tell the user what to fix.' },
  { code: 401, name: 'Unauthorized', ui: 'Ask the user to log in.' },
  { code: 403, name: 'Forbidden', ui: 'Explain that they are not allowed.' },
  { code: 404, name: 'Not Found', ui: 'Show a “not found” message.' },
  { code: 422, name: 'Unprocessable Content', ui: 'FastAPI validation failed – show the field errors from detail.' },
  { code: 500, name: 'Internal Server Error', ui: 'Apologise and offer Retry. Check the server logs.' },
  { code: 503, name: 'Service Unavailable', ui: 'Server down or overloaded – offer Retry later.' },
];

export default function ApiPage() {
  return (
    <>
      <PageHeader
        eyebrow="Data & Navigation"
        title="Fetching Data (APIs)"
        intro="Real apps get their data from a server. This page shows how React talks to an API with fetch(): loading on mount, loading on click, sending data, handling errors and slow networks – and, at the end, how to connect to your own FastAPI back-end for Assignment 3."
        concepts={['fetch()', 'async/await', 'useEffect', 'AbortController', 'loading/error states', 'JSON', 'CORS', '.env']}
        docs={[
          { label: 'Synchronizing with effects', href: 'https://react.dev/learn/synchronizing-with-effects#fetching-data' },
          { label: 'You might not need an effect', href: 'https://react.dev/learn/you-might-not-need-an-effect' },
          { label: 'MDN: Using fetch', href: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch' },
          { label: 'MDN: HTTP status codes', href: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status' },
        ]}
      />

      <Callout type="note" title="Where does the data come from?">
        <p>
          Most demos call <a href="https://jsonplaceholder.typicode.com" target="_blank" rel="noreferrer">JSONPlaceholder</a>,
          a free fake REST API – you need to be online. The demos in “Working offline” use a tiny fake API that
          lives in <code>fakeApi.js</code>, so you can switch on a slow or failing network on purpose. Open your
          browser’s DevTools → <strong>Network</strong> tab to watch the real requests.
        </p>
      </Callout>

      <SectionTitle
        title="Loading data when a component appears"
        intro="The classic pattern: start the request in useEffect, keep loading / error / data in state, and cancel the request in the cleanup function."
      />
      <DemoCard
        title="fetch + useEffect, written by hand"
        description="Shows a skeleton while loading, an error message with a Retry button, and aborts the request if you leave before it finishes. Turn on the broken URL to see the error state."
        concepts={['useEffect', 'fetch()', 'response.ok', 'AbortController', 'skeleton', 'Retry']}
        code={postsWithEffectCode}
        filename="PostsWithEffect.jsx"
      >
        <PostsWithEffect />
      </DemoCard>

      <DemoCard
        title="The same thing with a custom hook"
        description="useFetch() wraps all of that logic, so the component only says which URL it needs. Pick another user: the URL changes and the hook reloads by itself, keeping the old list (dimmed) until the new one arrives."
        concepts={['custom hook', 'useFetch', 'dependency array', 'stale-while-loading']}
        files={[
          { name: 'TodosWithUseFetch.jsx', code: todosWithUseFetchCode },
          { name: 'hooks/useFetch.js', code: useFetchCode },
        ]}
      >
        <TodosWithUseFetch />
      </DemoCard>

      <Callout type="warning" title="Two classic useEffect mistakes">
        <ul>
          <li>
            <strong>Forgetting the dependency array</strong> – <code>useEffect(() =&gt; {'{ fetch(…) }'})</code> runs after
            <em> every</em> render. Setting state with the result causes another render… an endless loop of requests.
          </li>
          <li>
            <strong>Making the effect itself async</strong> – <code>useEffect(async () =&gt; …)</code> returns a Promise,
            but React expects a cleanup function. Define an async function inside the effect and call it.
          </li>
        </ul>
      </Callout>

      <SectionTitle
        title="Loading data when the user does something"
        intro="If a request is caused by a click or a form submit, send it from the event handler – no effect needed."
      />
      <DemoCard
        title="API explorer"
        description="Choose an endpoint and press Send. You’ll see the HTTP status, how long it took and the pretty-printed JSON. Try /nope-404: fetch() does not throw – it’s your job to check response.ok."
        concepts={['event handler', 'async/await', 'performance.now()', 'JSON.stringify(…, null, 2)', 'useRef']}
        code={apiExplorerCode}
        filename="ApiExplorer.jsx"
      >
        <ApiExplorer />
      </DemoCard>

      <DemoCard
        title="Dependent requests & race conditions"
        description="First the users load, then the posts of the user you pick. Each request waits a random time. Switch users quickly with “Ignore stale responses” turned OFF and you may see the wrong user’s posts – then turn it back on."
        concepts={['dependent requests', 'race condition', 'cleanup flag', 'useFetch']}
        code={userPostsCode}
        filename="UserPosts.jsx"
      >
        <UserPosts />
      </DemoCard>

      <SectionTitle
        title="Sending data: create, update, delete"
        intro="POST, PATCH and DELETE requests carry a method, a JSON body and a Content-Type header. Keep them in one API module, and decide whether the UI waits for the server (pessimistic) or updates first (optimistic)."
      />
      <DemoCard
        title="Create, edit and delete posts"
        description="Create a post (the server returns it with a new id), edit a title (PATCH) or delete one. Delete is optimistic: the row disappears immediately and comes back if the request fails. The panel on the right shows the last request and response."
        concepts={['POST', 'PATCH', 'DELETE', 'JSON.stringify', 'optimistic update', 'rollback', 'API module']}
        files={[
          { name: 'CrudPosts.jsx', code: crudPostsCode },
          { name: 'PostForm.jsx', code: postFormCode },
          { name: 'postsApi.js', code: postsApiCode },
        ]}
      >
        <CrudPosts />
      </DemoCard>

      <SectionTitle
        title="Working offline: a fake API"
        intro="fakeApi.js returns Promises that resolve after a setTimeout – exactly the shape of a real request. It’s perfect for building the UI before the back-end exists, and for testing slow and failing networks on purpose."
      />
      <DemoCard
        title="“Load more” and infinite scroll"
        description="Load the next page with the button, or switch on automatic loading and scroll the box. Try the slow network (skeleton rows appear) and the server error (Try again)."
        concepts={['pagination', 'IntersectionObserver', 'useCallback', 'append to state', 'Promise + setTimeout']}
        files={[
          { name: 'InfiniteList.jsx', code: infiniteListCode },
          { name: 'fakeApi.js', code: fakeApiCode },
          { name: 'NetworkToggles.jsx', code: networkTogglesCode },
        ]}
      >
        <InfiniteList />
      </DemoCard>

      <DemoCard
        title="Search as you type (debounced)"
        description="Type quickly and compare the number of key presses with the number of requests. Switch debouncing off to see the difference, and turn on the slow network: older searches are cancelled, so results never arrive out of order."
        concepts={['debounce', 'custom hook', 'setTimeout / clearTimeout', 'AbortSignal', 'derived loading state']}
        files={[
          { name: 'DebouncedSearch.jsx', code: debouncedSearchCode },
          { name: 'fakeApi.js', code: fakeApiCode },
        ]}
      >
        <DebouncedSearch />
      </DemoCard>

      <DemoCard
        title="Practice for Assignment 3: a prediction form"
        description="The exact flow of an ML front-end: read the form, convert strings to numbers, POST them to the model, show a loading state and then the prediction or an error. The “model” is a tiny logistic regression inside fakeApi.js."
        concepts={['form submit', 'Number()', 'disable while loading', 'error state', 'snake_case keys']}
        files={[
          { name: 'PredictForm.jsx', code: predictFormCode },
          { name: 'fakeApi.js', code: fakeApiCode },
          { name: 'NetworkToggles.jsx', code: networkTogglesCode },
        ]}
      >
        <PredictForm />
      </DemoCard>

      <SectionTitle
        title="Connecting to YOUR back-end"
        intro="In Assignment 3 the React app (e.g. http://localhost:3000) calls a FastAPI server (e.g. http://localhost:8000) that serves your trained model. These files are for reading and copying – they are not run on this page."
      />
      <div className="demo-card">
        <CodeBlock code={predictSnippet} filename="src/api/predict.js" />
      </div>
      <div className="demo-card">
        <CodeBlock code={envSnippet} filename=".env" language="shell" />
      </div>
      <div className="demo-card">
        <CodeBlock code={fastApiSnippet} filename="main.py (FastAPI)" language="python" />
      </div>

      <Callout type="note" title="Why do I get a CORS error?">
        <p>
          The browser blocks JavaScript from reading responses from a <em>different origin</em> (another port
          counts!) unless that server says it is allowed. The fix belongs on the <strong>server</strong>: the{' '}
          <code>CORSMiddleware</code> above lists your front-end’s URL. Alternatively, during development, let Vite
          forward the requests so the browser only ever talks to one origin:
        </p>
      </Callout>
      <div className="demo-card">
        <CodeBlock code={viteConfigSnippet} filename="vite.config.js (proxy)" />
      </div>
      <div className="demo-card">
        <CodeBlock code={axiosSnippet} filename="src/api/predict.js (axios version)" />
      </div>

      <SectionTitle title="Cheat sheet: HTTP methods and status codes" />
      <div className="stack-lg api-cheatsheet">
        <div className="table-wrap">
          <table className="table">
            <caption>Methods</caption>
            <thead>
              <tr>
                <th scope="col">Method</th>
                <th scope="col">Used to…</th>
                <th scope="col">FastAPI</th>
              </tr>
            </thead>
            <tbody>
              {METHODS.map((row) => (
                <tr key={row.method}>
                  <th scope="row">
                    <span className="badge badge-code">{row.method}</span>
                  </th>
                  <td>
                    {row.meaning}
                    <div className="small muted mono">{row.example}</div>
                  </td>
                  <td className="mono small">{row.fastapi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-wrap">
          <table className="table">
            <caption>Status codes</caption>
            <thead>
              <tr>
                <th scope="col">Code</th>
                <th scope="col">What your UI should do</th>
              </tr>
            </thead>
            <tbody>
              {STATUS_CODES.map((row) => (
                <tr key={row.code}>
                  <th scope="row">
                    <span
                      className={`badge ${row.code >= 500 ? 'badge-danger' : row.code >= 400 ? 'badge-warning' : 'badge-success'}`}
                    >
                      {row.code}
                    </span>
                    <div className="small muted">{row.name}</div>
                  </th>
                  <td className="api-wrap">{row.ui}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Callout type="tip" title="Assignment 3 checklist for every request">
        <ul className="api-checklist">
          <li>A visible <strong>loading state</strong> (spinner, skeleton or “Predicting…”).</li>
          <li>An <strong>error state</strong> with a helpful message – and a Retry button where it makes sense.</li>
          <li>
            The submit button is <strong>disabled while waiting</strong>, so nobody sends the same request twice.
          </li>
          <li>
            Check <code>response.ok</code> – fetch() does not throw for 4xx/5xx – and show FastAPI’s{' '}
            <code>detail</code> message.
          </li>
          <li>Convert form strings to numbers before sending, and match the field names of your Pydantic model.</li>
          <li>
            The API URL comes from <code>import.meta.env.VITE_API_URL</code>, never hard-coded in components.
          </li>
          <li>
            <strong>Never put secrets in front-end code</strong> (API keys, passwords) – anyone can read the
            JavaScript. Keep them on the server.
          </li>
          <li>Cancel or ignore requests whose results are no longer needed (AbortController / ignore flag).</li>
        </ul>
      </Callout>

      <Callout type="exercise">
        <ol>
          <li>
            In <code>PostsWithEffect.jsx</code>, add a “Posts per page” select (5, 10, 20) and use it in the URL. What
            must you add to the effect’s dependency array?
          </li>
          <li>
            In <code>ApiExplorer.jsx</code>, add a POST option that sends{' '}
            <code>{'{ "title": "Hello" }'}</code> to <code>/posts</code> and shows the 201 response.
          </li>
          <li>
            In <code>CrudPosts.jsx</code>, make “edit title” optimistic too – including the rollback when the request
            fails.
          </li>
          <li>
            Add a <code>predictBatch()</code> function to <code>fakeApi.js</code> that takes an array of students,
            and a button in <code>PredictForm.jsx</code> that predicts for three example students at once.
          </li>
          <li>
            Replace <code>predictPass()</code> in <code>PredictForm.jsx</code> with the real <code>predict()</code> from{' '}
            <code>src/api/predict.js</code> above and run it against your own FastAPI server.
          </li>
        </ol>
      </Callout>
    </>
  );
}
