/**
 * HierarchyLayouts – ONE hierarchy, FIVE layouts.
 *
 * d3.hierarchy() turns nested data into nodes that know their parent,
 * children, depth and (after .sum()) value. A layout function then only adds
 * coordinates: tree/cluster add x, y; treemap/partition add x0, y0, x1, y1;
 * pack adds x, y, r. The data never changes – only the layout does.
 *
 * Pattern: D3 calculates, React renders
 * Every node is drawn as a <rect> (a circle is a rect with rx = r), so useTween
 * can morph between layouts by interpolating plain numbers:
 * { cx, cy, w, h, rx, opacity } per node.
 */
import { useMemo, useState } from 'react';
import * as d3 from 'd3';
import useElementSize from '../../../hooks/useElementSize.js';
import useChartTheme from '../../../hooks/useChartTheme.js';
import useTween from './helpers/useTween.js';
import ChartTooltip, { TooltipRow } from './helpers/ChartTooltip.jsx';
import textOn from './helpers/textOn.js';
import { packLabels, labelFor } from './helpers/hierarchyLabels.js';
import { assignmentProject } from './data/assignmentProject.js';

const LAYOUTS = {
  tree: { label: 'Tree', code: 'd3.tree().size([height, width])(root);' },
  cluster: { label: 'Cluster', code: 'd3.cluster().size([height, width])(root); // leaves line up' },
  treemap: { label: 'Treemap', code: 'd3.treemap().size([width, height]).paddingTop(20)(root);' },
  pack: { label: 'Pack', code: 'd3.pack().size([width, height]).padding(6)(root); // circle packing' },
  partition: { label: 'Icicle', code: 'd3.partition().size([height, width])(root);' },
};
const BRANCHES = assignmentProject.children.map((d) => d.name); // colour = top-level folder
// For the data table: every file with its full path.
const files = d3.hierarchy(assignmentProject).leaves()
  .map((d) => ({ path: d.ancestors().reverse().map((a) => a.data.name).join('/'), size: d.data.size }));

const box = (x0, y0, x1, y1, opacity) => ({ cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0, rx: 3, opacity });

/** Run one layout and give every node the same kind of shape: { cx, cy, w, h, rx, opacity }. */
function computeLayout(kind, width, height) {
  const root = d3.hierarchy(assignmentProject).sum((d) => d.size ?? 0).sort((a, b) => b.value - a.value);
  if (kind === 'tree' || kind === 'cluster') {
    (kind === 'tree' ? d3.tree() : d3.cluster()).size([height - 36, width - 130])(root); // x = vertical!
    root.each((d) => { d.shape = { cx: 40 + d.y, cy: 24 + d.x, w: 10, h: 10, rx: 5, opacity: 1 }; });
  } else if (kind === 'treemap') {
    d3.treemap().size([width, height]).paddingOuter(4).paddingTop(20).paddingInner(3)(root);
    root.each((d) => { d.shape = box(d.x0, d.y0, d.x1, d.y1, d.children ? 0.12 : 0.85); });
  } else if (kind === 'pack') {
    d3.pack().size([width, height]).padding(6)(root);
    root.each((d) => { d.shape = { cx: d.x, cy: d.y, w: 2 * d.r, h: 2 * d.r, rx: d.r, opacity: d.children ? 0.12 : 0.85 }; });
  } else {
    d3.partition().size([height, width])(root); // icicle lying on its side: depth → x
    root.each((d) => { d.shape = box(d.y0 + 1, d.x0 + 1, d.y1 - 1, d.x1 - 1, d.children ? 0.3 : 0.85); });
  }
  return root.descendants(); // same order for every layout → node i always morphs into node i
}

