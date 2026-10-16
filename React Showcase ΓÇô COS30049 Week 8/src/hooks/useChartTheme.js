import { useMemo, useSyncExternalStore } from 'react';

/**
 * useChartTheme – hands D3 code the chart colours as real colour strings.
 *
 * Our colours live in CSS variables (see "Data-visualisation tokens" in
 * index.css) and change with the light/dark theme. CSS can use them directly
 * (fill: var(--chart-1)), but D3 sometimes needs actual values – for example to
 * interpolate a colour scale. This hook reads the variables and reads them
 * again whenever <html data-theme="…"> changes.
 *
 *   const colors = useChartTheme();
 *   const color = d3.scaleSequential(d3.interpolateRgbBasis(colors.sequential));
 *   const fill = colors.categorical[0];
 */

// useSyncExternalStore lets React subscribe to something outside React –
// here, changes to the data-theme attribute on <html>.
function subscribe(onChange) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

function getTheme() {
  return document.documentElement.dataset.theme ?? 'light';
}

export default function useChartTheme() {
  const mode = useSyncExternalStore(subscribe, getTheme);

  return useMemo(() => {
    const styles = getComputedStyle(document.documentElement);
    const read = (name) => styles.getPropertyValue(name).trim();
    const range = (prefix, n) => Array.from({ length: n }, (_, i) => read(`${prefix}${i + 1}`));

    return {
      mode, // 'light' | 'dark' – handy as an effect dependency
      categorical: range('--chart-', 8), // fixed order – never cycle past 8
      sequential: range('--seq-', 7), // low → high magnitude
      diverging: [read('--div-neg'), read('--div-mid'), read('--div-pos')],
      surface: read('--color-surface'),
      text: read('--color-text'),
      textMuted: read('--color-text-muted'),
      grid: read('--chart-grid'),
      axis: read('--chart-axis'),
      status: {
        good: read('--color-success'),
        warning: read('--color-warning'),
        critical: read('--color-danger'),
      },
    };
  }, [mode]);
}
