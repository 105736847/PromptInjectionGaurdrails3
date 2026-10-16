import PageHeader from '../../components/common/PageHeader.jsx';
import BackendStatus from '../../components/common/BackendStatus.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';
import CodeBlock from '../../components/common/CodeBlock.jsx';

// Shared front-end helpers (shown in several Code tabs)
import mlApiCode from './demos/mlApi.js?raw';
import useApiGetCode from './demos/useApiGet.js?raw';
import usePredictionCode from './demos/usePrediction.js?raw';
import apiErrorNoteCode from './demos/ApiErrorNote.jsx?raw';
import chartTooltipCode from './demos/charts/ChartTooltip.jsx?raw';
import chartUtilsCode from './demos/charts/chartUtils.js?raw';
// 1. Predict one URL
import PredictOne from './demos/PredictOne.jsx';
import predictOneCode from './demos/PredictOne.jsx?raw';
import gaugeCode from './demos/charts/ProbabilityGauge.jsx?raw';
// 2. Why this prediction?
import WhyPrediction from './demos/WhyPrediction.jsx';
import whyPredictionCode from './demos/WhyPrediction.jsx?raw';
import contributionsChartCode from './demos/charts/ContributionsChart.jsx?raw';
// 3. Batch predictions
import BatchPredict from './demos/BatchPredict.jsx';
import batchPredictCode from './demos/BatchPredict.jsx?raw';
import sampleCsvCode from './demos/sampleCsv.js?raw';
import resultsTableCode from './demos/ResultsTable.jsx?raw';
import histogramCode from './demos/charts/Histogram.jsx?raw';
// 4. Model report
import ModelReport from './demos/ModelReport.jsx';
import modelReportCode from './demos/ModelReport.jsx?raw';
import rocCurveCode from './demos/charts/RocCurve.jsx?raw';
import confusionMatrixCode from './demos/charts/ConfusionMatrix.jsx?raw';
// 5. How the model is served
import ServingDiagram from './demos/ServingDiagram.jsx';
import servingDiagramCode from './demos/ServingDiagram.jsx?raw';
// 6. Latency under load
import LatencyLoad from './demos/LatencyLoad.jsx';
import latencyLoadCode from './demos/LatencyLoad.jsx?raw';
// The Python that serves every demo – imported as text, so it is always the real file.
import featuresPy from '../../../backend/app/ml/features.py?raw';
import datasetPy from '../../../backend/app/ml/dataset.py?raw';
import trainPy from '../../../backend/app/ml/train.py?raw';
import modelPy from '../../../backend/app/ml/model.py?raw';
import mlRouterPy from '../../../backend/app/routers/ml.py?raw';
import testMlPy from '../../../backend/tests/test_ml.py?raw';
import './fullstack-ml.css';

const PY = {
  features: { name: 'backend/app/ml/features.py', code: featuresPy },
  dataset: { name: 'backend/app/ml/dataset.py', code: datasetPy },
  train: { name: 'backend/app/ml/train.py', code: trainPy },
  model: { name: 'backend/app/ml/model.py', code: modelPy },
  router: { name: 'backend/app/routers/ml.py', code: mlRouterPy },
  tests: { name: 'backend/tests/test_ml.py', code: testMlPy },
};

const COMMANDS = `cd backend
python -m app.ml.train               # (re)train → app/ml/artifacts/model.joblib + metrics.json
python -m pytest tests/test_ml.py    # features, training, every endpoint and every error path
uvicorn app.main:app --reload        # restart after retraining: the model is loaded at start-up

# Try the API without React (or open http://localhost:8000/api/docs):
curl -X POST http://localhost:8000/api/ml/predict \\
     -H "Content-Type: application/json" \\
     -d '{"url": "http://203.0.113.45/brightwater-uni/verify-account", "threshold": 0.5}'
curl -F "file=@sample-urls.csv" http://localhost:8000/api/ml/predict/batch`;

