import { useState } from 'react';
import CodeBlock from '../../../components/common/CodeBlock.jsx';
import { Segmented, Slider } from './Controls.jsx';
import './GridAreas.css';

/**
 * GridAreas – design a whole page by "drawing" it with named areas:
 *
 *   grid-template-areas:
 *     "header  header header"
 *     "sidebar main   aside"
 *     "footer  footer footer";
 *
 * Each child just says which area it belongs to (grid-area: main).
 * React passes the chosen preset to CSS as custom properties (--areas,
 * --columns). The CSS file then uses a CONTAINER query to switch to one
 * column when the preview gets narrow – try the width slider.
 */
const PRESETS = {
  'Holy grail': {
    columns: '150px 1fr 150px',
    areas: ['header header header', 'sidebar main aside', 'footer footer footer'],
  },
  'Docs site': {
    columns: '170px 1fr 130px',
    areas: ['sidebar header header', 'sidebar main aside', 'sidebar footer footer'],
  },
  'Blog post': {
    columns: '1fr 180px',
    areas: ['header header', 'main sidebar', 'aside sidebar', 'footer footer'],
  },
};

const REGIONS = [
  { area: 'header', tag: '<header>', text: 'Unit portal · COS30049' },
  { area: 'sidebar', tag: '<nav>', text: 'Week 1 · Week 2 · … · Week 8' },
  { area: 'main', tag: '<main>', text: 'Week 8: Front-end with React. Build the UI for your ML project and connect it to the FastAPI back end.' },
  { area: 'aside', tag: '<aside>', text: 'Due soon: Assignment 3' },
  { area: 'footer', tag: '<footer>', text: '© Innovation Project' },
];

export default function GridAreas() {
  const [presetName, setPresetName] = useState('Holy grail');
  const [width, setWidth] = useState(100);
  const preset = PRESETS[presetName];

  // Each row of the template must be wrapped in quotes in CSS.
  const areas = preset.areas.map((row) => `"${row}"`).join(' ');

  const css = `.page {
  display: grid;
  grid-template-columns: ${preset.columns};
  grid-template-areas:
${preset.areas.map((row) => `    "${row}"`).join('\n')};
}
.page > header { grid-area: header; }  /* …and so on for each region */

/* Narrow container → a single column */
@container (max-width: 540px) {
  .page {
    grid-template-columns: 1fr;
    grid-template-areas: "header" "main" "sidebar" "aside" "footer";
  }
}`;

  return (
    <div className="stack">
      <div className="grid-2">
        <Segmented label="layout preset" options={Object.keys(PRESETS)} value={presetName} onChange={setPresetName} />
        <Slider label="preview width" value={width} onChange={setWidth} min={35} max={100} unit="%" />
      </div>

      {/* The wrapper is the "container" that @container measures */}
      <div className="layout-areas-container" style={{ width: `${width}%` }}>
        <div className="layout-areas" style={{ '--columns': preset.columns, '--areas': areas }}>
          {REGIONS.map((region) => (
            <div key={region.area} className={`layout-areas-region layout-areas-${region.area}`}>
              <code>{region.tag}</code>
              <span>{region.text}</span>
            </div>
          ))}
        </div>
      </div>

      <CodeBlock code={css} filename="page-layout.css" />
    </div>
  );
}
