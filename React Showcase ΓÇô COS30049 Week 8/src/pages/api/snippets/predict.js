// src/api/predict.js – call your FastAPI model from React.
// (Shown for reference only – this file is not run by the showcase.)

// Read the back-end URL from .env – never hard-code it in components.
const API_URL = import.meta.env.VITE_API_URL; // e.g. "http://localhost:8000"

export async function predict(features, { signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features), // { study_hours: 8, attendance: 75, quiz_average: 60 }
      signal, // lets the caller cancel the request (AbortController)
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    // Network failure: server not running, wrong URL, CORS blocked, offline…
    throw new Error('Cannot reach the prediction server. Is the back-end running?');
  }

  if (!response.ok) {
    // FastAPI sends errors as JSON: { "detail": "..." }
    // and for validation errors (422) a list: { "detail": [{ "loc": [...], "msg": "..." }] }
    let message = `The server answered ${response.status}.`;
    try {
      const body = await response.json();
      if (typeof body.detail === 'string') message = body.detail;
      if (Array.isArray(body.detail)) {
        message = body.detail.map((problem) => `${problem.loc.at(-1)}: ${problem.msg}`).join('; ');
      }
    } catch {
      // the error body was not JSON – keep the generic message
    }
    throw new Error(message);
  }

  return response.json(); // e.g. { "prediction": "Pass", "probability": 0.87 }
}

// In a component (compare with PredictForm.jsx on this page):
//
// async function handleSubmit(event) {
//   event.preventDefault();
//   setStatus('loading');
//   try {
//     const data = await predict({ study_hours: Number(hours), attendance: Number(attendance), quiz_average: Number(quiz) });
//     setResult(data);
//     setStatus('success');
//   } catch (error) {
//     setError(error.message);
//     setStatus('error');
//   }
// }
