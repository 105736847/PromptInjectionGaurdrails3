import { useState } from 'react';

/**
 * Native <video> and <audio> – the browser draws the controls for you.
 *
 * Useful attributes (camelCase in JSX):
 *   controls     show the browser's play bar
 *   poster       image shown before the video starts
 *   preload      "none" | "metadata" | "auto" – how much to download up front
 *   loop, muted  loop forever / start without sound
 *   autoPlay     only allowed by browsers when the video is also muted
 *   playsInline  on iPhone, play inside the page instead of full screen
 * Several <source> children let the browser pick a format it supports.
 */
const VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const AUDIO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3';

export default function NativeMedia() {
  const [loop, setLoop] = useState(false);
  const [showControls, setShowControls] = useState(true);

  return (
    <div className="grid-2">
      <div className="stack-sm">
        <video
          controls={showControls}
          loop={loop}
          preload="metadata"
          playsInline
          width={640}
          height={360}
          poster="https://picsum.photos/seed/cos30049-flower/640/360"
          style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius)', background: 'var(--color-surface-3)' }}
        >
          <source src={VIDEO} type="video/mp4" />
          {/* Shown only by browsers that cannot play video at all */}
          Your browser does not support HTML video. <a href={VIDEO}>Download the video</a>.
        </video>
        <div className="row small">
          <label className="check">
            <input type="checkbox" checked={showControls} onChange={(e) => setShowControls(e.target.checked)} /> controls
          </label>
          <label className="check">
            <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} /> loop
          </label>
        </div>
        <p className="hint m-0">Video: “flower.mp4”, CC0, from MDN’s example media.</p>
      </div>

      <div className="stack-sm">
        <audio controls preload="metadata" src={AUDIO} style={{ width: '100%' }}>
          Your browser does not support HTML audio.
        </audio>
        <p className="hint m-0">Audio: “t-rex-roar.mp3”, CC0, from MDN’s example media.</p>
        <p className="small muted">
          Native players are accessible, keyboard-friendly and zero JavaScript – but you cannot restyle them much.
          When the design needs custom controls, hide <code>controls</code> and drive the element through a ref
          (next demos).
        </p>
      </div>
    </div>
  );
}
