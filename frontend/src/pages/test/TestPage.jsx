
import { useEffect, useState } from 'react';
import api from '../../api';

function TestPage() {
  const [promptHistory, setPromptHistory] = useState(null);
  const [promptResponse, setPromptResponse] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPromptHistory();
  }, []);

  async function fetchPromptHistory() {
    try {
      const response = await api.get('/history');
      setPromptHistory(response.data);
    } catch (err) {
      setError(err.message);
    }
  }
  
  async function handlePromptSubmit() {
    event.preventDefault();

    try {
      setError('');

      const response = await api.post('/prompt', {
        prompt: prompt,
      });

      setPromptResponse(response.data);
      await fetchPromptHistory(); // updates history
      setPrompt('')
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main>
      <h1>Test Backend</h1>

      <section>
        <h2>Prompt history: (GET)</h2>
        <h3>raw:</h3>
        <pre>{JSON.stringify(promptHistory, null, 2)}</pre>
        <h3>display:</h3>
        <p>{promptHistory?.message}</p>

      </section>
      <br/>
      <section>
        <h2>Submit prompt: (POST)</h2>

        <form onSubmit={handlePromptSubmit}>
          <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a prompt"
          />
          <button type='submit'>
          Submit Prompt
          </button>
        </form>

        <h3>raw:</h3>
        {promptResponse && <pre>{JSON.stringify(promptResponse, null, 2)}</pre>}
      </section>

      {error && <p>{error}</p>}
    </main>
  );
}

export default TestPage;