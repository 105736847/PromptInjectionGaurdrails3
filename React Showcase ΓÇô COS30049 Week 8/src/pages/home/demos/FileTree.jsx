import { useState } from 'react';
import { ChevronRight, File, Folder, FolderOpen } from 'lucide-react';

/**
 * FileTree – renders nested data by calling ITSELF for every sub-folder.
 * (A component that renders itself is called a recursive component.)
 */
const projectFiles = {
  name: 'React_demo',
  children: [
    { name: 'node_modules/', note: 'installed packages – never edit, never commit' },
    { name: 'public/', children: [{ name: 'favicon.svg', note: 'static files, served as-is' }] },
    {
      name: 'src/',
      note: 'all of your React code lives here',
      children: [
        { name: 'main.jsx', note: 'entry point – renders <App /> into #root (index.js in CRA)' },
        { name: 'App.jsx', note: 'root component – defines the routes' },
        { name: 'index.css', note: 'global styles + light/dark theme tokens' },
        {
          name: 'components/',
          note: 'reusable pieces shared by many pages',
          children: [
            { name: 'layout/', note: 'Header, Sidebar, Footer, Layout' },
            { name: 'common/', note: 'DemoCard, CodeBlock, PageHeader, ErrorBoundary…' },
          ],
        },
        { name: 'context/', note: 'ThemeContext, ToastContext (global state)' },
        { name: 'hooks/', note: 'custom hooks: useFetch, useLocalStorage…' },
        { name: 'data/', note: 'navigation list + mock JSON data' },
        {
          name: 'pages/',
          note: 'one folder per page',
          children: [
            {
              name: 'forms/',
              children: [
                { name: 'FormsPage.jsx', note: 'the page itself' },
                { name: 'demos/', note: 'one small file per example' },
              ],
            },
            { name: '…' },
          ],
        },
      ],
    },
    { name: 'index.html', note: 'the single HTML page with <div id="root">' },
    { name: 'package.json', note: 'dependencies + scripts (npm start, npm run build)' },
    { name: 'vite.config.js', note: 'build tool configuration' },
  ],
};

function TreeNode({ node, depth = 0 }) {
  const isFolder = Boolean(node.children);
  const [open, setOpen] = useState(depth < 2); // open the first two levels

  const Icon = isFolder ? (open ? FolderOpen : Folder) : File;

  return (
    <li>
      <div className="tree-row" style={{ paddingLeft: depth * 18 }}>
        {isFolder ? (
          <button
            type="button"
            className="tree-toggle"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
          >
            <ChevronRight size={14} className={open ? 'rotated' : ''} />
            <Icon size={16} />
            <span className="mono">{node.name}</span>
          </button>
        ) : (
          <span className="tree-leaf">
            <Icon size={16} />
            <span className="mono">{node.name}</span>
          </span>
        )}
        {node.note && <span className="tree-note">{node.note}</span>}
      </div>

      {/* The recursive part: render a TreeNode for every child */}
      {isFolder && open && (
        <ul>
          {node.children.map((child) => (
            <TreeNode key={child.name} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function FileTree() {
  return (
    <ul className="file-tree">
      <TreeNode node={projectFiles} />
    </ul>
  );
}
