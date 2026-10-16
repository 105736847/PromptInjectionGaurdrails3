/**
 * IndeterminateCheckbox – a "select all" box that can show a dash (–) when
 * only SOME rows are selected.
 *
 * There is no HTML attribute (and so no JSX prop) for the dash: it only exists
 * as a property on the DOM element, `checkbox.indeterminate = true`.
 * useRef gives us the real DOM node, and an effect keeps it in sync.
 */
import { useEffect, useRef } from 'react';

export default function IndeterminateCheckbox({ checked, indeterminate, onChange, label, disabled }) {
  const ref = useRef(null);

  useEffect(() => {
    // Runs after React has updated the DOM, so ref.current is the <input>.
    ref.current.indeterminate = indeterminate;
  }, [indeterminate, checked]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      aria-label={label}
    />
  );
}
