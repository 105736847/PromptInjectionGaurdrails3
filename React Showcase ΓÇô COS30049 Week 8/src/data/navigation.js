/**
 * navigation.js – one list that describes every page in the app.
 *
 * Keeping this as plain data (instead of hard-coding links in JSX) means the
 * Sidebar, the Home page cards and the header search all stay in sync:
 * add an item here and it appears everywhere.
 */
import {
  House,
  Braces,
  Zap,
  RefreshCw,
  Type,
  ClipboardList,
  Image,
  LayoutGrid,
  Palette,
  PanelsTopLeft,
  MessageSquare,
  Table,
  Globe,
  Route,
  Package,
  ChartSpline,
  ChartScatter,
  Network,
  BrainCircuit,
  Server,
  Database,
  KeyRound,
  Cpu,
  Radio,
} from 'lucide-react';

export const navSections = [
  {
    heading: 'Getting Started',
    items: [
      {
        path: '/',
        label: 'Overview',
        icon: House,
        description: 'What this showcase covers and how a React app is put together.',
      },
    ],
  },
  {
    heading: 'React Fundamentals',
    items: [
      {
        path: '/jsx',
        label: 'JSX & Components',
        icon: Braces,
        description: 'JSX syntax, components, props, children, conditional rendering, lists and keys.',
      },
      {
        path: '/state',
        label: 'State & Events',
        icon: Zap,
        description: 'useState, event handlers, controlled inputs, lifting state up and useReducer.',
      },
      {
        path: '/hooks',
        label: 'Hooks & Lifecycle',
        icon: RefreshCw,
        description: 'useEffect, useRef, useMemo, useContext, custom hooks and class components.',
      },
    ],
  },
  {
    heading: 'HTML Elements',
    items: [
      {
        path: '/typography',
        label: 'Text & Content',
        icon: Type,
        description: 'Headings, text semantics, lists, quotes, code, tables and disclosure widgets.',
      },
      {
        path: '/forms',
        label: 'Forms & Inputs',
        icon: ClipboardList,
        description: 'Every input type, validation, file upload and submitting form data.',
      },
      {
        path: '/media',
        label: 'Media & Graphics',
        icon: Image,
        description: 'Images, galleries, video and audio players, canvas drawing, SVG and iframes.',
      },
    ],
  },
  {
    heading: 'UI & Layout',
    items: [
      {
        path: '/layout',
        label: 'Layout & Responsive',
        icon: LayoutGrid,
        description: 'Flexbox and CSS Grid playgrounds, page layouts and responsive breakpoints.',
      },
      {
        path: '/styling',
        label: 'Styling in React',
        icon: Palette,
        description: 'CSS files, className, inline styles, CSS Modules, CSS variables and animation.',
      },
      {
        path: '/components',
        label: 'UI Components',
        icon: PanelsTopLeft,
        description: 'Tabs, accordion, dropdown, carousel, stepper, pagination, breadcrumbs.',
      },
      {
        path: '/feedback',
        label: 'Overlays & Feedback',
        icon: MessageSquare,
        description: 'Modals, toasts, tooltips, alerts, progress, skeletons, badges and ratings.',
      },
    ],
  },
  {
    heading: 'Data & Navigation',
    items: [
      {
        path: '/data',
        label: 'Data Display',
        icon: Table,
        description: 'Sortable, searchable tables, card views and hand-made SVG charts.',
      },
      {
        path: '/api',
        label: 'Fetching Data (APIs)',
        icon: Globe,
        description: 'fetch + useEffect, loading and error states, POST requests, custom useFetch.',
      },
      {
        path: '/routing',
        label: 'React Router',
        icon: Route,
        description: 'Routes, links, URL parameters, query strings, nested routes and redirects.',
      },
    ],
  },
  {
    heading: 'Data Visualization (D3)',
    items: [
      {
        path: '/d3-basics',
        label: 'D3 Fundamentals',
        icon: ChartSpline,
        description: 'Selections and the data join, scales, axes, shapes, transitions and React + D3 patterns.',
      },
      {
        path: '/d3-charts',
        label: 'Interactive Charts',
        icon: ChartScatter,
        description: 'Zoom, brush, animated transitions, streamgraphs, heatmaps, beeswarms and linked tooltips.',
      },
      {
        path: '/d3-networks',
        label: 'Networks, Trees & Maps',
        icon: Network,
        description: 'Force-directed graphs, treemaps, sunbursts, chord and Sankey diagrams, globes and maps.',
      },
      {
        path: '/d3-ml',
        label: 'Visualising ML Results',
        icon: BrainCircuit,
        description: 'Confusion matrix, ROC curves, training curves and a live decision boundary for Assignment 3.',
      },
    ],
  },
  {
    heading: 'Full-Stack (FastAPI)',
    items: [
      {
        path: '/fastapi',
        label: 'FastAPI Basics',
        icon: Server,
        description: 'How React talks to a Python back end: routes, parameters, Pydantic validation, status codes, CORS.',
      },
      {
        path: '/fullstack-crud',
        label: 'Database CRUD',
        icon: Database,
        description: 'Create, read, update and delete with SQLite: server-side search, sorting and pagination.',
      },
      {
        path: '/fullstack-auth',
        label: 'Login & JWT',
        icon: KeyRound,
        description: 'Register, log in, protected routes, tokens, roles and handling 401 / 403 in React.',
      },
      {
        path: '/fullstack-ml',
        label: 'Serving an ML Model',
        icon: Cpu,
        description: 'A scikit-learn model behind a FastAPI endpoint: predictions, explanations, batch CSV, metrics.',
      },
      {
        path: '/fullstack-realtime',
        label: 'Files, Jobs & Real-time',
        icon: Radio,
        description: 'File uploads with progress, background jobs, WebSockets and server-sent events.',
      },
    ],
  },
  {
    heading: 'Libraries',
    items: [
      {
        path: '/mui',
        label: 'Material UI (MUI)',
        icon: Package,
        description: 'Building quickly with a component library: MUI buttons, inputs, Grid and more.',
      },
    ],
  },
];

/** A flat list of every page – handy for searching and for "next / previous" links. */
export const allPages = navSections.flatMap((section) =>
  section.items.map((item) => ({ ...item, section: section.heading })),
);
