import { useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';

/**
 * <iframe>: embedding another web page (here an OpenStreetMap map).
 *
 * - title: REQUIRED for accessibility – screen readers announce it.
 * - loading="lazy": the map only loads when scrolled near.
 * - sandbox: switches OFF almost everything the embedded page may do, then
 *   you allow back only what it needs (the map needs scripts).
 * - allow: grants browser features, e.g. allow="fullscreen; geolocation".
 * The src is built from state, so choosing a place just changes the URL.
 */
const PLACES = [
  { id: 'campus', label: 'Hawthorn campus', lat: -37.8221, lon: 145.0389, span: 0.006 },
  { id: 'suburb', label: 'Hawthorn suburb', lat: -37.8221, lon: 145.0389, span: 0.025 },
  { id: 'cbd', label: 'Melbourne CBD', lat: -37.8136, lon: 144.9631, span: 0.02 },
];

function embedUrl({ lat, lon, span }) {
  // bbox = left, bottom, right, top (longitude/latitude of the visible area)
  const bbox = [lon - span, lat - span / 2, lon + span, lat + span / 2].map((n) => n.toFixed(4)).join(',');
  const params = new URLSearchParams({ bbox, layer: 'mapnik', marker: `${lat},${lon}` });
  return `https://www.openstreetmap.org/export/embed.html?${params}`;
}

export default function MapEmbed() {
  const [place, setPlace] = useState(PLACES[0]);
  const [loaded, setLoaded] = useState(false);

  function choose(next) {
    if (next.id === place.id) return;
    setLoaded(false); // new URL → show the loading state again
    setPlace(next);
  }

  return (
    <div className="stack">
      <div className="row-between">
        <div className="row" style={{ gap: 4 }} role="group" aria-label="Map area">
          {PLACES.map((p) => (
            <button key={p.id} type="button" className={`btn btn-sm ${place.id === p.id ? 'btn-secondary' : ''}`}
              aria-pressed={place.id === p.id} onClick={() => choose(p)}>
              <MapPin size={14} aria-hidden="true" /> {p.label}
            </button>
          ))}
        </div>
        <a className="small" target="_blank" rel="noreferrer"
          href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=16/${place.lat}/${place.lon}`}>
          View larger map <ExternalLink size={13} aria-hidden="true" />
        </a>
      </div>

      <div style={{ position: 'relative' }}>
        {!loaded && (
          <div className="card card-subtle center" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <span className="row muted"><span className="spinner" aria-hidden="true" /> Loading map…</span>
          </div>
        )}
        <iframe
          title={`OpenStreetMap: ${place.label}, Melbourne`}
          src={embedUrl(place)}
          width="100%"
          height="360"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setLoaded(true)}
          style={{ display: 'block', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
        />
      </div>
      <p className="hint m-0">
        Map data © OpenStreetMap contributors. The <code>src</code> URL is:{' '}
        <code style={{ overflowWrap: 'anywhere' }}>{embedUrl(place)}</code>
      </p>
    </div>
  );
}