export default function HierarchyLayouts() {
  const [wrapRef, { width }] = useElementSize();
  const colors = useChartTheme();
  const [layout, setLayout] = useState('tree');
  const [hovered, setHovered] = useState(null); // index of the hovered node
  const height = width < 600 ? 380 : 440;

  const nodes = useMemo(() => (width > 0 ? computeLayout(layout, width, height) : []), [layout, width, height]);
  // Pack: every circle whose (possibly shortened) name fits gets a label, largest circle
  // first, skipping labels that would overlap – the full rule is in helpers/hierarchyLabels.js.
  const packed = useMemo(() => (layout === 'pack' ? packLabels(nodes) : null), [layout, nodes]);
  const isNodeLink = layout === 'tree' || layout === 'cluster';
  // What to animate: every node's shape + the opacity of the tree links. useTween hands the
  // whole object to d3.interpolate, which blends every number inside it.
  const target = useMemo(() => ({
    shapes: nodes.map((d) => d.shape),
    linkOpacity: isNodeLink ? 1 : 0,
  }), [nodes, isNodeLink]);
  const frame = useTween(target, 800);
  const shapeAt = (i) => frame.shapes[i] ?? nodes[i].shape; // the frame can be one render behind the target
  const index = new Map(nodes.map((d, i) => [d, i]));

  const branchOf = (d) => BRANCHES.indexOf(d.ancestors().at(-2)?.data.name); // −1 for the root
  const fill = (d) => (d.depth === 0 ? 'var(--color-text-subtle)' : `var(--chart-${branchOf(d) + 1})`);
  // Text on a strong fill: white or ink, whichever contrasts more with that colour.
  const inkOn = (d) => textOn(d3.interpolateRgb(colors.surface, colors.categorical[branchOf(d)])(0.85));
  const hoveredShape = hovered !== null && nodes[hovered] ? shapeAt(hovered) : null;

  return (
    <figure className="m-0">
      <div className="viz-controls">
        <div className="btn-group" role="group" aria-label="Choose a layout">
          {Object.entries(LAYOUTS).map(([key, { label }]) => (
            <button key={key} type="button" className={`btn btn-sm${layout === key ? ' active' : ''}`}
              aria-pressed={layout === key} onClick={() => setLayout(key)}>{label}</button>
          ))}
        </div>
      </div>
      <ul className="viz-legend">
        {BRANCHES.map((b, i) => <li key={b}><span className="viz-swatch" style={{ background: `var(--chart-${i + 1})` }} />{b}/</li>)}
      </ul>

      <div className="viz" ref={wrapRef}>
        {/* role="group", not "img": an img would hide the focusable nodes from screen readers */}
        <svg width={width} height={height} role="group" aria-label={`${LAYOUTS[layout].label} layout of a 22-node project hierarchy.`}>
          <g style={{ opacity: frame.linkOpacity }}>
            {nodes.map((d, i) => {
              if (!d.parent) return null;
              const a = shapeAt(index.get(d.parent));
              const b = shapeAt(i);
              return <path key={i} d={d3.linkHorizontal()({ source: [a.cx, a.cy], target: [b.cx, b.cy] })}
                style={{ fill: 'none', stroke: 'var(--chart-axis)', strokeWidth: 1.5 }} />;
            })}
          </g>
          {nodes.map((d, i) => {
            const s = shapeAt(i);
            return (
              <g key={i} tabIndex={0} aria-label={`${d.data.name}: ${d.value} kB`}
                onPointerEnter={() => setHovered(i)} onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)} onBlur={() => setHovered(null)}>
                {/* a 10px dot is hard to hit: an invisible 24px circle gives it a bigger target */}
                {isNodeLink && <circle cx={s.cx} cy={s.cy} r={12} style={{ fill: 'transparent' }} />}
                <rect x={s.cx - s.w / 2} y={s.cy - s.h / 2} width={Math.max(0, s.w)} height={Math.max(0, s.h)} rx={s.rx}
                  style={{ fill: fill(d), fillOpacity: s.opacity, stroke: hovered === i ? 'var(--color-text)' : 'var(--color-surface)', strokeWidth: s.w <= 10 || hovered === i ? 2 : 0 }} />
              </g>
            );
          })}
          {/* key={layout} remounts the labels → the CSS fade-in replays after each morph */}
          <g key={layout} className="d3-networks-fade-in" style={{ pointerEvents: 'none' }}>
            {nodes.map((d, i) => {
              const label = labelFor(layout, d, packed);
              const inside = !d.children && !isNodeLink;
              return label && (
                <text key={i} x={label.x} y={label.y} textAnchor={label.anchor} className="viz-label"
                  style={inside ? { fill: inkOn(d), fontSize: 11 } : { paintOrder: 'stroke', stroke: 'var(--color-surface)', strokeWidth: 3, fontSize: 11 }}>
                  {label.text}
                </text>
              );
            })}
          </g>
        </svg>
        {hoveredShape && (
          <ChartTooltip x={hoveredShape.cx} y={hoveredShape.cy - hoveredShape.h / 2} containerWidth={width}>
            <div className="viz-tooltip-title">{nodes[hovered].ancestors().reverse().map((a) => a.data.name).join(' / ')}</div>
            <TooltipRow color={fill(nodes[hovered])} label="Size" value={`${nodes[hovered].value} kB`} />
            {nodes[hovered].children && <TooltipRow label="Files" value={nodes[hovered].leaves().length} />}
          </ChartTooltip>
        )}
      </div>
      <pre className="demo-output mt-1">{`const root = d3.hierarchy(data).sum((d) => d.size); // same every time\n${LAYOUTS[layout].code}`}</pre>
      <details className="mt-1">
        <summary className="small">Show data table</summary>
        <div className="table-wrap mt-1">
          <table className="table">
            <caption>Every file of the project (the leaves of the hierarchy)</caption>
            <thead><tr><th scope="col">File</th><th scope="col" className="num">Size (kB)</th></tr></thead>
            <tbody>
              {files.map((d) => (
                <tr key={d.path}><th scope="row" className="mono small">{d.path}</th><td className="num">{d.size}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
