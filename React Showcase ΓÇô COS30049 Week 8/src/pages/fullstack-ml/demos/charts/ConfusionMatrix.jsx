/**
 * ConfusionMatrix – the four outcomes of a yes/no classifier as a 2 × 2 table.
 * Plain HTML (a real <table> is accessible for free); D3 only supplies the
 * colour scale: one hue, light = few URLs, dark = many.
 */
import * as d3 from 'd3';
import useChartTheme from '../../../../hooks/useChartTheme.js';
import { inkOn, num, pct0 } from './chartUtils.js';

export default function ConfusionMatrix({ tp, fp, tn, fn }) {
  const colors = useChartTheme();
  const total = tp + fp + tn + fn;
  // interpolateRgbBasis blends through the 7 sequential theme colours (they change in dark mode).
  const color = d3.scaleSequential(d3.interpolateRgbBasis(colors.sequential)).domain([0, total]);

  const cell = (count, name, hint) => {
    const fill = color(count);
    return (
      <td className="mlserve-cm-cell" style={{ background: fill, color: inkOn(fill) }}>
        <strong>{num(count)}</strong>
        <span>{name}</span>
        <small>{pct0(count / total)} · {hint}</small>
      </td>
    );
  };

  return (
    <figure className="mlserve-figure">
      <figcaption className="mlserve-figure-title">Confusion matrix · {num(total)} test URLs</figcaption>
      <div className="table-wrap mlserve-cm-wrap">
        <table className="mlserve-cm">
          <thead>
            <tr>
              <td />
              <th scope="col">Predicted safe</th>
              <th scope="col">Predicted suspicious</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Actually safe</th>
              {cell(tn, 'true negatives', 'correct')}
              {cell(fp, 'false positives', 'false alarms')}
            </tr>
            <tr>
              <th scope="row">Actually suspicious</th>
              {cell(fn, 'false negatives', 'missed')}
              {cell(tp, 'true positives', 'caught')}
            </tr>
          </tbody>
        </table>
      </div>
    </figure>
  );
}
