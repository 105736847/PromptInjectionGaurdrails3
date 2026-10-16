import { Braces, ChartColumn, Cpu, Database } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';

// 1. Threshold explorer (several files)
import ThresholdExplorer from './demos/threshold/ThresholdExplorer.jsx';
import thresholdExplorerCode from './demos/threshold/ThresholdExplorer.jsx?raw';
import scoreHistogramCode from './demos/threshold/ScoreHistogram.jsx?raw';
import useThresholdDragCode from './demos/threshold/useThresholdDrag.js?raw';
import confusionMatrixCode from './demos/threshold/ConfusionMatrix.jsx?raw';
import metricTilesCode from './demos/threshold/MetricTiles.jsx?raw';
import metricCurveCode from './demos/threshold/MetricCurve.jsx?raw';
import thresholdTableCode from './demos/threshold/ThresholdTable.jsx?raw';
import metricsCode from './demos/data/metrics.js?raw';
import phishingDataCode from './demos/data/phishingData.js?raw';
import chartHelpersCode from './demos/helpers/chart.js?raw';
import chartTooltipCode from './demos/helpers/ChartTooltip.jsx?raw';
// 2. Multi-class confusion matrix
import MultiClassConfusion from './demos/MultiClassConfusion.jsx';
import multiClassCode from './demos/MultiClassConfusion.jsx?raw';
import multiClassDataCode from './demos/data/multiclass.js?raw';
// 3. Training curves
import TrainingCurves from './demos/training/TrainingCurves.jsx';
import trainingCurvesCode from './demos/training/TrainingCurves.jsx?raw';
import trainingChartCode from './demos/training/TrainingChart.jsx?raw';
import trainingHistoryCode from './demos/data/trainingHistory.js?raw';
// 4. Feature importance
import FeatureImportance from './demos/FeatureImportance.jsx';
import featureImportanceCode from './demos/FeatureImportance.jsx?raw';
import featureImportanceDataCode from './demos/data/featureImportance.js?raw';
// 5. SHAP waterfall
import ShapWaterfall from './demos/ShapWaterfall.jsx';
import shapWaterfallCode from './demos/ShapWaterfall.jsx?raw';
import explanationsCode from './demos/data/explanations.js?raw';
// 6. Live decision boundary
import DecisionBoundary from './demos/boundary/DecisionBoundary.jsx';
import decisionBoundaryCode from './demos/boundary/DecisionBoundary.jsx?raw';
import tinyNetCode from './demos/boundary/tinyNet.js?raw';
import toyDatasetsCode from './demos/boundary/toyDatasets.js?raw';
import trainingPanelCode from './demos/boundary/TrainingPanel.jsx?raw';
import lossSparklineCode from './demos/boundary/LossSparkline.jsx?raw';
import pointsTableCode from './demos/boundary/PointsTable.jsx?raw';
// 7. Embedding explorer
import EmbeddingExplorer from './demos/embedding/EmbeddingExplorer.jsx';
import embeddingExplorerCode from './demos/embedding/EmbeddingExplorer.jsx?raw';
import selectionTableCode from './demos/embedding/SelectionTable.jsx?raw';
import clusterLabelsCode from './demos/embedding/clusterLabels.js?raw';
import clusterSummaryCode from './demos/embedding/ClusterSummary.jsx?raw';
import scrollFriendlyZoomCode from './demos/helpers/scrollFriendlyZoom.js?raw';
// 8. Parallel coordinates
import ParallelCoordinates from './demos/ParallelCoordinates.jsx';
import parallelCoordinatesCode from './demos/ParallelCoordinates.jsx?raw';
import hyperparamsCode from './demos/data/hyperparams.js?raw';
// 9. Calibration
import CalibrationDiagram from './demos/CalibrationDiagram.jsx';
import calibrationDiagramCode from './demos/CalibrationDiagram.jsx?raw';
import calibrationDataCode from './demos/data/calibration.js?raw';
// 10. Shown-only snippets
import reportApiCode from './snippets/report_api.py?raw';
import reportJsonCode from './snippets/report.json?raw';
import modelReportCode from './snippets/ModelReport.jsx?raw';
import SnippetTabs from './demos/SnippetTabs.jsx';
import './d3-ml.css';