export default function MlServingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Full-Stack (FastAPI)"
        title="Serving an ML Model"
        intro="Train a scikit-learn model once, save it with joblib, load it when FastAPI starts and answer predictions as JSON – then build a React interface that shows probabilities, explanations, batch results and honest metrics. The model is a toy “suspicious URL” classifier trained on synthetic, fictional URLs: it knows nothing about real phishing, and that is fine – the architecture is what you need for Assignment 3."
        concepts={['scikit-learn Pipeline', 'joblib', 'lifespan', 'Pydantic validation', 'UploadFile', 'predict_proba', 'AbortController', 'debounce', 'D3']}
        docs={[
          { label: 'Model persistence (scikit-learn)', href: 'https://scikit-learn.org/stable/model_persistence.html' },
          { label: 'Lifespan events (FastAPI)', href: 'https://fastapi.tiangolo.com/advanced/events/' },
          { label: 'Request files (FastAPI)', href: 'https://fastapi.tiangolo.com/tutorial/request-files/' },
          { label: 'AbortController (MDN)', href: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController' },
        ]}
      />
      <BackendStatus />

      <SectionTitle
        title="From a URL to a probability"
        intro="The heart of an ML web app: React sends the user's input, FastAPI runs the model, React shows what came back. Open the Code tab to read the React and the Python side by side."
      />
      <DemoCard
        title="Predict one URL"
        description="Type or pick a URL. With “predict as you type” on, a request is sent 300 ms after you stop typing, and any request still running is cancelled. Pick “Typo-squatting (hard!)” – a borderline URL – and move the threshold across its probability: the label flips while the probability stays the same. Then send an invalid request and see FastAPI's 422 message appear under the field."
        concepts={['POST JSON', 'debounce', 'AbortController', '422 → fieldErrors', 'Pattern: D3 owns the <g>']}
        files={[
          { name: 'PredictOne.jsx', code: predictOneCode },
          { name: 'usePrediction.js', code: usePredictionCode },
          { name: 'ProbabilityGauge.jsx', code: gaugeCode },
          { name: 'ApiErrorNote.jsx', code: apiErrorNoteCode },
          { name: 'mlApi.js', code: mlApiCode },
          { name: 'chartUtils.js', code: chartUtilsCode },
          PY.router,
        ]}
      >
        <PredictOne />
      </DemoCard>

      <DemoCard
        title="Why this prediction?"
        description="For a linear model an explanation is exact: every feature adds weight × (scaled value) to the log-odds. The back end returns those terms; React sorts and draws them. Hover a bar (or Tab to it) to highlight its row in the table. Press “+ 300 letters” to pad the URL and see which features the server clips to the range it was trained on."
        concepts={['contributions', 'lifting state up', 'clip to training range', 'd3.scaleBand', 'Pattern: D3 calculates, React renders']}
        files={[
          { name: 'WhyPrediction.jsx', code: whyPredictionCode },
          { name: 'usePrediction.js', code: usePredictionCode },
          { name: 'ContributionsChart.jsx', code: contributionsChartCode },
          { name: 'ChartTooltip.jsx', code: chartTooltipCode },
          PY.model,
          PY.features,
          PY.router,
        ]}
      >
        <WhyPrediction />
      </DemoCard>

      <Callout type="note" title="Inputs the model has never seen">
        <p>
          The training URLs are at most about 110 characters long, but the API accepts 2,048. A linear model keeps
          adding weight × value however far a value lies outside what it has seen, so one extreme feature can outvote
          all the others. An earlier version of this model used the length of the whole URL. Its weight came out
          negative – length overlaps with the digit, hyphen and special-character counts – and appending 300 letters
          turned any suspicious URL into a “safe” one.
        </p>
        <p>
          Two fixes, both in the back end: count the <em>host</em> length, which padding a path cannot change, and
          make <code>ClipToTrainingRange</code> (in <code>features.py</code>) the first step of the pipeline, so every
          feature is clipped to the range seen in training. Correlated features can still get surprising signs –
          “Dots” has a negative weight because “Sub-domains” already counts most dots – so explain a prediction with
          its contributions, not by reading single coefficients.
        </p>
      </Callout>

      <SectionTitle
        title="Many predictions at once"
        intro="Real users upload files. The server must check them before trusting them – type, size and content – and answer with a clear status code when something is wrong."
      />
      <DemoCard
        title="Batch predictions from a CSV"
        description="Upload the sample (generated in your browser), download it and upload it yourself, or try one of the broken files. Valid rows are predicted in one vectorised call; bad rows are skipped and reported instead of failing the whole file. Click a column header to sort."
        concepts={['UploadFile', 'FormData', 'drag & drop', '400 / 413 / 415 / 422', 'sortable table', 'd3.bin']}
        files={[
          { name: 'BatchPredict.jsx', code: batchPredictCode },
          { name: 'sampleCsv.js', code: sampleCsvCode },
          { name: 'ResultsTable.jsx', code: resultsTableCode },
          { name: 'Histogram.jsx', code: histogramCode },
          PY.router,
        ]}
      >
        <BatchPredict />
      </DemoCard>

      <SectionTitle
        title="Is the model any good?"
        intro="Measure the model once, on data it never saw, and let the front end show the numbers. Accuracy alone hides the trade-off between false alarms and missed URLs – the threshold decides where you land."
      />
      <DemoCard
        title="Model report"
        description="Real numbers from the real model: GET /api/ml/metrics returns what train.py measured on the test split. Drag the threshold – the tiles, the dot on the ROC curve and the confusion matrix read the back end's thresholds table. Nothing is retrained."
        concepts={['GET metrics', 'derived state', 'ROC / AUC', 'confusion matrix', 'd3.line']}
        files={[
          { name: 'ModelReport.jsx', code: modelReportCode },
          { name: 'RocCurve.jsx', code: rocCurveCode },
          { name: 'ConfusionMatrix.jsx', code: confusionMatrixCode },
          { name: 'useApiGet.js', code: useApiGetCode },
          PY.train,
        ]}
      >
        <ModelReport />
      </DemoCard>

      <SectionTitle
        title="Behind the endpoint"
        intro="Training is slow and happens once; predicting is fast and happens on every request. Keeping those two apart is the most important design decision in a model server."
      />
      <DemoCard
        title="How the model is served"
        description="Click each step. The Code tab holds the complete back end of this page: features → training → loading → the router."
        concepts={['train offline', 'joblib artifact', 'lifespan', 'Depends()', 'response_model']}
        files={[PY.features, PY.train, PY.model, PY.router, { name: 'ServingDiagram.jsx', code: servingDiagramCode }, PY.dataset, PY.tests]}
      >
        <ServingDiagram />
      </DemoCard>

      <Callout type="tip" title="Assignment 3 checklist">
        <ul>
          <li><strong>Validate inputs</strong> with Pydantic (<code>PredictRequest</code>) and check uploads for type, size and content – bad input gets a 4xx, never a 500.</li>
          <li><strong>Version the model</strong>: save metadata with the artifact and return <code>model_version</code> with every prediction.</li>
          <li><strong>Load once</strong> at start-up (<code>lifespan</code>) and share the object – do not read the file on every request.</li>
          <li><strong>Return probabilities</strong>, not just labels, and say which threshold produced the label.</li>
          <li><strong>Handle errors</strong> on both sides: clear <code>detail</code> messages in FastAPI; loading, error and offline states in React.</li>
          <li><strong>Never retrain per request</strong> – train offline and ship the artifact (and its metrics) with your code.</li>
          <li><strong>Document the API</strong>: <code>summary</code>, <code>response_model</code> and <code>responses</code> make <code>/api/docs</code> readable for your team and your marker.</li>
        </ul>
      </Callout>
      <div className="demo-card">
        <CodeBlock code={COMMANDS} filename="Terminal" language="shell" />
      </div>

      <SectionTitle
        title="Performance"
        intro="How does the server cope when many predictions arrive at the same moment – and when is one big request better than many small ones?"
      />
      <DemoCard
        title="Latency under load"
        description="Choose N and fire N predictions at once, then the same N URLs as one batch. The histogram shows how long each request took in the browser; the tiles compare that with the model's own time."
        concepts={['Promise.all', 'performance.now()', 'thread pool', 'batching', 'd3.bin']}
        files={[{ name: 'LatencyLoad.jsx', code: latencyLoadCode }, { name: 'Histogram.jsx', code: histogramCode }, PY.router]}
      >
        <LatencyLoad />
      </DemoCard>

      <Callout type="note" title="Why the endpoints are plain def (not async def)">
        <p>
          scikit-learn blocks the CPU while it works. FastAPI runs a <code>def</code> endpoint in a pool of worker
          threads, so the event loop stays free to accept other requests; the same code inside{' '}
          <code>async def</code> would freeze every other request until it finished. Most of the round-trip time you
          see above is not the model at all: HTTP, the Vite proxy, JSON and queueing – browsers open at most six
          connections per server over HTTP/1.1, so later requests wait their turn. That is why one batch request beats
          many single ones.
        </p>
      </Callout>

      <Callout type="exercise">
        <ol>
          <li>
            In <code>backend/app/ml/features.py</code> add a feature such as <code>query_params</code> (the number of{' '}
            <code>&amp;</code>-separated parameters) and save – uvicorn restarts, <code>model.py</code> notices that the
            feature list changed and retrains. Press Explain in “Why this prediction?”, find your feature and note the new
            model version. Then run <code>tests/test_ml.py</code>: which tests fail now, and what are they protecting?
          </li>
          <li>
            Add an optional <code>top_k</code> field to <code>PredictRequest</code> in <code>routers/ml.py</code> that
            returns only the k largest contributions (validate it: 1–12). Send it from <code>WhyPrediction.jsx</code> and
            add a test to <code>tests/test_ml.py</code>.
          </li>
          <li>
            In <code>BatchPredict.jsx</code> add a threshold slider and send it as the <code>threshold</code> form field
            (see <code>predictBatch()</code> in <code>mlApi.js</code>). How do the tiles and the histogram marker change?
          </li>
          <li>
            In <code>ModelReport.jsx</code> draw the precision–recall curve from <code>metrics.pr_curve</code> next to the
            ROC curve – copy <code>RocCurve.jsx</code> as a starting point.
          </li>
          <li>
            Replace <code>LogisticRegression</code> with <code>RandomForestClassifier</code> in <code>train.py</code>.
            Which part of <code>model.py</code> breaks, and why? (Hint: <code>coef_</code>.) What would you return
            instead of exact contributions?
          </li>
        </ol>
      </Callout>
    </>
  );
}
