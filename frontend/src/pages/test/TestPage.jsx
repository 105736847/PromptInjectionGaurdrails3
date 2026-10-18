
import { useEffect, useState } from 'react';
import api from '../../api';

function TestPage() {
  const [results, setResults] = useState(null);
  const [promptResponse, setPromptResponse] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [id, setId] = useState(null);
  const [result, setResult] = useState(null);
  const [latestId, setLatestId] = useState(null);
  const [deleteResponse, setDeleteResponse] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    updateViews();
  }, []);

  async function handlePromptSubmit() {
    event.preventDefault();

    try {
      setError('');

      const response = await api.post('/prompt', {
        prompt: prompt,
      });

      setPromptResponse(response.data);
      await updateViews();
      setPrompt('')
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateViews() {
    fetchResults();
    fetchLatestId();
  }

  async function fetchResults() {
    try {
      const response = await api.get('/results');
      setResults(response.data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function getResultById() {
    event.preventDefault();
    try {
      const response = await api.get('/result', {params: {id: id}});
      setResult(response.data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function fetchLatestId() {
    event.preventDefault();
    try {
      const response = await api.get('/result/latest_id');
      setLatestId(response.data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteById() {
    event.preventDefault();
    try {
      const response = await api.delete('/result/delete', {params: {id: deleteId}});
      setDeleteResponse(response.data);
      await updateViews();
      setDeleteId(null);
    } catch (err) {
      setError(err.message);
    }
  }


  return (
    <main>
      <h1>Test Backend</h1>
      <hr/>
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
      <hr/>
      <section>
        <h2>History: (GET)</h2>
        <h3>raw:</h3>
        <pre>{JSON.stringify(results, null, 2)}</pre>
      </section>
      <hr/>
      <section>
        <h2>Result by ID: (GET)</h2>

        <form onSubmit={getResultById}>
          <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Enter ID"
          />
          <button type='submit'>
          Submit ID
          </button>
        </form>

        <h3>raw:</h3>
        {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      </section>
      <hr/>
      <section>
        <h2>Latest ID: (GET)</h2>
        <h3>raw:</h3>
        <p>{latestId}</p>
      </section>
      <hr/>
      <section>
        <h2>Delete by ID: (DELETE)</h2>

        <form onSubmit={deleteById}>
          <input
          value={deleteId}
          onChange={(e) => setDeleteId(e.target.value)}
          placeholder="Enter ID"
          />
          <button type='submit'>
          Submit ID
          </button>
        </form>

        <h3>raw:</h3>
        {deleteResponse && <pre>{JSON.stringify(deleteResponse, null, 2)}</pre>}
      </section>

      {error && <p>{error}</p>}
    </main>
  );
}

export default TestPage;