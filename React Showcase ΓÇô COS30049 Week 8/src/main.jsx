/**
 * main.jsx – the entry point of the application.
 *
 * (In a Create React App project this file is called `src/index.js`.)
 *
 * It does three things:
 *   1. Finds the <div id="root"> element in index.html
 *   2. Wraps the app in "providers" that every page can use
 *      (routing, colour theme, toast notifications)
 *   3. Asks React to render <App /> inside that div
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  // StrictMode runs extra checks in development (it renders components twice
  // to help you find side effects). It does nothing in the production build.
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
