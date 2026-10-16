import { Routes, Route } from 'react-router';

import Layout from './components/layout/Layout.jsx';

import HomePage from './pages/home/HomePage.jsx';
import ResultsPage from './pages/results/ResultsPage.jsx';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="results" element={<ResultsPage />} />
      </Route>
    </Routes>
  );
}

export default App;