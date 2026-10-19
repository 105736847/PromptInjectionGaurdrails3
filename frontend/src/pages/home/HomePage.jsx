import { useState } from 'react';
import { useNavigate } from 'react-router';
import './HomePage.css';

function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); 
 
  function handleSubmit(e) {
    e.preventDefault();
    if (prompt.trim() === "") {
      setError("Please enter a prompt before submitting");
      return;
    }

    setError("");
    navigate('/results', {state: {prompt}}); 
    console.log("Submitted Prompt:", prompt);
  }

  function onChange(e) {
    setPrompt(e.target.value);
    if (error) setError("");
  }

  return (
    <main className="home-page">
      <h1 className="home-title">Prompt Injection Guardrail Checker</h1>

      <form className="home-card" onSubmit={handleSubmit} noValidate>
        <label className="home-heading" htmlFor="prompt-textarea">
          Write the instruction
        </label>

        <textarea
          className="home-textarea"
          name="submitted-prompt"
          id="prompt-textarea"
          placeholder="Write your prompt here"
          value={prompt}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "prompt-error" : undefined}
        />

        {error && (
          <p id="prompt-error" className="home-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="home-submit">
          Submit
        </button>
      </form>
    </main>
  );
}

export default HomePage;
