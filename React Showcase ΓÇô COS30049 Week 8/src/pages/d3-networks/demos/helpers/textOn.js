import * as d3 from 'd3';

/**
 * textOn – white or dark ink for a label drawn ON a coloured fill,
 * whichever has the higher WCAG contrast with that fill.
 *
 *   <text style={{ fill: textOn(colors.categorical[0]) }}>…</text>
 *
 * Needs a real colour value (from useChartTheme), not a CSS variable.
 */
const INK = '#10131a';

// Relative luminance as defined by WCAG 2 (0 = black, 1 = white).
function luminance(colour) {
  const { r, g, b } = d3.rgb(colour);
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export default function textOn(background) {
  const L = luminance(background);
  const withWhite = 1.05 / (L + 0.05);
  const withInk = (L + 0.05) / (luminance(INK) + 0.05);
  return withWhite >= withInk ? '#ffffff' : INK;
}
