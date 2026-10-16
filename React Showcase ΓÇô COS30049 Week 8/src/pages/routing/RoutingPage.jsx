/**
 * RoutingPage – App.jsx mounts this page at "routing/*". The "/*" lets the
 * page render its OWN <Routes> (see demos/StudentRoutes.jsx), so every URL
 * that starts with /routing shows this page, and the mini browser below
 * decides what to display for the rest of the URL.
 */
import PageHeader from '../../components/common/PageHeader.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';
import CodeBlock from '../../components/common/CodeBlock.jsx';
import appCode from '../../App.jsx?raw';

import { AuthProvider } from './demos/AuthContext.jsx';
import LinkVsAnchor from './demos/LinkVsAnchor.jsx';
import linkVsAnchorCode from './demos/LinkVsAnchor.jsx?raw';
import MiniBrowser from './demos/MiniBrowser.jsx';
import miniBrowserCode from './demos/MiniBrowser.jsx?raw';
import studentRoutesCode from './demos/StudentRoutes.jsx?raw';
import studentDirectoryCode from './demos/StudentDirectory.jsx?raw';
import studentDetailCode from './demos/StudentDetail.jsx?raw';
import breadcrumbsCode from './demos/Breadcrumbs.jsx?raw';
import routeNotFoundCode from './demos/RouteNotFound.jsx?raw';
import AuthStatus from './demos/AuthStatus.jsx';
import authStatusCode from './demos/AuthStatus.jsx?raw';
import authContextCode from './demos/AuthContext.jsx?raw';
import requireAuthCode from './demos/RequireAuth.jsx?raw';
import loginPageCode from './demos/LoginPage.jsx?raw';
import adminPageCode from './demos/AdminPage.jsx?raw';
import NavigationPlayground from './demos/NavigationPlayground.jsx';
import navigationPlaygroundCode from './demos/NavigationPlayground.jsx?raw';
import NavLinkDemo from './demos/NavLinkDemo.jsx';
import navLinkDemoCode from './demos/NavLinkDemo.jsx?raw';
import LazyRouteDemo from './demos/LazyRouteDemo.jsx';
import lazyRouteDemoCode from './demos/LazyRouteDemo.jsx?raw';
import campusReportCode from './demos/CampusReport.jsx?raw';
import fastApiFallback from './snippets/spa_fallback.py?raw';
import netlifyRedirects from './snippets/netlify_redirects.txt?raw';
import vercelJson from './snippets/vercel.json?raw';
import './routing.css';

const ROUTE_TABLE = [
  { url: '/routing', route: 'index', shows: 'StudentDirectory (reads ?major=…&q=…)' },
  { url: '/routing/students/3', route: 'students/:studentId', shows: 'StudentDetail – useParams() → { studentId: "3" }' },
  { url: '/routing/students', route: 'students', shows: '<Navigate to="/routing" replace />' },
  { url: '/routing/old-directory', route: 'old-directory', shows: '<Navigate to="/routing" replace />' },
  { url: '/routing/login', route: 'login', shows: 'LoginPage' },
  { url: '/routing/admin', route: 'admin', shows: 'RequireAuth → AdminPage, or a redirect to /routing/login' },
  { url: '/routing/anything-else', route: '*', shows: 'RouteNotFound (404)' },
];

