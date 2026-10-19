import { Link } from 'react-router';
import { useState } from 'react';

import ResultBanner from './components/ResultBanner.jsx';
import SubmittedPrompt from './components/SubmittedPrompt.jsx';
import GuardrailDiagnostics from './components/GuardrailDiagnostics.jsx';
import SafetyMetrics from './components/SafetyMetrics.jsx';
import PromptHistory from './components/PromptHistory.jsx';




//import { mockResult } from '../../data/mockResults.js';
import { mockHistory } from '../../data/mockResults.js';

import './ResultsPage.css';

function ResultsPage() {
  // Mock result for frontend development
  //const result = mockResult;
  const [result, setResult] = useState(mockHistory[0]);
  return (
    <main className="results-page">
      {/* Prediction status */}
      <ResultBanner status={result.status} />
      <div className="results-grid">
        <div className="results-left">
          {/* Original prompt and matched phrases */}
          <SubmittedPrompt
            prompt={result.prompt}
            highlightedSpans={result.highlightedSpans}
          />
          {/* Diagnostics - next component */}
          <GuardrailDiagnostics
            features={result.features}
            status={result.status}
          />
        </div>
        {/* Safety metrics - future component */}
        <SafetyMetrics
            categories={result.attackCategoryCounts}
            status={result.status}
            attackTypeConfidences={result.attackTypeConfidences}
        />
      </div>

      <div className="results-actions">
        <Link to="/">Check Another Prompt</Link>
      </div>
      <PromptHistory
        history={mockHistory}
        selectedId={result.id}
        onSelect={setResult}
      />
    </main>
  );
}
export default ResultsPage;
