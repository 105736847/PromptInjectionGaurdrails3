/**
 * BackendStatus – shows whether the FastAPI back end is reachable.
 * Put it under the PageHeader of every page that needs the back end:
 *
 *   <BackendStatus />
 *
 * Offline → explains how to start the server (with copyable commands).
 * Online  → a small green line with the API version and a link to /api/docs.
 */
import { CircleCheck, RefreshCw, ServerOff, ExternalLink } from 'lucide-react';

import useBackendStatus from '../../hooks/useBackendStatus.js';
import { API_BASE } from '../../api/client.js';
import CodeBlock from './CodeBlock.jsx';

const START_COMMANDS = `# In a second terminal, from the project folder:
cd backend
python -m venv .venv                 # first time only
source .venv/bin/activate            # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt      # first time only
uvicorn app.main:app --reload --port 8000`;

function formatUptime(seconds) {
  if (seconds < 60) return `${Math.round(seconds)} s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  return `${(seconds / 3600).toFixed(1)} h`;
}

export default function BackendStatus() {
  const { status, info, refresh } = useBackendStatus();

  if (status === 'checking') {
    return (
      <div className="backend-status backend-status-checking" role="status">
        <span className="spinner" aria-hidden="true" /> Checking the FastAPI back end…
      </div>
    );
  }

  if (status === 'online') {
    return (
      <div className="backend-status backend-status-online" role="status">
        <CircleCheck size={18} aria-hidden="true" />
        <span>
          Connected to <strong>{info.app}</strong> {info.version} · FastAPI {info.fastapi} · up{' '}
          {formatUptime(info.uptime_seconds)}
        </span>
        <a href={`${API_BASE}/api/docs`} target="_blank" rel="noreferrer">
          API docs <ExternalLink size={13} aria-hidden="true" />
        </a>
      </div>
    );
  }

  return (
    <div className="backend-status backend-status-offline" role="alert">
      <div className="row-between">
        <strong className="row">
          <ServerOff size={18} aria-hidden="true" /> The FastAPI back end is not running
        </strong>
        <button type="button" className="btn btn-sm" onClick={refresh}>
          <RefreshCw size={14} aria-hidden="true" /> Check again
        </button>
      </div>
      <p className="small m-0">
        The examples on this page talk to a real Python server. Start it, then press “Check again”:
      </p>
      <div className="demo-card m-0">
        <CodeBlock code={START_COMMANDS} filename="Terminal" language="shell" />
      </div>
    </div>
  );
}