// The FIRST chip of every card names the React + D3 pattern (the same words as in each file's header).
const RENDERS = 'Pattern: D3 calculates, React renders';
const OWNS = 'Pattern: D3 owns the <g>';
const MIXED = 'Pattern: mixed';

const FLOW = [
  { icon: Database, title: 'scikit-learn', text: 'predict_proba() on the held-out test set, then roc_curve(), confusion_matrix(), calibration_curve()…' },
  { icon: Cpu, title: 'FastAPI', text: 'GET /api/report returns plain JSON (cast NumPy values with float() / int() / .tolist()).' },
  { icon: Braces, title: 'React', text: 'useFetch() handles loading, error and data; reshape the JSON into the arrays a chart needs.' },
  { icon: ChartColumn, title: 'D3', text: 'The chart components on this page draw it – swap the synthetic data for report.scores.' },
];

const CHECKLIST = [
  ['How good is the model overall?', 'Stat tiles + confusion matrix (never accuracy alone on imbalanced data).'],
  ['Which threshold should we ship?', 'Score histogram with a draggable threshold, ROC and precision–recall curves.'],
  ['Which classes get mixed up?', 'Multi-class confusion matrix, row-normalised (= recall per class).'],
  ['Can I trust the probabilities?', 'Calibration (reliability) diagram.'],
  ['Is it over-fitting? When should training stop?', 'Training curves: train vs validation, loss and accuracy as two aligned charts.'],
  ['Which hyper-parameters work best?', 'Parallel coordinates of the search runs, brushed by val F1.'],
  ['What does the model rely on?', 'Feature importances / signed coefficients.'],
  ['Why THIS prediction?', 'SHAP-style waterfall for a single example.'],
  ['Where are the errors?', 'Embedding scatter plot with a linked table.'],
];

