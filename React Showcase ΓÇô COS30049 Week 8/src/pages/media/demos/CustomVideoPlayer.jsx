import { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react';
import styles from './MediaPlayer.module.css';

/**
 * A custom video player: <video> WITHOUT `controls`, driven through a ref.
 *
 * - Commands go TO the element: ref.current.play(), .pause(), .currentTime = x
 * - State comes FROM the element's events (onPlay, onTimeUpdate, onVolumeChange…)
 *   so the UI stays correct no matter what started the change (our buttons,
 *   the keyboard, picture-in-picture, the video ending…).
 */
const SRC = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const SPEEDS = [0.5, 1, 1.5, 2];

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function CustomVideoPlayer() {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | ready | buffering | ended | error
  const [events, setEvents] = useState([]);

  // A cached video can load its metadata BEFORE React has finished mounting, and
  // React ignores events that arrive that early – so check once after mount.
  useEffect(() => {
    const video = videoRef.current;
    if (video.readyState >= 1) { // 1 = HAVE_METADATA
      setDuration(video.duration);
      setStatus('ready');
    } else if (video.error) {
      setStatus('error');
    }
  }, []);

  // The user can leave full screen with Esc, so listen to the document event.
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === playerRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const log = (name) =>
    setEvents((prev) => [`${name} @ ${formatTime(videoRef.current?.currentTime)}`, ...prev].slice(0, 6));

  async function togglePlay() {
    const video = videoRef.current;
    if (video.paused) {
      try {
        await video.play(); // returns a Promise – it can fail (e.g. source missing)
      } catch (error) {
        // AbortError just means pause() was called before playback started – not a real problem
        if (error.name !== 'AbortError') setStatus('error');
      }
    } else {
      video.pause();
    }
  }

  const skip = (seconds) => {
    videoRef.current.currentTime = Math.min(Math.max(videoRef.current.currentTime + seconds, 0), duration);
  };

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (playerRef.current.requestFullscreen) playerRef.current.requestFullscreen();
    else videoRef.current.webkitEnterFullscreen?.(); // iPhone Safari only supports this
  }

  function handleKeyDown(event) {
    const tag = event.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT') return; // sliders and the select use arrow keys themselves
    if (tag === 'BUTTON' && event.key === ' ') return; // Space already "clicks" a focused button
    const actions = {
      ' ': togglePlay,
      k: togglePlay,
      ArrowLeft: () => skip(-5),
      ArrowRight: () => skip(5),
      m: () => { videoRef.current.muted = !videoRef.current.muted; },
      f: toggleFullscreen,
    };
    if (actions[event.key]) {
      event.preventDefault(); // stop Space from scrolling the page
      actions[event.key]();
    }
  }

  const percent = duration ? (current / duration) * 100 : 0;

  return (
    <div className="stack">
      {/* tabIndex={0} makes the player focusable, so it can receive keyboard shortcuts */}
      <div ref={playerRef} className={styles.player} onKeyDown={handleKeyDown} tabIndex={0}
        role="region" aria-label="Custom video player">
        <video
          ref={videoRef}
          src={SRC}
          preload="metadata"
          playsInline
          className={styles.video}
          onClick={togglePlay}
          onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration); setStatus('ready'); log('loadedmetadata'); }}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          onPlay={() => { setPlaying(true); setStatus('ready'); log('play'); }}
          onPause={() => { setPlaying(false); log('pause'); }}
          onEnded={() => { setStatus('ended'); log('ended'); }}
          onWaiting={() => setStatus('buffering')}
          onPlaying={() => setStatus('ready')}
          onVolumeChange={(e) => { setVolume(e.currentTarget.volume); setMuted(e.currentTarget.muted); }}
          onRateChange={(e) => setSpeed(e.currentTarget.playbackRate)}
          onError={() => setStatus('error')}
        />

        {status === 'error' && <div className={styles.overlay}>Sorry – the video could not be loaded.</div>}
        {status === 'buffering' && <div className={styles.overlay}><span className="spinner" role="status" aria-label="Buffering" /></div>}
        {!playing && status !== 'error' && (
          // This button disappears once playing, so move focus to the player first – otherwise focus is lost
          <button type="button" className={styles.bigPlay} aria-label={status === 'ended' ? 'Replay' : 'Play'}
            onClick={() => { playerRef.current.focus(); togglePlay(); }}>
            <Play size={30} />
          </button>
        )}

        <div className={styles.controls}>
          <button type="button" className="btn-icon" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button type="button" className="btn-icon" onClick={() => skip(-5)} aria-label="Back 5 seconds"><RotateCcw size={16} /></button>
          <button type="button" className="btn-icon" onClick={() => skip(5)} aria-label="Forward 5 seconds"><RotateCw size={16} /></button>

          <input
            type="range"
            className={styles.seek}
            min="0"
            max={duration || 0}
            step="0.1"
            value={current}
            onChange={(e) => {
              const time = Number(e.target.value);
              videoRef.current.currentTime = time;
              setCurrent(time); // update now – "timeupdate" arrives a little later
            }}
            aria-label="Seek"
            aria-valuetext={`${formatTime(current)} of ${formatTime(duration)}`}
            style={{ '--fill': `${percent}%` }} // CSS custom property drives the coloured track
          />
          <span className={`mono small ${styles.time}`}>{formatTime(current)} / {formatTime(duration)}</span>

          <button type="button" className="btn-icon" onClick={() => { videoRef.current.muted = !muted; }}
            aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input type="range" className={styles.volume} min="0" max="1" step="0.05" value={muted ? 0 : volume}
            aria-label="Volume"
            onChange={(e) => {
              const level = Number(e.target.value);
              videoRef.current.volume = level;
              videoRef.current.muted = level === 0;
              setVolume(level); // the "volumechange" event confirms it shortly after
              setMuted(level === 0);
            }} />

          <select className={`input ${styles.speed}`} value={speed} aria-label="Playback speed"
            onChange={(e) => { videoRef.current.playbackRate = Number(e.target.value); setSpeed(Number(e.target.value)); }}>
            {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
          </select>
          <button type="button" className="btn-icon" onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}>
            {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>

      <div className="row-between small">
        <span className="muted">
          Keys (click or Tab to the player first): <kbd>Space</kbd> play · <kbd>←</kbd> <kbd>→</kbd> ±5 s · <kbd>M</kbd> mute · <kbd>F</kbd> full screen
        </span>
        <span className="badge">status: {status}</span>
      </div>
      <pre className="demo-output" aria-label="Media event log">{events.join('\n') || 'Media events will appear here…'}</pre>
    </div>
  );
}
