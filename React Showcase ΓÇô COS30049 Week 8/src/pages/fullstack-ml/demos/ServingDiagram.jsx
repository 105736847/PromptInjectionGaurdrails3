/**
 * ServingDiagram – the life of the model, from training to a JSON answer.
 *
 * Click a step to see what happens there and in which file. The live panel
 * reads GET /api/ml/info: the model was loaded ONCE (see `loaded_at`) and the
 * same object has answered every prediction since (`predictions_served`).
 */
import { useState } from 'react';
import { Braces, Cpu, FlaskConical, Package, RefreshCw, Rocket } from 'lucide-react';
import useApiGet from './useApiGet.js';
import { getModelInfo } from './mlApi.js';
import ApiErrorNote from './ApiErrorNote.jsx';
import { num } from './charts/chartUtils.js';

const STEPS = [
  {
    id: 'train', stage: 'offline', icon: FlaskConical, title: 'Train offline', file: 'app/ml/train.py',
    when: 'Once, by a developer – never inside a request.',
    text: 'extract_features() turns each URL into a fixed list of numbers (FEATURE_NAMES), the data is split 75 / 25, and a pipeline – clip to the training range → StandardScaler → LogisticRegression – is fitted on the training part and scored on the test part.',
    code: 'cd backend\npython -m app.ml.train                    # synthetic toy data\npython -m app.ml.train --csv my_urls.csv  # your own url,label file',
  },
  {
    id: 'artifact', stage: 'offline', icon: Package, title: 'Save a joblib artifact', file: 'app/ml/artifacts/',
    when: 'Written by train.py, read by the server.',
    text: 'model.joblib holds the fitted Pipeline plus its version, feature names, pipeline settings and scikit-learn version; metrics.json holds the test results. Each file is written to a temporary file first and then renamed, so a half-written model can never be loaded. Restart uvicorn after retraining: --reload only watches .py files.',
    code: 'joblib.dump(bundle, tmp_path)        # write a temporary file first…\nos.replace(tmp_path, "model.joblib")  # …then swap it in: all or nothing\n# only ever joblib.load() files you created yourself',
  },
  {
    id: 'load', stage: 'online', icon: Rocket, title: 'Load once at start-up', file: 'app/routers/ml.py → lifespan',
    when: 'When uvicorn starts – before the first request arrives.',
    text: "The router's lifespan calls load_model(), which keeps the object in memory, and makes one throw-away prediction so the first user does not pay one-off set-up costs. A missing or out-of-date artifact (features.py or build_pipeline() changed) is retrained automatically.",
    code: '@asynccontextmanager\nasync def lifespan(app):\n    load_model().warm_up()   # runs once\n    yield                    # the server handles requests here',
  },
  {
    id: 'predict', stage: 'online', icon: Cpu, title: 'predict() per request', file: 'app/ml/model.py',
    when: 'On every POST /api/ml/predict.',
    text: 'The SAME extract_features() as in training, then predict_proba() – which clips, scales and scores in one call – and the explanation: about a millisecond. The endpoint is a plain def, so FastAPI runs it in a worker thread.',
    code: 'x = np.array([list(extract_features(url).values())])\nprobability = pipeline.predict_proba(x)[0, 1]',
  },
  {
    id: 'json', stage: 'online', icon: Braces, title: 'Return JSON', file: 'Prediction (Pydantic model)',
    when: 'Back to React – documented at /api/docs.',
    text: 'response_model validates the answer: a probability (not just a label), the threshold used, the contributions, the latency and the model version that produced it.',
    code: '{ "probability": 0.99995, "label": "suspicious", "threshold": 0.5,\n  "contributions": [ … ], "latency_ms": 0.6, "model_version": "url-logreg-…" }',
  },
];

export default function ServingDiagram() {
  const [activeId, setActiveId] = useState('load');
  const info = useApiGet(getModelInfo);
  const step = STEPS.find((s) => s.id === activeId);
  const showLive = step.id === 'load' || step.id === 'predict';

  return (
    <div className="stack">
      {/* The wrapper is a CSS container: the steps sit in a row only when the CARD is wide enough. */}
      <div className="mlserve-flow-wrap">
        <ol className="mlserve-flow" aria-label="How the model is served">
          {STEPS.map(({ id, stage, icon: Icon, title, file }) => (
            <li key={id} className={`mlserve-flow-step is-${stage}`}>
              <button type="button" aria-pressed={activeId === id} onClick={() => setActiveId(id)}>
                <span className="mlserve-flow-stage">{stage === 'offline' ? 'Offline · once' : 'Online · API'}</span>
                <Icon size={22} aria-hidden="true" />
                <strong>{title}</strong>
                <code>{file}</code>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <section className="mlserve-step-detail" aria-live="polite" aria-label={`Details: ${step.title}`}>
        <h4 className="m-0">{step.title}</h4>
        <p className="small muted m-0">{step.when}</p>
        <p className="m-0">{step.text}</p>
        <pre className="demo-output">{step.code}</pre>

        {showLive && (
          <div className="mlserve-live">
            <div className="row-between">
              <strong className="small">Live from GET /api/ml/info</strong>
              <button type="button" className="btn btn-ghost btn-sm" onClick={info.reload} disabled={info.loading}>
                <RefreshCw size={14} aria-hidden="true" /> Refresh
              </button>
            </div>
            {/* Offline wins over old data: never show a stale answer as "live". Refresh then re-checks the back end. */}
            {info.offline ? (
              <ApiErrorNote offline />
            ) : info.data ? (
              <p className="small m-0">
                This server loaded <code>{info.data.model_version}</code> at{' '}
                <time dateTime={info.data.loaded_at}>{new Date(info.data.loaded_at).toLocaleTimeString()}</time> in{' '}
                {(info.data.load_seconds * 1000).toFixed(0)} ms{' '}
                {info.data.trained_on_load ? '(its artifact was missing or out of date, so it trained a new one first)' : 'from model.joblib'} and has
                answered <strong>{num(info.data.predictions_served)}</strong> predictions with that same object since.
                {' '}Use the other demos, then press Refresh.
              </p>
            ) : info.error ? (
              <ApiErrorNote error={info.error} />
            ) : (
              <p className="row small muted m-0"><span className="spinner" aria-hidden="true" /> Loading GET /api/ml/info…</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