export default function D3MlPage() {
  return (
    <>
      <PageHeader
        eyebrow="Data Visualization (D3)"
        title="Visualising ML Results"
        intro="Assignment 3 asks you to show what your model learned – not just one accuracy number. This page uses a fictional phishing URL detector (1,000 held-out test URLs, only 16% of them phishing) to build the charts data scientists actually use: threshold trade-offs, confusion matrices, training curves, explanations and a model you can train right here in the browser. Every chart is React + D3 and ready to reuse in your own front-end."
        concepts={['classification metrics', 'linked views', 'd3.drag', 'keyed transitions', 'd3.contours', 'd3.zoom + d3.brush', 'd3.Delaunay', 'useRef for mutable state', 'FastAPI → JSON → React']}
        docs={[
          { label: 'D3 documentation', href: 'https://d3js.org' },
          { label: 'scikit-learn: model evaluation', href: 'https://scikit-learn.org/stable/modules/model_evaluation.html' },
          { label: 'React: referencing values with refs', href: 'https://react.dev/learn/referencing-values-with-refs' },
        ]}
      />

      <SectionTitle
        title="Is the model any good?"
        intro="A classifier gives every URL a score between 0 and 1. YOU choose the threshold that turns scores into decisions – and every metric changes with it."
      />
      <DemoCard
        title="Threshold explorer (linked views)"
        description="Drag the threshold line by its 0.50 handle (or use the slider, the arrow keys, a preset, or click a point on either curve). One piece of React state drives the tiles, the histogram, the confusion matrix, the ROC curve and the precision–recall curve."
        concepts={[RENDERS, 'lifting state up', 'd3.bin', 'd3.drag in a custom hook', 'd3.timer', 'clipPath', 'role="slider"', 'useLayoutEffect (tooltip)']}
        files={[
          { name: 'ThresholdExplorer.jsx', code: thresholdExplorerCode },
          { name: 'ScoreHistogram.jsx', code: scoreHistogramCode },
          { name: 'useThresholdDrag.js', code: useThresholdDragCode },
          { name: 'ConfusionMatrix.jsx', code: confusionMatrixCode },
          { name: 'MetricTiles.jsx', code: metricTilesCode },
          { name: 'MetricCurve.jsx', code: metricCurveCode },
          { name: 'ThresholdTable.jsx', code: thresholdTableCode },
          { name: 'metrics.js', code: metricsCode },
          { name: 'phishingData.js', code: phishingDataCode },
          { name: 'chart.js', code: chartHelpersCode },
          { name: 'ChartTooltip.jsx', code: chartTooltipCode },
        ]}
      >
        <ThresholdExplorer />
      </DemoCard>

      <Callout type="warning" title="Accuracy lies when classes are imbalanced">
        <p>
          Only 16% of these URLs are phishing, so a "model" that answers <em>legitimate</em> every time scores 84%
          accuracy – and catches nothing. Always report precision, recall and F1, show the confusion matrix, and switch
          the histogram to <strong>Raw counts</strong> to see the imbalance for yourself.
        </p>
      </Callout>

      <DemoCard
        title="Multi-class confusion matrix"
        description="Five URL classes. Normalise by row (recall) or column (precision), hover or tap a cell to light up its row and column, click a cell to see example URLs the model got wrong. Cell text switches between dark and white depending on the cell's colour."
        concepts={[OWNS, 'selection.join', 'key function', 'transition', 'roving focus (arrow keys)', 'luminance-based label colour']}
        files={[
          { name: 'MultiClassConfusion.jsx', code: multiClassCode },
          { name: 'multiclass.js', code: multiClassDataCode },
          { name: 'chart.js', code: chartHelpersCode },
          { name: 'ChartTooltip.jsx', code: chartTooltipCode },
        ]}
      >
        <MultiClassConfusion />
      </DemoCard>

      <DemoCard
        title="Calibration (reliability) diagram"
        description="When the model says 70%, is it right 70% of the time? Points on the diagonal mean honest probabilities. The histogram below shares the same x-axis and shows how many predictions each bin holds."
        concepts={[RENDERS, 'shared x scale', 'd3.line().defined()', 'hover band across two charts', 'table view']}
        files={[
          { name: 'CalibrationDiagram.jsx', code: calibrationDiagramCode },
          { name: 'calibration.js', code: calibrationDataCode },
          { name: 'ChartTooltip.jsx', code: chartTooltipCode },
        ]}
      >
        <CalibrationDiagram />
      </DemoCard>

      <SectionTitle
        title="How did training go?"
        intro="Charts that answer: is the model still learning, is it over-fitting, and which settings worked best?"
      />
      <DemoCard
        title="Training curves"
        description="Loss and accuracy per epoch for three model variants, as two aligned charts with a synced crosshair. Toggle runs in the legend, switch the loss to a log scale, and press Replay to watch the curves arrive like a live training dashboard."
        concepts={[OWNS, 'shared hover state', 'd3.scaleLog', 'axis transitions', 'd3.timeout', 'early stopping']}
        files={[
          { name: 'TrainingCurves.jsx', code: trainingCurvesCode },
          { name: 'TrainingChart.jsx', code: trainingChartCode },
          { name: 'trainingHistory.js', code: trainingHistoryCode },
          { name: 'ChartTooltip.jsx', code: chartTooltipCode },
        ]}
      >
        <TrainingCurves />
      </DemoCard>

      <Callout type="tip" title="Two charts, never two y-axes">
        <p>
          Loss (0–0.9) and accuracy (65–100%) have different units. Squeezing both onto one plot with a second y-axis
          makes the crossing points meaningless. Stack two charts with the same width and x scale instead – and share the
          hover state so the crosshair moves in both.
        </p>
      </Callout>

      <DemoCard
        title="Hyper-parameter search: parallel coordinates"
        description="Sixty GradientBoosting runs, one line each. Drag vertically on any axis to keep only runs in that range – filters on several axes combine. Lines are coloured by validation F1. Drag an axis title sideways (or focus it and press ← →) to reorder the axes."
        concepts={[MIXED, 'd3.brushY', 'd3.scalePoint', 'd3.scaleLog', 'filters as state', 'pointer capture']}
        files={[
          { name: 'ParallelCoordinates.jsx', code: parallelCoordinatesCode },
          { name: 'hyperparams.js', code: hyperparamsCode },
          { name: 'ChartTooltip.jsx', code: chartTooltipCode },
        ]}
      >
        <ParallelCoordinates />
      </DemoCard>

      <SectionTitle
        title="Why did the model decide that?"
        intro="Explainability charts: what the model relies on in general, why it made one particular prediction, and where its mistakes live."
      />
      <DemoCard
        title="Feature importance"
        description="Switch between models: tree importances are always positive (neutral grey – a size, no direction), logistic-regression coefficients have a sign and become diverging bars: red pushes towards phishing, blue towards legitimate. That is a direction, not a class – orange stays the phishing class colour, used only in the charts that show classes (the score histogram and the embedding). Hover, tap or Tab to a bar for its numbers, and watch the bars slide to their new rank – the key function keeps each bar attached to its feature."
        concepts={[OWNS, 'key function', 'staggered transition', 'diverging bars', 'd3.scaleBand', 'focusable rows']}
        files={[
          { name: 'FeatureImportance.jsx', code: featureImportanceCode },
          { name: 'featureImportance.js', code: featureImportanceDataCode },
          { name: 'chart.js', code: chartHelpersCode },
          { name: 'ChartTooltip.jsx', code: chartTooltipCode },
        ]}
      >
        <FeatureImportance />
      </DemoCard>

      <DemoCard
        title="Explaining one prediction (waterfall)"
        description="Pick a URL. Starting from the base rate, each feature pushes the probability up (towards phishing) or down (towards legitimate) until we reach the model's prediction – the idea behind SHAP. Hover, tap or Tab to a row for its numbers."
        concepts={[OWNS, 'enter / update / exit', 'running totals', 'measuring text', 'focusable rows', 'badge + icon']}
        files={[
          { name: 'ShapWaterfall.jsx', code: shapWaterfallCode },
          { name: 'explanations.js', code: explanationsCode },
          { name: 'chart.js', code: chartHelpersCode },
          { name: 'ChartTooltip.jsx', code: chartTooltipCode },
        ]}
      >
        <ShapWaterfall />
      </DemoCard>

      <DemoCard
        title="Embedding explorer"
        description="All 1,000 test URLs in a 2-D projection. Ctrl/⌘ + scroll (or pinch) to zoom and drag to pan – a plain scroll still scrolls the page, and on a phone one finger scrolls while two fingers pan. Switch to Brush and drag a rectangle to list the selected URLs below. Hover (or tap) finds the nearest point, however small; cluster names shorten or step aside when they would collide."
        concepts={[OWNS, 'd3.zoom', 'zoom.filter', 'd3.brush', 'd3.Delaunay', 'label collision', 'linked table']}
        files={[
          { name: 'EmbeddingExplorer.jsx', code: embeddingExplorerCode },
          { name: 'scrollFriendlyZoom.js', code: scrollFriendlyZoomCode },
          { name: 'clusterLabels.js', code: clusterLabelsCode },
          { name: 'SelectionTable.jsx', code: selectionTableCode },
          { name: 'ClusterSummary.jsx', code: clusterSummaryCode },
          { name: 'phishingData.js', code: phishingDataCode },
          { name: 'ChartTooltip.jsx', code: chartTooltipCode },
        ]}
      >
        <EmbeddingExplorer />
      </DemoCard>

      <SectionTitle
        title="Train a model in the browser"
        intro="No Python needed: a logistic regression and a tiny neural network written in plain JavaScript, trained live while D3 redraws the decision boundary."
      />
      <DemoCard
        title="Live decision boundary"
        description="Choose a dataset and a model, then press Train. Logistic regression can only draw a straight line – try it on circles or xor, then switch to the neural net. Add points – click the plot, press + 10 points, or focus the plot and use the arrow keys + Enter – and watch the model adapt."
        concepts={[MIXED, 'useRef (mutable model)', 'd3.timer + cleanup', 'd3.contours', 'd3.geoPath', 'gradient descent', 'backpropagation']}
        files={[
          { name: 'DecisionBoundary.jsx', code: decisionBoundaryCode },
          { name: 'TrainingPanel.jsx', code: trainingPanelCode },
          { name: 'tinyNet.js', code: tinyNetCode },
          { name: 'toyDatasets.js', code: toyDatasetsCode },
          { name: 'LossSparkline.jsx', code: lossSparklineCode },
          { name: 'PointsTable.jsx', code: pointsTableCode },
        ]}
      >
        <DecisionBoundary />
      </DemoCard>

      <Callout type="note" title="State or ref?">
        <p>
          The network's weights change 300 times a second, and nothing on screen reads them directly – so they live in
          a <code>useRef</code>. What the screen <em>does</em> show (epoch, loss, the probability grid) is copied into
          state once per frame. And because the loop is started in an effect, its cleanup (<code>timer.stop()</code>)
          runs on pause and when you leave the page.
        </p>
      </Callout>

      <SectionTitle
        title="Connect it to your own model"
        intro="In Assignment 3 the numbers come from YOUR model. Compute them in Python, send them as JSON, and let React + D3 draw them."
      />
      <section className="demo-card" id="fastapi-backend" aria-labelledby="d3ml-api-title">
        <header className="demo-card-header">
          <div>
            <h3 id="d3ml-api-title">Getting the numbers from your FastAPI back-end</h3>
            <p>Shown code, not run on this page: a FastAPI endpoint built on scikit-learn, the JSON it returns, and a React component that fetches it and feeds the charts above.</p>
          </div>
        </header>
        <div className="demo-preview">
          <ol className="d3ml-flow" aria-label="From model to chart">
            {FLOW.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="d3ml-flow-icon"><Icon size={18} aria-hidden="true" /></span>
                <strong>{title}</strong>
                <span className="small muted">{text}</span>
              </li>
            ))}
          </ol>
        </div>
        <SnippetTabs
          label="Back-end to front-end files"
          files={[
            { name: '1. report_api.py', title: 'report_api.py (FastAPI + scikit-learn)', language: 'python', code: reportApiCode },
            { name: '2. response.json', title: 'GET /api/report → response (trimmed)', language: 'json', code: reportJsonCode },
            { name: '3. ModelReport.jsx', title: 'src/components/ModelReport.jsx', code: modelReportCode },
          ]}
        />
      </section>

      <Callout type="note" title="Checklist: which chart answers which question?">
        <dl className="d3ml-checklist">
          {CHECKLIST.map(([question, answer]) => (
            <div key={question}>
              <dt>{question}</dt>
              <dd>{answer}</dd>
            </div>
          ))}
        </dl>
      </Callout>

      <Callout type="exercise">
        <ol>
          <li>
            In <code>ThresholdExplorer.jsx</code>, add a "cost of a missed phishing URL" input (e.g. 10× a false alarm) and a
            preset that picks the threshold with the lowest total cost. Show that cost as a sixth tile in <code>MetricTiles.jsx</code>.
          </li>
          <li>
            In <code>MultiClassConfusion.jsx</code>, add a column on the right with each row's total (the "support") and
            highlight the worst-recall class.
          </li>
          <li>
            Give <code>TrainingCurves.jsx</code> a "patience" number input and pass it to <code>bestEpoch(history, patience)</code>
            in <code>trainingHistory.js</code>. Draw a second marker where training would actually stop.
          </li>
          <li>
            Add a second hidden layer (or a ReLU option) to <code>tinyNet.js</code> and compare how fast
            <code> DecisionBoundary.jsx</code> solves <em>circles</em> and <em>xor</em>.
          </li>
          <li>
            Assignment 3: implement <code>/api/report</code> from <code>report_api.py</code> for your own model and render
            <code> ModelReport.jsx</code> with <code>useFetch</code> – including its loading and error states.
          </li>
        </ol>
      </Callout>
    </>
  );
}
