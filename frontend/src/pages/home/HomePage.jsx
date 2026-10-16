import { Link } from 'react-router';

function HomePage() {
  return (
    <main>
      <h1>Prompt Injection Guardrail Checker</h1>

      <p>Welcome to our COS30049 project.</p>

      <Link to="/results">
        View Results Page
      </Link>
    </main>
  );
}

export default HomePage;