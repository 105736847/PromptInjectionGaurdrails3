/**
 * NetworkToggles – two switches that tell fakeApi.js to be slow or to fail.
 * A controlled component: the parent owns the { slow, fail } object and we
 * report changes back with onChange.
 */
export default function NetworkToggles({ value, onChange }) {
  return (
    <fieldset className="api-toggles">
      <legend>Simulate</legend>
      <label className="switch">
        <input
          type="checkbox"
          checked={value.slow}
          onChange={(e) => onChange({ ...value, slow: e.target.checked })}
        />
        <span className="switch-track" />
        Slow network (2–3 s)
      </label>
      <label className="switch">
        <input
          type="checkbox"
          checked={value.fail}
          onChange={(e) => onChange({ ...value, fail: e.target.checked })}
        />
        <span className="switch-track" />
        Server error
      </label>
    </fieldset>
  );
}
