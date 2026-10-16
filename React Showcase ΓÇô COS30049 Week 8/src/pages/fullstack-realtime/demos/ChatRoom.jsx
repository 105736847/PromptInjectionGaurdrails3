/**
 * ChatRoom – many browsers, one WebSocket endpoint.
 *
 * The server keeps a list of every open socket (ConnectionManager in realtime.py) and
 * BROADCASTS each message to all of them. Open this page in a second tab to chat with yourself.
 * This demo uses the browser's WebSocket API directly (no custom hook), so every event –
 * open, message, close – is visible right here.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { ExternalLink, LogIn, LogOut, Send, Users } from 'lucide-react';
import { wsUrl } from '../../../api/client.js';
import ConnectionPill from './ConnectionPill.jsx';
import { formatTime } from './format.js';

export default function ChatRoom() {
  const [nickname, setNickname] = useState('');
  const [joinedAs, setJoinedAs] = useState(null); // the name we asked for; null = not in the room
  // { name, since }: the name the server gave us ("Mia (2)" if Mia was taken) + the id of our welcome
  const [me, setMe] = useState(null);
  const [status, setStatus] = useState('closed');
  const [online, setOnline] = useState(0);
  const [entries, setEntries] = useState([]); // messages + join/leave notices
  const [draft, setDraft] = useState('');
  const socketRef = useRef(null);
  const logRef = useRef(null);
  const nameId = useId();

  // Connected while `joinedAs` is set. The cleanup disconnects: on "Leave" and when the page closes.
  useEffect(() => {
    if (!joinedAs) return undefined;
    const socket = new WebSocket(wsUrl(`/api/ws/chat?name=${encodeURIComponent(joinedAs)}`));
    socketRef.current = socket;
    let opened = false;

    socket.onopen = () => {
      opened = true;
      setStatus('open');
    };
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'welcome') {
        setMe({ name: message.you, since: message.id });
        setEntries(message.history); // what was said before we arrived
      } else {
        setEntries((list) => [...list, message].slice(-100)); // keep the newest 100
      }
      if (message.type !== 'error') setOnline(message.online);
    };
    socket.onclose = (event) => {
      setStatus('closed');
      if (event.code !== 1000) {
        const detail = opened ? 'Connection lost. Leave and join again.' : 'Could not connect – start the back end (see the banner above), then join again.';
        setEntries((list) => [...list, { type: 'error', id: `closed-${list.length}`, detail }]);
        if (!opened) setJoinedAs(null); // we never got in → show the join form again
      }
    };

    return () => {
      socket.onclose = null; // a deliberate close – don't report "connection lost"
      socket.onmessage = null;
      if (socket.readyState === WebSocket.CONNECTING) socket.onopen = () => socket.close(1000);
      else socket.close(1000);
      socketRef.current = null;
    };
  }, [joinedAs]);

  // Keep the newest message in view.
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [entries]);

  function join(event) {
    event.preventDefault();
    setStatus('connecting');
    setJoinedAs(nickname.trim());
  }

  function leave() {
    setJoinedAs(null); // → the effect cleanup closes the socket → the server tells everyone we left
    setStatus('closed');
    setMe(null);
    setEntries([]);
    setOnline(0);
  }

  function send(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ text })); // the server broadcasts it – even back to us
    setDraft('');
  }

  // A name is only unique among the people online NOW: an earlier "Mia" in the history is not
  // you. The server numbers every event, so only events after our own welcome can be ours.
  const isMine = (entry) => entry.name === me?.name && entry.id > me.since;
  const who = (entry) => (isMine(entry) ? 'You' : entry.name);

  return (
    <div className="stack">
      {!joinedAs ? (
        <form className="rt-controls" onSubmit={join}>
          <div className="field" style={{ flex: '1 1 200px' }}>
            <label className="label" htmlFor={nameId}>Your nickname</label>
            <input id={nameId} className="input" value={nickname} maxLength={20} placeholder="e.g. Mia"
              onChange={(e) => setNickname(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={!nickname.trim()}>
            <LogIn size={16} aria-hidden="true" /> Join the chat
          </button>
          {/* A hash-only link keeps the current path (whatever the app's base URL) – RealtimePage scrolls to the card. */}
          <a className="btn btn-ghost" href="#chat-room-over-websocket" target="_blank" rel="noreferrer">
            <ExternalLink size={16} aria-hidden="true" /> Open a second tab
          </a>
        </form>
      ) : null}

      <div className="rt-chat">
        <div className="rt-chat-bar">
          <span className="row" style={{ gap: 8 }}>
            <ConnectionPill status={status} />
            {joinedAs && <span className="small muted"><Users size={14} aria-hidden="true" /> {online} online</span>}
          </span>
          {joinedAs && (
            <button type="button" className="btn btn-sm" onClick={leave}>
              <LogOut size={14} aria-hidden="true" /> Leave as {me?.name ?? joinedAs}
            </button>
          )}
        </div>

        <ol className="rt-chat-log" ref={logRef} role="log" aria-live="polite" aria-label="Chat messages">
          {!joinedAs && <li className="rt-notice">Pick a nickname and join. Then open a second tab and join with another name.</li>}
          {entries.map((entry) =>
            entry.type === 'message' ? (
              <li key={entry.id} className={`rt-msg${isMine(entry) ? ' is-mine' : ''}`}>
                <span className="rt-msg-meta">{who(entry)} · <time dateTime={entry.time}>{formatTime(entry.time)}</time></span>
                {entry.text}
              </li>
            ) : entry.type === 'join' || entry.type === 'leave' ? (
              <li key={entry.id} className="rt-notice">
                {who(entry)} {entry.type === 'join' ? 'joined' : 'left'} · {entry.online} online
              </li>
            ) : (
              <li key={entry.id} className="rt-notice is-error">{entry.detail}</li>
            ),
          )}
        </ol>

        <form className="rt-chat-form" onSubmit={send}>
          <label className="visually-hidden" htmlFor={`${nameId}-msg`}>Message</label>
          <input id={`${nameId}-msg`} className="input" value={draft} maxLength={500} autoComplete="off"
            placeholder={status === 'open' ? 'Say hello…' : 'Join to chat'} disabled={status !== 'open'}
            onChange={(e) => setDraft(e.target.value)} />
          <button type="submit" className="btn btn-primary" disabled={status !== 'open' || !draft.trim()}>
            <Send size={16} aria-hidden="true" /> Send
          </button>
        </form>
      </div>
    </div>
  );
}
