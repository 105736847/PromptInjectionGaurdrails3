/**
 * ApiKeyDemo – a dependency that reads a HEADER and can say "no".
 *
 * On the server, require_api_key() runs BEFORE staff_notes(). If the
 * X-API-Key header is missing or wrong it raises 401 and the endpoint
 * never runs. In React, extra headers go in the `headers` option of client.js.
 */
import { useState } from 'react';
import { KeyRound, Send } from 'lucide-react';

import { api } from '../../../api/client.js';
import useRequest from './useRequest.js';
import { OfflineNote, StatusBadge } from './ResponseView.jsx';

const PATH = '/api/basics/staff/notes?limit=3';

export default function ApiKeyDemo() {
  const [sendKey, setSendKey] = useState(false);
  const [key, setKey] = useState('teaching-key');
  const { send, loading, result } = useRequest();

  const headers = sendKey ? { 'X-API-Key': key } : {};

  function handleSend() {
    send('GET', PATH, (signal) => api.get(PATH, { headers, signal }));
  }

  return (
    <div className="stack">
      <div className="row">
        <label className="switch">
          <input type="checkbox" checked={sendKey} onChange={(e) => setSendKey(e.target.checked)} />
          <span className="switch-track" /> Send the <code>X-API-Key</code> header
        </label>
        <label className="fastapi-inline-field">
          <KeyRound size={16} aria-hidden="true" />
          <span className="visually-hidden">API key</span>
          <input className="input fastapi-input-md mono" value={key} onChange={(e) => setKey(e.target.value)} disabled={!sendKey} />
        </label>
        <button type="button" className="btn btn-primary" onClick={handleSend} disabled={loading}>
          <Send size={16} aria-hidden="true" /> Send
        </button>
      </div>

      <pre className="demo-output" aria-label="The request that will be sent">
        {`GET ${PATH}\nAccept: application/json${sendKey ? `\nX-API-Key: ${key}` : ''}`}
      </pre>

      <div aria-live="polite" className="stack-sm">
        {/* Offline = the request never reached FastAPI, so there is nothing to explain. */}
        {result && !result.error?.isOffline && (
          <p className="row m-0">
            <StatusBadge status={result.status} />
            <span className="small muted">
              {result.error ? 'require_api_key() raised HTTPException – staff_notes() never ran.' : 'The dependency passed, then staff_notes() ran.'}
            </span>
          </p>
        )}
        {result?.error?.isOffline && <OfflineNote error={result.error} />}
        {result?.error && !result.error.isOffline && <p className="error-text m-0">detail: “{result.error.detail}”</p>}
        {result?.data && (
          <ul className="fastapi-list">
            {result.data.items.map((item) => (
              <li key={item.note}><strong>{item.author}:</strong> {item.note}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
