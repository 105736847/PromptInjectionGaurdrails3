/**
 * App.jsx – the root component.
 *
 * Its only job is to decide WHICH page to show for the current URL.
 * This is what makes the site a Single-Page Application (SPA): the browser
 * never loads a new HTML page, React Router just swaps components.
 *
 * Every page is loaded with React.lazy(), so the code for a page is only
 * downloaded the first time a student visits it ("code splitting").
 */
import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

import Layout from './components/layout/Layout.jsx';

const HomePage = lazy(() => import('./pages/home/HomePage.jsx'));
const JsxPage = lazy(() => import('./pages/jsx/JsxPage.jsx'));
const StatePage = lazy(() => import('./pages/state/StatePage.jsx'));
const HooksPage = lazy(() => import('./pages/hooks/HooksPage.jsx'));
const TypographyPage = lazy(() => import('./pages/typography/TypographyPage.jsx'));
const FormsPage = lazy(() => import('./pages/forms/FormsPage.jsx'));
const MediaPage = lazy(() => import('./pages/media/MediaPage.jsx'));
const LayoutPage = lazy(() => import('./pages/layout/LayoutPage.jsx'));
const StylingPage = lazy(() => import('./pages/styling/StylingPage.jsx'));
const ComponentsPage = lazy(() => import('./pages/components/ComponentsPage.jsx'));
const FeedbackPage = lazy(() => import('./pages/feedback/FeedbackPage.jsx'));
const DataPage = lazy(() => import('./pages/data/DataPage.jsx'));
const ApiPage = lazy(() => import('./pages/api/ApiPage.jsx'));
const RoutingPage = lazy(() => import('./pages/routing/RoutingPage.jsx'));
const D3BasicsPage = lazy(() => import('./pages/d3-basics/D3BasicsPage.jsx'));
const D3ChartsPage = lazy(() => import('./pages/d3-charts/D3ChartsPage.jsx'));
const D3NetworksPage = lazy(() => import('./pages/d3-networks/D3NetworksPage.jsx'));
const D3MlPage = lazy(() => import('./pages/d3-ml/D3MlPage.jsx'));
const FastApiPage = lazy(() => import('./pages/fastapi/FastApiPage.jsx'));
const CrudPage = lazy(() => import('./pages/fullstack-crud/CrudPage.jsx'));
const AuthPage = lazy(() => import('./pages/fullstack-auth/AuthPage.jsx'));
const MlServingPage = lazy(() => import('./pages/fullstack-ml/MlServingPage.jsx'));
const RealtimePage = lazy(() => import('./pages/fullstack-realtime/RealtimePage.jsx'));
const MuiPage = lazy(() => import('./pages/mui/MuiPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

export default function App() {
  return (
    <Routes>
      {/* Layout renders the header, sidebar and footer, and an <Outlet />
          where the matching child route below is displayed. */}
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="jsx" element={<JsxPage />} />
        <Route path="state" element={<StatePage />} />
        <Route path="hooks" element={<HooksPage />} />
        <Route path="typography" element={<TypographyPage />} />
        <Route path="forms" element={<FormsPage />} />
        <Route path="media" element={<MediaPage />} />
        <Route path="layout" element={<LayoutPage />} />
        <Route path="styling" element={<StylingPage />} />
        <Route path="components" element={<ComponentsPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="data" element={<DataPage />} />
        <Route path="api" element={<ApiPage />} />
        {/* The trailing "/*" lets RoutingPage define its own nested routes */}
        <Route path="routing/*" element={<RoutingPage />} />
        <Route path="d3-basics" element={<D3BasicsPage />} />
        <Route path="d3-charts" element={<D3ChartsPage />} />
        <Route path="d3-networks" element={<D3NetworksPage />} />
        <Route path="d3-ml" element={<D3MlPage />} />
        <Route path="fastapi" element={<FastApiPage />} />
        <Route path="fullstack-crud" element={<CrudPage />} />
        <Route path="fullstack-auth" element={<AuthPage />} />
        <Route path="fullstack-ml" element={<MlServingPage />} />
        <Route path="fullstack-realtime" element={<RealtimePage />} />
        <Route path="mui" element={<MuiPage />} />
        {/* "*" matches anything that did not match above → 404 page */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
