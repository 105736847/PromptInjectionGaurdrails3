/**
 * ChartTooltip – the hover card used by every chart on this page.
 *
 * Put it inside a `position: relative` wrapper (the global .viz class) and pass
 * the pointer position relative to that wrapper, e.g. from
 * `const [x, y] = d3.pointer(event, wrapperElement)`.
 *
 * Trick: the card is shifted left by the same percentage the pointer has moved
 * across the chart (0 % at the left edge, 100 % at the right edge), so it can
 * never stick out of the chart – even on a 360 px phone.
 *
 * Every tooltip on the page reads the same way:
 *   <ChartTooltip …>
 *     <div className="viz-tooltip-title">Muted title</div>
 *     <TooltipRow color="var(--chart-1)" label="Students" value="1,190" />
 *     <TooltipRow label="Share" value="42%" />
 *   </ChartTooltip>
 */
export default function ChartTooltip({ x, y, containerWidth, children }) {
  const shift = containerWidth > 0 ? Math.min(100, Math.max(0, (x / containerWidth) * 100)) : 0;
  const above = y > 90; // not enough room above the pointer → show the card below it

  return (
    <div
      className="viz-tooltip"
      style={{
        left: x,
        top: y,
        width: 'max-content', // size to the content (max 260px), not to the room left of the pointer
        transform: `translate(-${shift}%, ${above ? 'calc(-100% - 14px)' : '18px'})`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * One value in a tooltip, always in the same order: key → label → value.
 * The key is the colour of the hovered mark (a swatch; `line` for line marks,
 * `keyClass` for a special swatch such as a round dot or a hatch). Without a
 * colour the row keeps an empty key, so all labels line up underneath each other.
 */
export function TooltipRow({ color, line = false, keyClass = '', label, value }) {
  return (
    <div className="viz-tooltip-row">
      <span className={`${line ? 'viz-key-line' : 'viz-swatch'} ${keyClass}`.trim()} style={{ background: color }} aria-hidden="true" />
      <span>{label}</span>
      <strong className="d3-networks-tooltip-value">{value}</strong>
    </div>
  );
}
