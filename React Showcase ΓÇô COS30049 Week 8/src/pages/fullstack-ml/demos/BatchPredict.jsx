/**
 * BatchPredict – upload a CSV, get one prediction per row (POST /api/ml/predict/batch).
 *
 * Teaches: <input type="file"> + drag & drop, sending a File with FormData,
 * the back end's upload checks (type 415, size 413, content 400/422), and
 * turning a JSON result into tiles, a histogram and a sortable table.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Download, FileUp, FlaskConical } from 'lucide-react';
import { predictBatch } from './mlApi.js';
import { BROKEN_FILES, downloadText, sampleCsvText } from './sampleCsv.js';
import Histogram from './charts/Histogram.jsx';
import ResultsTable from './ResultsTable.jsx';
import ApiErrorNote from './ApiErrorNote.jsx';
import { ms, pct } from './charts/chartUtils.js';

const sampleFile = () => new File([sampleCsvText()], 'sample-urls.csv', { type: 'text/csv' });

export default function BatchPredict() {
  const inputId = useId();
  const [state, setState] = useState({ status: 'idle', data: null, error: null, fileName: '' });
  const [dragging, setDragging] = useState(false);
  const controllerRef = useRef(null);

  useEffect(() => () => controllerRef.current?.abort(), []); // cancel an upload still running on unmount

  async function upload(file) {
    if (!file) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState((s) => ({ ...s, status: 'loading', error: null, fileName: file.name }));
    try {
      const data = await predictBatch(file, 0.5, { signal: controller.signal });
      setState({ status: 'done', data, error: null, fileName: file.name });
    } catch (error) {
      if (!controller.signal.aborted) setState({ status: 'error', data: null, error, fileName: file.name });
    }
  }

  function handleDrop(event) {
    event.preventDefault(); // otherwise the browser opens the dropped file
    setDragging(false);
    upload(event.dataTransfer.files[0]);
  }

  const { status, data, error, fileName } = state;
  const summary = data?.summary;
  // Screen readers hear this line whenever it changes (failures are announced by ApiErrorNote's role="alert").
  const announcement = status === 'loading' ? `Uploading ${fileName}…`
    : summary ? `Predicted ${summary.predicted} row${summary.predicted === 1 ? '' : 's'}: ${summary.suspicious} suspicious, ${summary.skipped} skipped.` : '';

  return (
    <div className="stack">
      <div className="row">
        <button type="button" className="btn" onClick={() => downloadText(sampleCsvText(), 'sample-urls.csv')}>
          <Download size={16} aria-hidden="true" /> Download sample CSV
        </button>
        <button type="button" className="btn btn-primary" onClick={() => upload(sampleFile())} disabled={status === 'loading'}>
          <FlaskConical size={16} aria-hidden="true" /> Upload the sample
        </button>
      </div>

      <label htmlFor={inputId} className={`mlserve-dropzone${dragging ? ' is-dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
        <FileUp size={22} aria-hidden="true" />
        <span><strong>Choose a CSV file</strong> or drop it here</span>
        <span className="small muted">A <code>url</code> column is required, <code>label</code> (0/1) is optional · ≤ 1 MB · ≤ 1,000 rows</span>
        {/* Clearing the value lets the same file be chosen twice in a row (onChange fires again). */}
        <input id={inputId} type="file" accept=".csv,text/csv" className="visually-hidden"
          onChange={(e) => { upload(e.target.files[0]); e.target.value = ''; }} />
      </label>

      <div className="row" role="group" aria-label="Upload a file the server should reject">
        <span className="small muted">Try a wrong file:</span>
        {BROKEN_FILES.map((f) => (
          <button key={f.label} type="button" className="btn btn-ghost btn-sm" onClick={() => upload(f.make())}>
            {f.label} <span className="badge badge-code">{f.expect}</span>
          </button>
        ))}
      </div>

      <p className="visually-hidden" role="status" aria-live="polite">{announcement}</p>
      {status === 'loading' && <p className="row small muted"><span className="spinner" aria-hidden="true" /> Uploading {fileName}…</p>}
      {status === 'error' && (
        <div className="stack-sm">
          <ApiErrorNote error={error} fillsIn={false} />
          {error.status >= 400 && (
            <p className="small muted m-0">
              File: <code>{fileName}</code> – the server checked it and refused it before running the model.
            </p>
          )}
        </div>
      )}

      {summary && (
        <>
          <dl className="mlserve-tiles" aria-label={`Summary for ${summary.filename}`}>
            <div><dt>Rows predicted</dt><dd>{summary.predicted}</dd></div>
            <div><dt>Suspicious</dt><dd>{summary.suspicious}</dd></div>
            <div><dt>Safe</dt><dd>{summary.safe}</dd></div>
            <div><dt>Skipped</dt><dd>{summary.skipped}</dd></div>
            <div><dt>Accuracy vs labels</dt><dd>{summary.accuracy == null ? '–' : pct(summary.accuracy)}</dd></div>
            <div><dt>Server time</dt><dd>{ms(summary.latency_ms)}</dd></div>
          </dl>
          {data.skipped.length > 0 && (
            <div className="alert alert-info">
              <div>
                <strong>Skipped rows</strong> (the rest were still predicted):
                <ul className="m-0">
                  {data.skipped.map((s) => <li key={s.row}>Row {s.row}: {s.reason}</li>)}
                </ul>
              </div>
            </div>
          )}
          <Histogram values={data.results.map((r) => r.probability)} domain={[0, 1]} bins={20}
            marker={summary.threshold} markerLabel={`threshold ${pct(summary.threshold)}`}
            xLabel="P(suspicious)" yLabel="URLs" label="Histogram of predicted probabilities" />
          <ResultsTable rows={data.results} />
        </>
      )}
    </div>
  );
}
