// src/components/ModelReport.jsx – fetch the report from FastAPI and hand it
// to the chart components from this page. (Shown for reference – not run here.)
import { useState } from 'react';
import * as d3 from 'd3';
import useFetch from '../hooks/useFetch.js';
import { confusionAt, metricsFrom, thresholdCurve } from './charts/metrics.js';
import ScoreHistogram from './charts/ScoreHistogram.jsx';
import ConfusionMatrix from './charts/ConfusionMatrix.jsx';
import MetricCurve from './charts/MetricCurve.jsx';

const API_URL = import.meta.env.VITE_API_URL; // e.g. "http://localhost:8000" in .env

export default function ModelReport() {
  const { data: report, loading, error, refetch } = useFetch(`${API_URL}/api/report`);
  const [threshold, setThreshold] = useState(0.5);

  // 1. Loading state – keep the layout stable while we wait.
  if (loading) {
    return <p role="status"><span className="spinner" aria-hidden="true" /> Loading the model report…</p>;
  }
  // 2. Error state – say what went wrong AND how to fix it.
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        Could not load the report ({error.message}). Is <code>uvicorn report_api:app</code> running?
        <button type="button" className="btn btn-sm" onClick={refetch}>Try again</button>
      </div>
    );
  }

  // 3. Success – the charts only need { score, label } rows, exactly report.scores.
  const rows = report.scores;
  const curve = thresholdCurve(rows); // or build it from report.roc / report.pr
  const matrix = confusionAt(rows, threshold);
  const metrics = metricsFrom(matrix);

  return (
    <section className="stack">
      <h2>{report.model} · {report.n_test} test URLs · AUC {report.roc.auc}</h2>
      <ScoreHistogram rows={rows} threshold={threshold} onThresholdChange={setThreshold} mode="share" matrix={matrix} />
      <ConfusionMatrix matrix={matrix} />
      <MetricCurve title="ROC curve" points={curve} xKey="fpr" yKey="tpr" xLabel="False-positive rate"
        yLabel="True-positive rate" operating={{ fpr: metrics.fpr, tpr: metrics.recall }}
        reference={{ type: 'diagonal', label: 'random guess' }} summary={`AUC = ${report.roc.auc}`}
        curve={d3.curveLinear} onPick={setThreshold} />
    </section>
  );
}
