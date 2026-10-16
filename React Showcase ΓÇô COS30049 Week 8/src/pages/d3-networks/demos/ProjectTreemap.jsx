/**
 * ProjectTreemap – the source code of THIS project as a zoomable treemap.
 * Area = lines of code. Click a folder to zoom in; use the breadcrumb to zoom out.
 *
 * Pattern: D3 calculates, React renders
 * d3.treemap computes every tile ONCE for the whole tree. Zooming only changes
 * which rectangle (the focused folder) is stretched to fill the chart – two
 * linear maps x() and y() – and useTween animates that rectangle, so every
 * tile glides into place.
 */
import { useId, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { ChevronRight } from 'lucide-react';
import useElementSize from '../../../hooks/useElementSize.js';
import useChartTheme from '../../../hooks/useChartTheme.js';
import useTween from './helpers/useTween.js';
import ChartTooltip, { TooltipRow } from './helpers/ChartTooltip.jsx';
import textOn from './helpers/textOn.js';
import projectTree from './data/projectTree.json'; // snapshot made by generate-project-tree.mjs

const TOP_LEVEL = ['pages', 'components', 'hooks', 'context', 'data', '(files in src/)']; // fixed colour order
const NONE = [];
const format = d3.format(',');

/** Colour slot of a tile (0 = grey "Other").
    At the top: the top-level folder it lives in, in a fixed order.
    Zoomed in: which child of the focused folder it belongs to (largest first) – otherwise
    everything inside pages/ would be the same blue. 7 colours max, the rest is "Other". */
function slotOf(d, focus) {
  if (focus.depth > 0) {
    const i = focus.children.indexOf(d.ancestors().find((a) => a.parent === focus));
    return i >= 0 && i < 7 ? i + 1 : 0;
  }
  const top = d.ancestors().at(-2) ?? d;
  if (!top.children) return 6; // a file directly inside src/
  const i = TOP_LEVEL.indexOf(top.data.name);
  return i === -1 ? 7 : i + 1;
}
const fillOf = (slot) => (slot ? `var(--chart-${slot})` : 'var(--chart-axis)'); // "Other" = quiet grey

/** Tile each folder at the chart's aspect ratio, then squeeze it into its parent –
    so a folder still has nicely shaped tiles once it is zoomed to full size. */
const tile = (width, height) => (node, x0, y0, x1, y1) => {
  d3.treemapSquarify(node, 0, 0, width, height);
  for (const c of node.children) {
    c.x0 = x0 + (c.x0 / width) * (x1 - x0);
    c.x1 = x0 + (c.x1 / width) * (x1 - x0);
    c.y0 = y0 + (c.y0 / height) * (y1 - y0);
    c.y1 = y0 + (c.y1 / height) * (y1 - y0);
  }
};

export default function ProjectTreemap() {
  const [wrapRef, { width }] = useElementSize();
  const colors = useChartTheme();
  const clipId = useId().replace(/[^\w-]/g, '');
  const [focusPath, setFocusPath] = useState('src');
  const [hover, setHover] = useState(null); // { d, x, y }
  const height = width < 600 ? 380 : 480;

  // D3 calculates: one layout for the whole tree, redone only when the size changes.
  const root = useMemo(() => {
    if (width === 0) return null;
    const hierarchy = d3.hierarchy(projectTree).sum((d) => d.lines ?? 0).sort((a, b) => b.value - a.value);
    hierarchy.each((d) => { d.path = d.ancestors().reverse().map((a) => a.data.name).join('/'); });
    return d3.treemap().tile(tile(width, height)).size([width, height])(hierarchy);
  }, [width, height]);
  const focus = root?.find((d) => d.path === focusPath) ?? root;

  // Animate the focused rectangle; x() and y() stretch it over the whole chart.
  const target = useMemo(() => (focus ? [focus.x0, focus.x1, focus.y0, focus.y1] : NONE), [focus]);
  const [fx0, fx1, fy0, fy1] = useTween(target, 750);
  const x = (v) => ((v - fx0) / (fx1 - fx0)) * width;
  const y = (v) => ((v - fy0) / (fy1 - fy0)) * height;

  // Draw the children of the focus (and their cousins, which are off-screen).
  const tiles = root ? root.descendants().filter((d) => d.depth === focus.depth + 1
    && d.x1 > fx0 && d.x0 < fx1 && d.y1 > fy0 && d.y0 < fy1) : [];
  // Label colour on a tile: white or ink, whichever contrasts more with the fill.
  const inkOn = (slot) => textOn(slot ? colors.categorical[slot - 1] : colors.axis);
  const zoomTo = (d) => { setHover(null); setFocusPath(d.path); };
  const legend = !focus || focus.depth === 0
    ? TOP_LEVEL.map((name, i) => ({ name, slot: i + 1 }))
    : focus.children.slice(0, 8).map((c, i) => (i < 7
      ? { name: `${c.data.name}${c.children ? '/' : ''}`, slot: i + 1 }
      : { name: `Other (${focus.children.length - 7})`, slot: 0 }));

  return (
    <figure className="m-0">
      <nav className="viz-controls" aria-label="Folder breadcrumb">
        <ol className="d3-networks-crumbs">
          {(focus?.ancestors().reverse() ?? []).map((a, i, all) => (
            <li key={a.path}>
              {i > 0 && <ChevronRight size={14} aria-hidden="true" />}
              {i === all.length - 1
                ? <span aria-current="page">{a.data.name}</span>
                : <button type="button" onClick={() => zoomTo(a)}>{a.data.name}</button>}
            </li>
          ))}
        </ol>
      </nav>
      <ul className="viz-legend">
        {legend.map(({ name, slot }) => <li key={name}><span className="viz-swatch" style={{ background: fillOf(slot) }} />{name}</li>)}
      </ul>

      <div className="viz" ref={wrapRef}>
        {/* role="group", not "img": an img would hide the folder buttons from screen readers */}
        <svg width={width} height={height} role="group" aria-label={`Treemap of ${focusPath}: tile area shows lines of code.`}>
          <clipPath id={clipId}><rect width={width} height={height} /></clipPath>
          <g clipPath={`url(#${clipId})`}>
            {tiles.map((d) => {
              const w = x(d.x1) - x(d.x0);
              const h = y(d.y1) - y(d.y0);
              const isFolder = Boolean(d.children);
              const slot = slotOf(d, focus);
              const textWidth = d.data.name.length * 6.6 + 12; // rough text width at 12px
              const across = w > textWidth && h > 20;
              const down = !across && h > textWidth && w > 20; // narrow but tall: write top → bottom
              return (
                <g key={d.path} transform={`translate(${x(d.x0)},${y(d.y0)})`}
                  tabIndex={isFolder ? 0 : undefined} role={isFolder ? 'button' : undefined}
                  aria-label={isFolder ? `Zoom into ${d.data.name}` : undefined}
                  style={{ cursor: isFolder ? 'zoom-in' : 'default' }}
                  onClick={() => isFolder && zoomTo(d)}
                  onKeyDown={(e) => { if (isFolder && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); zoomTo(d); } }}
                  onPointerMove={(e) => { const [px, py] = d3.pointer(e, e.currentTarget.ownerSVGElement); setHover({ d, x: px, y: py }); }}
                  onPointerLeave={() => setHover(null)}>
                  {/* inset by 1px on every side → a constant 2px gap between tiles, at any zoom level */}
                  <rect x={1} y={1} width={Math.max(0, w - 2)} height={Math.max(0, h - 2)} rx={3}
                    style={{ fill: fillOf(slot), stroke: hover?.d === d ? 'var(--color-text)' : 'none', strokeWidth: 2 }} />
                  {d.children?.map((c) => { // faint outlines (+ small names) hint at what is inside a folder
                    const cx = x(c.x0) - x(d.x0) + 1;
                    const cy = y(c.y0) - y(d.y0) + 1;
                    const cw = x(c.x1) - x(c.x0) - 2;
                    const ch = y(c.y1) - y(c.y0) - 2;
                    return (
                      <g key={c.path} style={{ pointerEvents: 'none' }}>
                        <rect x={cx} y={cy} width={Math.max(0, cw)} height={Math.max(0, ch)}
                          style={{ fill: 'none', stroke: 'var(--color-surface)', strokeOpacity: 0.4 }} />
                        {cw > c.data.name.length * 6 + 10 && ch > 46 && (
                          <text x={cx + 5} y={cy + ch - 6} style={{ fill: inkOn(slot), fontSize: 10.5 }}>{c.data.name}</text>
                        )}
                      </g>
                    );
                  })}
                  {(across || down) && (
                    <text x={6} y={down ? 6 : 16} transform={down ? 'rotate(90 6 6)' : undefined}
                      style={{ fill: inkOn(slot), fontSize: 12, fontWeight: 600, pointerEvents: 'none' }}>
                      {d.data.name}{isFolder ? '/' : ''}
                      {across && h > 36 && <tspan x={6} dy={15} style={{ fontWeight: 400, fontSize: 11 }}>{format(d.value)} lines</tspan>}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
        {hover && (
          <ChartTooltip x={hover.x} y={hover.y} containerWidth={width}>
            <div className="viz-tooltip-title">{hover.d.path}</div>
            <TooltipRow color={fillOf(slotOf(hover.d, focus))} label="Lines of code" value={format(hover.d.value)} />
            {hover.d.children
              ? <TooltipRow label="Files" value={hover.d.leaves().length} />
              : <TooltipRow label="Size" value={`${(hover.d.data.bytes / 1024).toFixed(1)} kB`} />}
            {hover.d.children && <div className="subtle small mt-1">Click to zoom in</div>}
          </ChartTooltip>
        )}
      </div>

      <p className="small muted mt-1 mb-1">
        Snapshot of <code>src/</code> taken {projectTree.generated}: {root ? `${root.leaves().length} files, ${format(root.value)} lines` : '…'}.
        Regenerate it with <code>node src/pages/d3-networks/demos/data/generate-project-tree.mjs</code>.
      </p>
      <details>
        <summary className="small">Show data table</summary>
        <div className="table-wrap mt-1">
          <table className="table">
            <caption>The 10 largest files</caption>
            <thead><tr><th scope="col">File</th><th scope="col" className="num">Lines</th><th scope="col" className="num">kB</th></tr></thead>
            <tbody>
              {(root?.leaves() ?? []).sort((a, b) => b.value - a.value).slice(0, 10).map((d) => (
                <tr key={d.path}>
                  <th scope="row" className="mono small">{d.path}</th>
                  <td className="num">{format(d.value)}</td>
                  <td className="num">{(d.data.bytes / 1024).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
