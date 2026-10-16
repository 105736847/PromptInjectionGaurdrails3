import { Link } from 'react-router';

function ResultsPage() {
  return (
    <main>
      <h1>Prompt Analysis Results</h1>

      <p>Your prompt analysis results will appear here.</p>

      <Link to="/">
        Check Another Prompt
      </Link>
    </main>
  );
}

export default ResultsPage;