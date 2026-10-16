// The same request with axios (npm install axios). Optional – fetch() is enough.
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000, // give up after 10 seconds
});

export async function predict(features) {
  try {
    // axios turns the object into JSON, sets the Content-Type header,
    // parses the response for you and THROWS for 4xx/5xx (fetch does not).
    const { data } = await api.post('/predict', features);
    return data;
  } catch (error) {
    const detail = error.response?.data?.detail;
    throw new Error(typeof detail === 'string' ? detail : error.message);
  }
}
