/**
 * PredictForm – the Assignment 3 pattern, working offline:
 *   form → convert & validate → POST to the model → show the prediction.
 *
 * Here the "server" is predictPass() from fakeApi.js. With your own FastAPI
 * back-end you would call fetch(`${import.meta.env.VITE_API_URL}/predict`)
 * instead – see "Connecting to YOUR back-end" further down this page.
 */
import { useState } from 'react';
import { BrainCircuit, CircleAlert } from 'lucide-react';
import { predictPass } from './fakeApi.js';
import NetworkToggles from './NetworkToggles.jsx';

const FIELDS = [
  { name: 'study_hours', label: 'Study hours per week', max: 80, step: 0.5 },
  { name: 'attendance', label: 'Attendance (%)', max: 100, step: 1 },
  { name: 'quiz_average', label: 'Quiz average (%)', max: 100, step: 1 },
];

export default function PredictForm() {
  // Field names match the Pydantic model on the server (snake_case).
  const [values, setValues] = useState({ study_hours: '8', attendance: '75', quiz_average: '60' });
  const [network, setNetwork] = useState({ slow: true, fail: false });
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    // Inputs always give us strings – the API expects numbers.
    const payload = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value)]));
    setStatus('loading');
    setError(null);
    try {
      const data = await predictPass(payload, network);
      setResult({ payload, data });
      setStatus('success');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  const loading = status === 'loading';

  return (
    <div className="api-split">
      <form className="stack" onSubmit={handleSubmit}>
        {FIELDS.map((field) => (
          <div className="field" key={field.name}>
            <label className="label" htmlFor={`predict-${field.name}`}>
              {field.label}
            </label>
            <input
              id={`predict-${field.name}`}
              className="input"
              type="number"
              name={field.name}
              min={0}
              max={field.max}
              step={field.step}
              required
              value={values[field.name]}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        ))}
        <NetworkToggles value={network} onChange={setNetwork} />
        <div>
          {/* Disabled while waiting → no double submissions */}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner api-spinner-sm" aria-hidden="true" /> : <BrainCircuit size={16} />}
            {loading ? 'Predicting…' : 'Predict'}
          </button>
        </div>
      </form>

      <div className="stack-sm" aria-live="polite">
        {status === 'idle' && <p className="m-0 muted small">Fill in the form and press Predict.</p>}
        {loading && <p className="m-0 muted small">Waiting for the model…</p>}
        {status === 'error' && (
          <div className="alert alert-danger" role="alert">
            <CircleAlert size={20} />
            <span>
              <strong>Prediction failed.</strong> {error}
            </span>
          </div>
        )}
        {status === 'success' && (
          <div className="card api-prediction">
            <span className="small muted">Prediction</span>
            <strong className={result.data.prediction === 'Pass' ? 'api-pass' : 'api-risk'}>
              {result.data.prediction}
            </strong>
            <span className="small">
              Probability of passing: <strong>{Math.round(result.data.probability * 100)}%</strong>
            </span>
            <progress value={result.data.probability} max={1} aria-label="Probability of passing" />
            <pre className="demo-output">
              {`POST /predict\n${JSON.stringify(result.payload, null, 2)}\n\n← 200\n${JSON.stringify(result.data, null, 2)}`}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
