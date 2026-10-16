/**
 * fakeApi.js – a pretend back-end that runs inside the browser.
 *
 * Every function returns a Promise that settles after a short delay, just like
 * fetch() does. The options let you simulate a slow network or a failing
 * server, so you can build and test loading and error states without Wi-Fi.
 * When the real back-end is ready, only this file has to change – the
 * components that call it stay the same.
 */
import { students } from '../../../data/students.js';

/** Resolve with getResult() after a delay – or reject, if asked to fail. */
function simulate(getResult, { slow = false, fail = false, signal } = {}) {
  return new Promise((resolve, reject) => {
    const abortError = () => new DOMException('The request was aborted.', 'AbortError');
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const delay = slow ? 2000 + Math.random() * 1000 : 300 + Math.random() * 400;
    const timer = setTimeout(() => {
      try {
        if (fail) throw new Error('503 Service Unavailable (simulated failure)');
        // structuredClone: callers get a copy, so they can't change our "database"
        resolve(structuredClone(getResult()));
      } catch (error) {
        reject(error);
      }
    }, delay);

    // Support cancelling, exactly like fetch(url, { signal }).
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(abortError());
    });
  });
}

/** GET /students?page=2&pageSize=6 → one page of results + paging info. */
export function getStudents({ page = 1, pageSize = 6 } = {}, options) {
  return simulate(() => {
    const start = (page - 1) * pageSize;
    return {
      items: students.slice(start, start + pageSize),
      page,
      pageSize,
      total: students.length,
    };
  }, options);
}

/** GET /students/search?q=… → students whose name or major contains the text. */
export function searchStudents(query, options) {
  return simulate(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => `${s.firstName} ${s.lastName} ${s.major}`.toLowerCase().includes(q)).slice(0, 8);
  }, options);
}

/**
 * POST /predict → a tiny "machine-learning model" (a hand-written logistic
 * regression) that predicts whether a student will pass the unit.
 */
export function predictPass({ study_hours, attendance, quiz_average }, options) {
  return simulate(() => {
    // Validate like FastAPI + Pydantic would – they answer 422 for bad input.
    const inRange = (value, max) => typeof value === 'number' && value >= 0 && value <= max;
    if (!inRange(study_hours, 80) || !inRange(attendance, 100) || !inRange(quiz_average, 100)) {
      throw new Error('422 Unprocessable Content: values are out of range');
    }
    const z = -6 + 0.25 * study_hours + 0.04 * attendance + 0.05 * quiz_average;
    const probability = 1 / (1 + Math.exp(-z)); // the sigmoid squashes z into 0…1
    return {
      prediction: probability >= 0.5 ? 'Pass' : 'At risk',
      probability: Math.round(probability * 1000) / 1000,
      model: 'demo-logistic-v1',
    };
  }, options);
}