export default function RoutingPage() {
  return (
    // One pretend login for the whole page, shared by the portal and the status panel.
    <AuthProvider>
      <PageHeader
        eyebrow="Data & Navigation"
        title="React Router"
        intro="A single-page app has only one HTML page, yet every screen has its own URL that you can bookmark, share and reach with the Back button. React Router maps URLs to components – on the client, without asking the server for a new page."
        concepts={['<Routes> / <Route>', '<Link>', '<NavLink>', 'useParams', 'useSearchParams', 'useNavigate', '<Navigate>', 'nested routes', 'lazy()']}
        docs={[
          { label: 'React Router docs', href: 'https://reactrouter.com/home' },
          { label: 'MDN: History API', href: 'https://developer.mozilla.org/en-US/docs/Web/API/History_API' },
          { label: 'React: lazy', href: 'https://react.dev/reference/react/lazy' },
        ]}
      />

      <SectionTitle
        title="How client-side routing works"
        intro="In a traditional multi-page site, every click downloads a new HTML page. In a SPA, the first request downloads the app once; after that, React Router watches the URL and swaps components. The sidebar of this showcase is a list of <NavLink>s – that’s why the current page is highlighted."
      />
      <div className="demo-card">
        <CodeBlock code={appCode} filename="src/App.jsx – the real route configuration of this app" />
      </div>

      <DemoCard
        title="<Link> vs <a href>"
        description="Both change the URL, but only one keeps your app alive. Click the counter, then follow each link."
        concepts={['<Link>', 'History API', 'full page reload', 'state survives']}
        code={linkVsAnchorCode}
        filename="LinkVsAnchor.jsx"
      >
        <LinkVsAnchor />
      </DemoCard>

      <Callout type="warning" title="Use <Link>, and remember the server fallback">
        <ul>
          <li>
            Inside your app, navigate with <code>&lt;Link to=&quot;/…&quot;&gt;</code> (or <code>navigate()</code>).
            A plain <code>&lt;a href&gt;</code> reloads the whole page: all state is lost and the app starts again.
            Keep <code>&lt;a&gt;</code> for links to <em>other</em> websites.
          </li>
          <li>
            If someone opens <code>/routing/students/3</code> directly (or presses refresh), the <em>server</em>{' '}
            receives that URL. It must answer with <code>index.html</code> so React Router can take over. The
            Vite dev server does this automatically; for deployment, see the last section of this page.
          </li>
        </ul>
      </Callout>

      <SectionTitle
        title="A mini app with nested routes"
        intro="The window below is a small student portal with its own routes. Everything in it is driven by the real URL – use the bookmarks, type in the address bar, press Back and Forward. The paths inside the page are relative to /routing:"
      />
      <div className="table-wrap routing-route-table">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">URL</th>
              <th scope="col">
                Matching <code>&lt;Route path&gt;</code>
              </th>
              <th scope="col">What renders</th>
            </tr>
          </thead>
          <tbody>
            {ROUTE_TABLE.map((row) => (
              <tr key={row.url}>
                <td className="mono small">{row.url}</td>
                <td className="mono small">{row.route}</td>
                <td className="small">{row.shows}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DemoCard
        title="Student portal in a mini browser"
        description="Filter the directory (the filters are stored in the URL), open a student (URL parameter), use Random student or Open # (navigate from code), try the old URL (redirect), the admin page (protected) and a typo (catch-all 404)."
        concepts={['<Routes>', 'layout route + <Outlet>', 'useParams', 'useSearchParams', 'useNavigate', '<Navigate>', 'path="*"', 'key to reset state']}
        files={[
          { name: 'MiniBrowser.jsx', code: miniBrowserCode },
          { name: 'StudentRoutes.jsx', code: studentRoutesCode },
          { name: 'StudentDirectory.jsx', code: studentDirectoryCode },
          { name: 'StudentDetail.jsx', code: studentDetailCode },
          { name: 'Breadcrumbs.jsx', code: breadcrumbsCode },
          { name: 'RouteNotFound.jsx', code: routeNotFoundCode },
        ]}
      >
        <MiniBrowser />
      </DemoCard>

      <SectionTitle
        title="Protected routes"
        intro="Some pages need a logged-in user. A small wrapper component checks the login and either renders the page or redirects to the login screen – remembering where the user wanted to go."
      />
      <DemoCard
        title="RequireAuth + redirect back after login"
        description="The login is pretend (plain React state in a context), but the routing pattern is the real one. Use this panel together with the mini browser above."
        concepts={['guard component', '<Navigate replace state>', 'location.state', 'createContext', 'useNavigate']}
        files={[
          { name: 'RequireAuth.jsx', code: requireAuthCode },
          { name: 'LoginPage.jsx', code: loginPageCode },
          { name: 'AuthContext.jsx', code: authContextCode },
          { name: 'AdminPage.jsx', code: adminPageCode },
          { name: 'AuthStatus.jsx', code: authStatusCode },
        ]}
      >
        <AuthStatus />
      </DemoCard>

      <Callout type="note" title="Front-end protection is only half the job">
        <p>
          Hiding a page in React only changes what the browser <em>shows</em>. Anyone can open DevTools and call your
          API directly, so your FastAPI back-end must check the user’s token on every protected endpoint too.
        </p>
      </Callout>

      <SectionTitle
        title="Router hooks and NavLink"
        intro="Hooks give any component access to the URL and to navigation. Try the buttons and watch the values change – the mini browser above follows along."
      />
      <DemoCard
        title="useLocation, useParams, useSearchParams & useNavigate"
        description="Push vs replace, passing state, reading the query string – with the live values in a table. After “Go to /students/7 with state”, scroll up: the student page shows the note."
        concepts={['useLocation', 'useNavigate', 'replace', 'state', 'useMatch', 'useParams']}
        code={navigationPlaygroundCode}
        filename="NavigationPlayground.jsx"
      >
        <NavigationPlayground />
      </DemoCard>

      <DemoCard
        title="NavLink: styling the active link"
        description="The same links twice: once without and once with the end prop. Click them and compare which ones light up."
        concepts={['<NavLink>', 'isActive', 'end', 'aria-current']}
        code={navLinkDemoCode}
        filename="NavLinkDemo.jsx"
      >
        <NavLinkDemo />
      </DemoCard>

      <SectionTitle
        title="Loading pages on demand"
        intro="Every page of this showcase is loaded with lazy() in App.jsx, so students only download the code for the pages they open."
      />
      <DemoCard
        title="lazy() + <Suspense>"
        description="The component below lives in its own JavaScript file and is only downloaded when you first ask for it."
        concepts={['React.lazy', 'dynamic import()', '<Suspense fallback>', 'code splitting']}
        files={[
          { name: 'LazyRouteDemo.jsx', code: lazyRouteDemoCode },
          { name: 'CampusReport.jsx', code: campusReportCode },
        ]}
      >
        <LazyRouteDemo />
      </DemoCard>

      <SectionTitle
        title="Deploying a SPA: the index.html fallback"
        intro="In production, the server must return index.html for every app URL (but still serve real files and API routes). Pick the one that matches where you deploy."
      />
      <div className="demo-card">
        <CodeBlock code={fastApiFallback} filename="main.py – FastAPI serves the React build" language="python" />
      </div>
      <div className="grid-2">
        <div className="demo-card">
          <CodeBlock code={netlifyRedirects} filename="public/_redirects (Netlify)" language="shell" />
        </div>
        <div className="demo-card">
          <CodeBlock code={vercelJson} filename="vercel.json (Vercel)" language="json" />
        </div>
      </div>

      <Callout type="exercise">
        <ol>
          <li>
            In <code>StudentRoutes.jsx</code>, add a route <code>students/:studentId/edit</code> with a small edit
            page, and link to it from <code>StudentDetail.jsx</code>. What does <code>useParams()</code> return there?
          </li>
          <li>
            In <code>StudentDirectory.jsx</code>, add a “Campus” filter stored as <code>?campus=…</code> in the URL.
            Copy the URL, open it in a new tab and check that the filter is restored.
          </li>
          <li>
            Make the “Back to the directory” link in <code>StudentDetail.jsx</code> keep the directory’s filters.
            Hint: pass the search string in <code>state</code> from <code>StudentDirectory.jsx</code>.
          </li>
          <li>
            In <code>RequireAuth.jsx</code>, add a <code>role</code> check so only users with{' '}
            <code>{"role: 'admin'"}</code> may see the admin page; others get a “Not allowed” message.
          </li>
          <li>
            Add a new top-level page to this app: create the component, add a <code>&lt;Route&gt;</code> in{' '}
            <code>App.jsx</code> and an entry in <code>src/data/navigation.js</code> so it appears in the sidebar.
          </li>
        </ol>
      </Callout>
    </AuthProvider>
  );
}
