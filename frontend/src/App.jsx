import { Routes, Route } from 'react-router';
import { lazy } from 'react';
import Layout from './components/layout/Layout.jsx';

const HomePage = lazy(() => import ('./pages/home/HomePage.jsx'))
const ResultsPage = lazy(() => import('./pages/results/ResultsPage.jsx'))
const AboutUsPage = lazy(() => import('./pages/about_us/AboutUs.jsx'))
const OurData = lazy(() => import('./pages/our_data/OurData.jsx'))
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/aboutUs" element={<AboutUsPage/>}/> 
        <Route path="/results" element={<ResultsPage/>} />
        <Route path="/ourData" element={<OurData/>}/>
      </Route>
    </Routes>
  );
}

export default App;