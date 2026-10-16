import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume1 } from 'lucide-react';
import styles from './MediaPlayer.module.css';

/**
 * A custom audio player. Same pattern as the video player:
 * commands go to the element through a ref, state comes back from its events.
 * The <audio> element has no `controls`, so it is invisible – we draw the UI.
 */
const SRC = 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3';
const START_VOLUME = 0.8;

const format = (s) =>
  Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00';

export default function CustomAudioPlayer() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(START_VOLUME);
  const [error, setError] = useState(false);

  // After mount: apply the starting volume, and read the duration in case the
  // metadata loaded before React was listening (e.g. from the browser cache).
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = START_VOLUME; // `volume` is a DOM property, not an attribute, so set it via the ref
    if (audio.readyState >= 1) setDuration(audio.duration);
    if (audio.error) setError(true);
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (audio.paused) audio.play().catch(() => {}); // errors are reported through onError
    else audio.pause();
  }

  function changeVolume(event) {
    const level = Number(event.target.value);
    audioRef.current.volume = level;
    setVolume(level);
  }

  function seek(event) {
    const time = Number(event.target.value);
    audioRef.current.currentTime = time;
    setCurrent(time);
  }

  return (
    <div className={styles.audio}>
      <audio
        ref={audioRef}
        src={SRC}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setCurrent(0)}
        onError={() => setError(true)}
      />

      <button type="button" className={styles.audioPlay} onClick={togglePlay} disabled={error}
        aria-label={playing ? 'Pause T-rex roar' : 'Play T-rex roar'}>
        {playing ? <Pause size={22} /> : <Play size={22} />}
      </button>

      <div className={styles.audioMain}>
        <div className="row-between">
          <strong>T-rex roar 🦖</strong>
          <span className="mono small muted">{format(current)} / {format(duration)}</span>
        </div>
        <input type="range" min="0" max={duration || 0} step="0.01" value={current} onChange={seek}
          aria-label="Playback position" style={{ width: '100%' }} />
        {error && <span className="error-text">The audio file could not be loaded.</span>}
      </div>

      <div className={`${styles.bars} ${playing ? styles.barsPlaying : ''}`} aria-hidden="true">
        <span /><span /><span /><span /><span />
      </div>

      <label className="row small" style={{ gap: 6 }}>
        <Volume1 size={18} aria-hidden="true" />
        <span className="visually-hidden">Volume</span>
        <input type="range" min="0" max="1" step="0.05" value={volume} onChange={changeVolume} style={{ width: 90 }} />
      </label>
    </div>
  );
}
