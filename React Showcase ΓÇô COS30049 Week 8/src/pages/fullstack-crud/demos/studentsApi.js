/**
 * studentsApi.js – every call to /api/students lives in this ONE file.
 *
 * Components call studentsApi.create(data) instead of building URLs and
 * fetch options themselves. If the API changes, this is the only file to edit.
 * The shared client (src/api/client.js) adds JSON headers, timeouts and turns
 * FastAPI errors into ApiError objects with `status`, `detail` and `fieldErrors`.
 */
import { api } from '../../../api/client.js';

// The same allowed values as the Literal types in backend/app/models/student.py
export const MAJORS = ['Artificial Intelligence', 'Cybersecurity', 'Software Development', 'Data Science', 'Internet of Things'];
export const CAMPUSES = ['Hawthorn', 'Sarawak', 'Online'];
export const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'graduated', label: 'Graduated' },
];
export const GRADES = ['HD', 'D', 'C', 'P', 'N'];

/** { q: 'chen', major: '', page: 2 } → "?q=chen&page=2" (empty values are left out). */
export function toQueryString(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== null && value !== undefined) search.set(key, value);
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

export const studentsApi = {
  list: (params, options) => api.get(`/api/students${toQueryString(params)}`, options),
  get: (id, options) => api.get(`/api/students/${id}`, options),
  create: (student, options) => api.post('/api/students', student, options),
  update: (id, changes, options) => api.patch(`/api/students/${id}`, changes, options),
  remove: (id, options) => api.delete(`/api/students/${id}`, options),
  stats: (options) => api.get('/api/students/stats', options),
  reset: (options) => api.post('/api/students/reset', undefined, options),
};

/**
 * Field errors for a form, from either
 *   422 – FastAPI validation: error.fieldErrors (built by client.js), or
 *   409 – our duplicate check, which uses the same [{ loc, msg }] shape on purpose.
 */
export function fieldErrorsOf(error) {
  if (error?.status === 409 && Array.isArray(error.detail)) {
    return Object.fromEntries(error.detail.map((item) => [item.loc.at(-1), item.msg]));
  }
  return error?.fieldErrors ?? {};
}

/** A student from the API → only the fields POST accepts (used by "Undo delete"). */
export function toCreatePayload(student) {
  const { id: _id, grade: _grade, ...fields } = student; // id and grade are chosen by the server
  return fields;
}
