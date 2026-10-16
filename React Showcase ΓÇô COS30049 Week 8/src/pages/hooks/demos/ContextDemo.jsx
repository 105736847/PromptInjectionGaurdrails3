/**
 * ContextDemo – useContext: skip the prop drilling.
 *
 *   1. const LanguageContext = createContext('en');      create the "channel"
 *   2. <LanguageContext value={language}> … </…>          provide a value to a subtree
 *   3. const language = useContext(LanguageContext);      read it anywhere below
 *
 * <Page> and <Sidebar> don't mention the language at all – <Greeting>, three
 * levels down, reads it directly. The nearest provider above a component wins,
 * so a nested provider can override the value for part of the tree.
 *
 * The app's colour theme works the same way: useTheme() (src/context/ThemeContext.jsx)
 * is just useContext(ThemeContext) wrapped in a custom hook.
 */
import { createContext, useContext, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext.jsx';

const LanguageContext = createContext('en'); // 'en' is used when there is NO provider above

const TEXT = {
  en: { hello: 'Hello', welcome: 'Welcome to COS30049!', label: 'English' },
  zh: { hello: '你好', welcome: '欢迎来到 COS30049！', label: '中文' },
  vi: { hello: 'Xin chào', welcome: 'Chào mừng bạn đến với COS30049!', label: 'Tiếng Việt' },
};

// Deep in the tree: reads the context directly – no props needed.
function Greeting() {
  const language = useContext(LanguageContext);
  const { hello, welcome } = TEXT[language];
  return (
    <div className="hooks-ctx-box is-consumer">
      <span className="hooks-ctx-label">&lt;Greeting&gt; useContext → “{language}”</span>
      <p className="m-0" lang={language}><strong>{hello}!</strong> {welcome}</p>
    </div>
  );
}

// These two components just render children – they know nothing about the language.
function Sidebar() {
  return (
    <div className="hooks-ctx-box">
      <span className="hooks-ctx-label">&lt;Sidebar&gt; (no props)</span>
      <Greeting />
    </div>
  );
}

function Page() {
  return (
    <div className="hooks-ctx-box">
      <span className="hooks-ctx-label">&lt;Page&gt; (no props)</span>
      <Sidebar />
    </div>
  );
}

function ThemeReader() {
  const { theme, toggleTheme } = useTheme(); // the app-wide context from main.jsx
  return (
    <div className="row">
      <span>
        Global theme from <code>useTheme()</code>: <strong>{theme}</strong>
      </span>
      <button type="button" className="btn btn-sm" onClick={toggleTheme}>
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} Switch to {theme === 'dark' ? 'light' : 'dark'}
      </button>
    </div>
  );
}

export default function ContextDemo() {
  const [language, setLanguage] = useState('en');

  return (
    <div className="stack">
      <div className="btn-group" role="group" aria-label="Language">
        {Object.entries(TEXT).map(([code, { label }]) => (
          <button key={code} type="button" className={`btn btn-sm ${language === code ? 'active' : ''}`}
            aria-pressed={language === code} onClick={() => setLanguage(code)} lang={code}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid-2">
        {/* React 19: the context itself is the provider. (Older code: <LanguageContext.Provider value={…}>) */}
        <LanguageContext value={language}>
          <Page />
        </LanguageContext>

        {/* A nested provider overrides the value for its own subtree. */}
        <LanguageContext value="vi">
          <div className="stack-sm">
            <span className="small muted">This subtree has its own provider (always “vi”):</span>
            <Sidebar />
          </div>
        </LanguageContext>
      </div>

      <ThemeReader />
    </div>
  );
}
