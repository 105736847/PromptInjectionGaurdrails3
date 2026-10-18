
import { useEffect, useState } from 'react';
import api from '../../api';

function TestPage() {
  const [getData, setGetData] = useState(null);
  const [postData, setPostData] = useState(null);
  const [message, setMessage] = useState('Hello from React!');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await api.get('/');
        setGetData(response.data);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchData();
  }, []);

  async function handlePost() {
    try {
      setError('');

      const response = await api.post('/', {
        message: message,
      });

      setPostData(response.data);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main>
      <h1>Test Backend</h1>

      <section>
        <h2>GET Request</h2>
        <pre>{JSON.stringify(getData, null, 2)}</pre>
        <br/>
        <p>{getData?.message}</p>

      </section>

      <section>
        <h2>POST Request</h2>

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter a message"
        />

        <button onClick={handlePost}>
          Send POST Request
        </button>

        {postData && <pre>{JSON.stringify(postData, null, 2)}</pre>}
      </section>

      {error && <p>{error}</p>}
    </main>
  );
}

export default TestPage;