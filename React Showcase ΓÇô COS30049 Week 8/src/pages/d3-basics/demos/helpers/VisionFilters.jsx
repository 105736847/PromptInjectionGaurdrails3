/**
 * VisionFilters.jsx – SVG filters that approximate colour-vision deficiency
 * (Machado, Oliveira & Fernandes 2009, full severity) plus a greyscale view.
 * Apply one to any element with CSS: style={{ filter: `url(#${prefix}-deuteranopia)` }}.
 *
 * feColorMatrix multiplies every pixel's [R, G, B, A, 1] by a 4×5 matrix.
 * The default color-interpolation-filters="linearRGB" is what these matrices expect.
 */
export const VISIONS = [
  { id: 'normal', label: 'Normal vision' },
  { id: 'deuteranopia', label: 'Deuteranopia (green-blind)' },
  { id: 'protanopia', label: 'Protanopia (red-blind)' },
  { id: 'tritanopia', label: 'Tritanopia (blue-blind, rare)' },
  { id: 'greyscale', label: 'Greyscale (lightness only)' },
];

const MATRICES = {
  deuteranopia: [0.367, 0.861, -0.228, 0.28, 0.673, 0.047, -0.012, 0.043, 0.969],
  protanopia: [0.152, 1.053, -0.205, 0.115, 0.786, 0.099, -0.004, -0.048, 1.052],
  tritanopia: [1.256, -0.077, -0.179, -0.078, 0.931, 0.148, 0.005, 0.691, 0.304],
  greyscale: [0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722],
};

// 3×3 RGB matrix → the 20 numbers feColorMatrix wants (alpha row unchanged).
const toValues = (m) => [...m.slice(0, 3), 0, 0, ...m.slice(3, 6), 0, 0, ...m.slice(6, 9), 0, 0, 0, 0, 0, 1, 0].join(' ');

export default function VisionFilters({ prefix }) {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
      <defs>
        {Object.entries(MATRICES).map(([name, matrix]) => (
          <filter key={name} id={`${prefix}-${name}`}>
            <feColorMatrix type="matrix" values={toValues(matrix)} />
          </filter>
        ))}
      </defs>
    </svg>
  );
}
