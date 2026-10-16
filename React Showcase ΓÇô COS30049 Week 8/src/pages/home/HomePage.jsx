import { Link } from 'react-router-dom';
import { ArrowRight, MousePointerClick, RefreshCw, MonitorSmartphone } from 'lucide-react';

import PageHeader from '../../components/common/PageHeader.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import CodeBlock from '../../components/common/CodeBlock.jsx';
import Callout from '../../components/common/Callout.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import { navSections } from '../../data/navigation.js';

import HelloReact from './demos/HelloReact.jsx';
import helloReactCode from './demos/HelloReact.jsx?raw';
import FileTree from './demos/FileTree.jsx';
import fileTreeCode from './demos/FileTree.jsx?raw';
import './home.css';

const commands = `# 1. Install the dependencies listed in package.json (only needed once)
npm install

# 2. Start the development server → http://localhost:3000
npm start

# 3. Create an optimised production build in the dist/ folder
npm run build

# How this project was created in the first place:
npm create vite@latest my-app -- --template react`;

export default function HomePage() {
  // Every page except "Overview" becomes a topic card.
  const topicSections = navSections.filter((section) => section.heading !== 'Getting Started');

  return (
    <>
      <section className="hero">
        <PageHeader
          eyebrow="COS30049 · Week 8 · Front-End with React"
          title="Build rich, interactive front-ends with React"
          intro="A hands-on tour of the building blocks of a modern web interface. Every example on these pages is live – click it, type in it, break it – and every example can flip over to show the exact code that produces it."
        />
        <div className="row">
          <Link to="/jsx" className="btn btn-primary btn-lg">
            Start with JSX & Components <ArrowRight size={18} />
          </Link>
          <a className="btn btn-lg" href="https://react.dev/learn" target="_blank" rel="noreferrer">
            Official React tutorial
          </a>
        </div>
      </section>

      <DemoCard
        title="Your first component"
        description="Type your name or click the button. Nothing reloads – React updates just the parts of the page that changed."
        concepts={['function component', 'JSX', 'useState', 'onChange', 'onClick']}
        code={helloReactCode}
        filename="HelloReact.jsx"
      >
        <HelloReact />
      </DemoCard>

      <SectionTitle
        title="How React updates the screen"
        intro="Data in React flows in one direction. Keep this loop in mind – every interactive example in this showcase follows it."
      />
      <ol className="cycle" aria-label="The React render cycle">
        <li className="cycle-step">
          <span className="cycle-icon"><RefreshCw size={20} /></span>
          <strong>1. State</strong>
          <span>Holds the data that can change, e.g. <code>const [count, setCount] = useState(0)</code></span>
        </li>
        <li className="cycle-step">
          <span className="cycle-icon"><MonitorSmartphone size={20} /></span>
          <strong>2. View (render)</strong>
          <span>The component returns JSX that describes the UI for the current state.</span>
        </li>
        <li className="cycle-step">
          <span className="cycle-icon"><MousePointerClick size={20} /></span>
          <strong>3. Event</strong>
          <span>The user clicks or types; an event handler calls <code>setCount(count + 1)</code>.</span>
        </li>
      </ol>
      <p className="cycle-note muted small">
        ↻ Calling a setter updates the state, which triggers a re-render, which shows the new view…
      </p>

      <SectionTitle title="Topics" intro="Work through them in order, or jump to whatever you need for your assignment." />
      {topicSections.map((section) => (
        <div key={section.heading} className="topic-group">
          <h3 className="topic-heading">{section.heading}</h3>
          <div className="grid-auto">
            {section.items.map(({ path, label, description, icon: Icon }) => (
              <Link key={path} to={path} className="card card-hover topic-card">
                <span className="topic-icon"><Icon size={20} /></span>
                <strong>{label}</strong>
                <span className="muted small">{description}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      <SectionTitle title="How to use this showcase" />
      <Callout type="tip" title="Preview ⇄ Code">
        <p>
          Every example sits in a card with two tabs. <strong>Preview</strong> runs the component;{' '}
          <strong>Code</strong> shows its real source file from <code>src/pages/&lt;topic&gt;/demos/</code>. The
          page imports the file twice: once as a component and once as text using Vite’s{' '}
          <code>?raw</code> suffix – so the code you read is always the code that runs.
        </p>
      </Callout>

      <DemoCard
        title="Project structure"
        description="Click the folders. This tree is itself a React component that renders itself for every sub-folder."
        concepts={['recursive component', 'props', 'map()', 'key']}
        code={fileTreeCode}
        filename="FileTree.jsx"
      >
        <FileTree />
      </DemoCard>

      <SectionTitle title="Running the project" />
      <div className="demo-card">
        <CodeBlock code={commands} filename="Terminal" language="shell" />
      </div>

      <Callout type="note" title="Create React App vs. Vite">
        <p>
          The lecture slides use Create React App (CRA). CRA is no longer maintained, so this project uses{' '}
          <strong>Vite</strong> – the React team’s recommended way to start a plain React app. The ideas
          are identical; only a few file names differ:
        </p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Create React App</th>
                <th>This project (Vite)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>src/index.js</code></td>
                <td><code>src/main.jsx</code></td>
              </tr>
              <tr>
                <td><code>src/App.js</code></td>
                <td><code>src/App.jsx</code></td>
              </tr>
              <tr>
                <td><code>public/index.html</code></td>
                <td><code>index.html</code> (project root)</td>
              </tr>
              <tr>
                <td><code>npm start</code></td>
                <td><code>npm start</code> (or <code>npm run dev</code>)</td>
              </tr>
              <tr>
                <td><code>build/</code></td>
                <td><code>dist/</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Callout>
    </>
  );
}
