export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="app-footer-credit">
          <span>
            © {year} Ricky Dong · <a href="mailto:rdong@swin.edu.au">rdong@swin.edu.au</a>
          </span>
          <span>COS30049 Computing Technology Innovation Project · React Showcase</span>
        </div>
        <nav aria-label="External resources">
          <a href="https://react.dev" target="_blank" rel="noreferrer">
            React docs
          </a>
          <a href="https://vite.dev" target="_blank" rel="noreferrer">
            Vite
          </a>
          <a href="https://reactrouter.com" target="_blank" rel="noreferrer">
            React Router
          </a>
          <a href="https://mui.com/material-ui/" target="_blank" rel="noreferrer">
            MUI
          </a>
          <a href="https://developer.mozilla.org/en-US/docs/Web/HTML" target="_blank" rel="noreferrer">
            MDN
          </a>
        </nav>
      </div>
    </footer>
  );
}
