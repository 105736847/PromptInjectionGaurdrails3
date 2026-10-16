/**
 * openapi.js – small helpers for reading FastAPI's OpenAPI document.
 *
 * FastAPI writes /api/openapi.json for you, from your routes, parameter types and
 * Pydantic models. Swagger UI (/api/docs) is built from exactly this JSON – and so
 * is the playground on this page.
 */
const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

/** spec.paths → [{ tag, operations: [{ id, method, path, summary, parameters, requestBody }] }] */
export function groupOperations(spec) {
  const groups = new Map();
  for (const [path, item] of Object.entries(spec.paths ?? {})) {
    for (const method of METHODS) {
      const operation = item[method];
      if (!operation) continue;
      const tag = operation.tags?.[0] ?? 'other';
      if (!groups.has(tag)) groups.set(tag, []);
      groups.get(tag).push({
        id: `${method.toUpperCase()} ${path}`,
        method: method.toUpperCase(),
        path,
        summary: operation.summary ?? '',
        parameters: [...(item.parameters ?? []), ...(operation.parameters ?? [])],
        requestBody: operation.requestBody ?? null,
      });
    }
  }
  return [...groups].map(([tag, operations]) => ({ tag, operations }));
}

/** The operation with this id ("GET /api/basics/hello"), or undefined. */
export function findOperation(spec, id) {
  return groupOperations(spec).flatMap((group) => group.operations).find((op) => op.id === id);
}

/** Follow {"$ref": "#/components/schemas/FeedbackIn"} to the schema it points at. */
export function resolve(schema, spec) {
  let current = schema;
  for (let hops = 0; current?.$ref && hops < 10; hops += 1) {
    current = current.$ref.split('/').slice(1).reduce((node, key) => node?.[key], spec);
  }
  return current ?? {};
}

const SAMPLE_STRINGS = { email: 'mia.chen@student.example.edu', 'date-time': '2026-09-28T09:00:00Z', date: '2026-09-28' };

/** Invent a sensible example value from a JSON Schema (used to pre-fill the body). */
export function exampleFor(schema, spec, depth = 0) {
  const s = resolve(schema, spec);
  if (depth > 6) return null;
  if (s.examples?.length) return s.examples[0];
  if (s.default !== undefined) return s.default;
  if (s.enum?.length) return s.enum[0];
  const variants = s.anyOf ?? s.oneOf ?? s.allOf;
  if (variants) return exampleFor(variants.find((v) => v.type !== 'null') ?? variants[0], spec, depth + 1);
  switch (s.type) {
    case 'object':
      return Object.fromEntries(Object.entries(s.properties ?? {}).map(([key, value]) => [key, exampleFor(value, spec, depth + 1)]));
    case 'array':
      return s.items ? [exampleFor(s.items, spec, depth + 1)] : [];
    case 'integer':
    case 'number': {
      // In the middle of the allowed range (rating 1–5 → 3), or the minimum, or 1.
      const middle = s.minimum !== undefined && s.maximum !== undefined ? (s.minimum + s.maximum) / 2 : s.minimum ?? 1;
      return s.type === 'integer' ? Math.round(middle) : middle;
    }
    case 'boolean':
      return false;
    case 'string':
      return SAMPLE_STRINGS[s.format] ?? (s.minLength > 6 ? 'x'.repeat(s.minLength) : 'text');
    default:
      return null;
  }
}

/** What kind of body does this operation take? 'json' | 'form' | 'multipart' | null */
export function bodyKind(requestBody) {
  const types = Object.keys(requestBody?.content ?? {});
  if (types.includes('application/json')) return 'json';
  if (types.includes('application/x-www-form-urlencoded')) return 'form';
  if (types.includes('multipart/form-data')) return 'multipart';
  return null;
}

/** The starting text for the body box: pretty JSON, or empty "key=" lines for a form. */
export function exampleBody(requestBody, spec) {
  const kind = bodyKind(requestBody);
  if (!kind) return '';
  const schema = resolve(Object.values(requestBody.content)[0].schema, spec);
  if (kind === 'json') return JSON.stringify(exampleFor(schema, spec), null, 2);
  // Forms (e.g. the login form): the required fields, left empty for you to fill in.
  return (schema.required ?? Object.keys(schema.properties ?? {})).map((key) => `${key}=`).join('\n');
}

/** A short human label for a parameter's type, e.g. "integer 1…2" or "hawthorn | sarawak | online". */
export function typeLabel(schema, spec) {
  const s = resolve(schema, spec);
  if (s.enum) return s.enum.join(' | ');
  const variants = s.anyOf ?? s.oneOf;
  if (variants) return variants.map((variant) => typeLabel(variant, spec)).join(' | ');
  const hasRange = s.minimum !== undefined || s.maximum !== undefined;
  const range = hasRange ? ` ${s.minimum ?? ''}…${s.maximum ?? ''}` : '';
  return `${s.type ?? 'any'}${range}${s.pattern ? ` ${s.pattern}` : ''}`;
}
