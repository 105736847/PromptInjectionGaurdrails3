# React Showcase – COS30049 Week 8

A hands-on tour of building rich, interactive front-ends with **React**.
Every example is live. Each one sits in a card with a **Preview** tab (the running component) and a
**Code** tab (the real source file that produces it).

![React 19](https://img.shields.io/badge/React-19-4f46e5) ![Vite](https://img.shields.io/badge/Vite-8-4f46e5) ![React Router](https://img.shields.io/badge/React_Router-7-4f46e5) ![D3](https://img.shields.io/badge/D3-7-4f46e5) ![MUI](https://img.shields.io/badge/MUI-9-4f46e5)

---

## 1. Getting started

You need **Node.js 20.19+ or 22.12+** (check with `node -v`).

```bash
npm install      # install dependencies (first time only)
npm start        # start the dev server and open http://localhost:3000
```

| Script            | What it does                                                    |
| ----------------- | --------------------------------------------------------------- |
| `npm start`       | Dev server with hot reload, opens the browser                   |
| `npm run dev`     | Same, without opening the browser                               |
| `npm run build`   | Production build into `dist/`                                   |
| `npm run preview` | Serve the production build locally to check it                  |

> The **Full-Stack (FastAPI)** pages also need the Python back end running – see
> [section 3](#3-the-fastapi-back-end). Every other page works with the front end alone.

> Some examples load content from the internet (sample photos from picsum.photos, the
> JSONPlaceholder test API, MDN sample video/audio and an OpenStreetMap embed). They show a
> loading or error state when you are offline. Everything else works offline.

---

## 2. What's inside

| Section            | Page (URL)                     | Topics                                                                                       |
| ------------------ | ------------------------------ | -------------------------------------------------------------------------------------------- |
| Getting Started    | Overview `/`                   | First component, the State → View → Event loop, project structure, CRA vs Vite               |
| React Fundamentals | JSX & Components `/jsx`        | JSX rules, props, children, composition, conditional rendering, lists & keys                 |
|                    | State & Events `/state`        | `useState`, updater functions, objects/arrays in state, events, bubbling, lifting state, `useReducer` |
|                    | Hooks & Lifecycle `/hooks`     | `useEffect`, lifecycle, class components, error boundaries, `useRef`, `useMemo`, `useContext`, custom hooks |
| HTML Elements      | Text & Content `/typography`   | Headings, inline semantics, links, lists, tables, `details`, `progress`/`meter`, landmarks, `Intl` formatting |
|                    | Forms & Inputs `/forms`        | Every input type, validation, file upload, controlled vs uncontrolled, dynamic fields, React 19 form actions |
|                    | Media & Graphics `/media`      | Images, gallery + lightbox, custom video/audio players, canvas drawing, SVG, icons, iframes  |
| UI & Layout        | Layout & Responsive `/layout`  | Flexbox & Grid playgrounds, grid areas, breakpoints, container queries, positioning, box model |
|                    | Styling in React `/styling`    | CSS files, `className`, inline styles, CSS Modules, CSS variables, animation, filters, dark mode |
|                    | UI Components `/components`    | Tabs, accordion, dropdown, navbar, pagination, stepper, carousel, kanban, calendar, timeline |
|                    | Overlays & Feedback `/feedback`| Modals, `<dialog>`, drawer, toasts, tooltips, popovers, alerts, progress, skeletons, ratings |
| Data & Navigation  | Data Display `/data`           | Sortable/filterable table, pagination, CSV export, stat cards, hand-made SVG charts          |
|                    | Fetching Data `/api`           | `fetch` + `useEffect`, loading/error states, POST/DELETE, race conditions, connecting to FastAPI |
|                    | React Router `/routing`        | Nested routes, `useParams`, `useSearchParams`, `useNavigate`, redirects, protected routes    |
| Data Visualization (D3) | D3 Fundamentals `/d3-basics` | React + D3 patterns, the data join, scales, axes, shapes & curves, transitions, colour scales, loading CSV, SVG vs Canvas |
|                    | Interactive Charts `/d3-charts` | Zoom + brush, multi-line emphasis, bar chart race, streamgraph, scatter with brushing, histogram, beeswarm, calendar heatmap, radial chart, cross-filtering |
|                    | Networks, Trees & Maps `/d3-networks` | Force-directed graph, collapsible tree, treemap of this project, sunburst, chord, Sankey, rotating globe, choropleth, adjacency matrix |
|                    | Visualising ML Results `/d3-ml` | Threshold explorer (confusion matrix + ROC/PR), training curves, feature importance, in-browser decision boundary, FastAPI hand-off |
| Full-Stack (FastAPI) | FastAPI Basics `/fastapi`    | How React talks to Python: the proxy, routes, path/query params, Pydantic validation, status codes, dependencies, timeouts, an API playground |
|                    | Database CRUD `/fullstack-crud` | SQLite + SQLModel: server-side search/sort/pagination, create/update/delete, SQL aggregates |
|                    | Login & JWT `/fullstack-auth`  | Register, log in, JWTs, protected endpoints, roles, token expiry, rate limiting |
|                    | Serving an ML Model `/fullstack-ml` | A scikit-learn model behind FastAPI: predictions, explanations, batch CSV, model report, latency |
|                    | Files, Jobs & Real-time `/fullstack-realtime` | Uploads with progress, background jobs, WebSockets (live chart, chat), server-sent events |
| Libraries          | Material UI `/mui`             | MUI components, theming, the `sx` prop, Grid & breakpoints                                   |

The D3 pages share two small hooks worth reading first: `src/hooks/useElementSize.js` (makes a chart
fit its container) and `src/hooks/useChartTheme.js` (gives D3 the chart colours for the current light/dark
theme). The chart colours themselves are CSS variables in `src/index.css` (`--chart-1` … `--chart-8`,
`--seq-*`, `--div-*`) and were checked for colour-blind safety in both themes.

App-wide features you can study too: light/dark theme (`src/context/ThemeContext.jsx`), global toast
notifications (`src/context/ToastContext.jsx`), header search with keyboard shortcut `/`
(`src/components/layout/PageSearch.jsx`), lazy-loaded pages with `Suspense`, an error boundary around
every page, and a responsive sidebar that becomes a drawer on phones.

---

## 3. The FastAPI back end

The `backend/` folder is a real Python API that the Full-Stack pages call. In development you run
**two servers in two terminals**; the React dev server forwards every `/api/...` request (including
WebSockets) to FastAPI, so the browser never has to deal with CORS (see `vite.config.js`).

```
Browser ──► React dev server :3000 ──/api/*──► FastAPI (uvicorn) :8000 ──► SQLite / ML model
```

**Terminal 1 – back end** (Python 3.10+):

```bash
cd backend
python -m venv .venv                 # first time only
#source .venv/bin/activate            # Windows: .venv\Scripts\activate
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt      # first time only
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 – front end:**

```bash
npm start
```

- Interactive API docs (generated from the code): <http://localhost:8000/api/docs>
- Run the back-end tests: `cd backend && python -m pytest` (or `npm run test:backend` with the venv active)
- Demo accounts for the login page: `student / student123` and `lecturer / lecturer123`
- Settings come from environment variables (`SECRET_KEY`, `DATABASE_URL`, `CORS_ORIGINS`, …) – see
  `backend/app/config.py`. For a production front end, set `VITE_API_URL` (see `.env.example`).

```
backend/
├── requirements.txt
├── app/
│   ├── main.py          ← creates the FastAPI app, CORS, includes every router
│   ├── config.py        ← settings from environment variables
│   ├── database.py      ← SQLite engine, SessionDep, demo-data seeders
│   ├── security.py      ← password hashing, JWT tokens, CurrentUser, require_role
│   ├── models/          ← database tables (SQLModel)
│   ├── routers/         ← one file per feature: basics, students, auth, ml, files, jobs, realtime
│   └── ml/              ← features, synthetic data, training script, model loading
└── tests/               ← pytest tests for every router
```

The React side talks to it through one small wrapper, `src/api/client.js` (base URL, JSON, auth header,
timeouts, and FastAPI error → `ApiError` with per-field messages), and `<BackendStatus />` shows on every
Full-Stack page whether the back end is running.

---

## 4. Project structure

```
React_demo/
├── backend/                 ← the FastAPI back end (see section 3)
├── index.html               ← the only HTML page; React renders into <div id="root">
├── package.json             ← dependencies and npm scripts
├── vite.config.js           ← build tool configuration (dev server on port 3000)
├── public/                  ← static files served as-is (favicon)
└── src/
    ├── main.jsx             ← entry point: providers + createRoot(...).render(<App />)
    ├── App.jsx              ← all the routes (which page to show for which URL)
    ├── index.css            ← global styles, design tokens, light/dark themes
    ├── components/
    │   ├── layout/          ← Layout, Header, Sidebar, Footer, PageSearch…
    │   └── common/          ← DemoCard, CodeBlock, PageHeader, Callout, ErrorBoundary…
    ├── context/             ← ThemeContext, ToastContext
    ├── hooks/               ← useFetch, useLocalStorage, useWindowSize, useElementSize, useChartTheme…
    ├── data/                ← navigation list + mock student data
    └── pages/
        └── <topic>/
            ├── <Topic>Page.jsx   ← the page: headings + DemoCards
            └── demos/            ← one small, self-contained file per example
```

### How a page is built

```jsx
import Counter from './demos/Counter.jsx';          // the component (Preview tab)
import counterCode from './demos/Counter.jsx?raw';  // the same file as plain text (Code tab)

<DemoCard title="Counter" concepts={['useState']} code={counterCode} filename="Counter.jsx">
  <Counter />
</DemoCard>
```

The `?raw` suffix is a Vite feature that imports a file's contents as a string. The page imports each
demo file twice, so the code you read is always the code that runs.

---

## 5. Exercise: add your own example

1. Create `src/pages/state/demos/MyDemo.jsx` that exports a component.
2. In `src/pages/state/StatePage.jsx` import it twice (normally and with `?raw`).
3. Add a `<DemoCard>` that renders it. Save, and the browser updates immediately.
4. Challenge: add a whole new page by creating a folder in `src/pages/`, adding a `<Route>` in
   `App.jsx` and an entry in `src/data/navigation.js`. The sidebar, the search and the home page will pick it up.

---

## 6. Create React App vs Vite

The lecture slides use Create React App (CRA). CRA is deprecated, and this project uses **Vite**, the
build tool the React docs recommend for a plain React app. The React code is the same; only a few
file names differ:

| Create React App      | This project (Vite)             |
| --------------------- | ------------------------------- |
| `src/index.js`        | `src/main.jsx`                  |
| `src/App.js`          | `src/App.jsx`                   |
| `public/index.html`   | `index.html` (project root)     |
| `npm start`           | `npm start` / `npm run dev`     |
| `build/`              | `dist/`                         |
| `process.env.REACT_APP_X` | `import.meta.env.VITE_X`    |

Start your own project with:

```bash
npm create vite@latest my-app -- --template react
```

---

## 7. Further reading

- React docs: <https://react.dev/learn>
- React Router: <https://reactrouter.com>
- D3: <https://d3js.org> and the example gallery <https://observablehq.com/@d3/gallery>
- FastAPI: <https://fastapi.tiangolo.com/tutorial/> · SQLModel: <https://sqlmodel.tiangolo.com> · Pydantic: <https://docs.pydantic.dev>
- MUI: <https://mui.com/material-ui/getting-started/>
- MDN HTML elements reference: <https://developer.mozilla.org/en-US/docs/Web/HTML/Element>
- CSS-Tricks Flexbox guide: <https://css-tricks.com/snippets/css/a-guide-to-flexbox/>

---

## Copyright

© 2026 Ricky Dong · [rdong@swin.edu.au](mailto:rdong@swin.edu.au)

Teaching material for COS30049 Computing Technology Innovation Project, Swinburne University of Technology.
