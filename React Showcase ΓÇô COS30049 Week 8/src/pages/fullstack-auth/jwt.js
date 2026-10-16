/**
 * jwt.js – read a JSON Web Token in the browser (WITHOUT verifying it).
 *
 * A JWT is three base64url strings joined by dots:
 *
 *   eyJhbGciOi…  .  eyJzdWIiOi…  .  4gPCzq-mU3…
 *     header          payload         signature
 *
 * Decoding needs no secret – it is just base64. So:
 *   - anyone who has a token can READ it → never put secrets in a JWT;
 *   - the browser cannot tell a genuine token from a forged one. Only the server,
 *     which knows SECRET_KEY, can VERIFY the signature. Decoding ≠ verifying.
 */

/** base64url → text. base64url uses - and _ instead of + and /, and drops the = padding. */
export function base64UrlDecode(part) {
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded); // atob gives one "character" per byte …
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes); // … TextDecoder turns UTF-8 bytes into text (e.g. "Zoë")
}

/** text → base64url (the reverse, used by the "tamper" demo). */
export function base64UrlEncode(text) {
  const bytes = new TextEncoder().encode(text);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * decodeJwt(token) → { header, payload, parts } or null if it is not a well-formed JWT.
 * `parts` are the three raw strings, handy for colour-coding the token.
 */
export function decodeJwt(token) {
  const parts = typeof token === 'string' ? token.split('.') : [];
  if (parts.length !== 3) return null;
  try {
    return {
      header: JSON.parse(base64UrlDecode(parts[0])),
      payload: JSON.parse(base64UrlDecode(parts[1])),
      parts,
    };
  } catch {
    return null; // not base64 / not JSON
  }
}

/**
 * Change claims in the payload but keep the ORIGINAL header and signature –
 * exactly what an attacker without the secret key would try.
 */
export function tamperWithPayload(token, changes) {
  const decoded = decodeJwt(token);
  if (!decoded) return null;
  const forgedPayload = base64UrlEncode(JSON.stringify({ ...decoded.payload, ...changes }));
  return `${decoded.parts[0]}.${forgedPayload}.${decoded.parts[2]}`;
}
