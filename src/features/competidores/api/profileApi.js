import { BACKEND_API_BASE_URL } from '../../../core/network/backend.js';

const API_BASE_URL = BACKEND_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || '';

const TOKEN_KEY = 'rider_profile_token';

export function getProfileToken() {
  return sessionStorage.getItem(TOKEN_KEY) || '';
}

export function setProfileToken(token) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export function clearProfileToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function parseJson(response) {
  const raw = await response.text().catch(() => '');
  let body = {};
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      if (!response.ok) {
        throw new Error(raw.slice(0, 200) || `Error ${response.status}`);
      }
    }
  }
  if (!response.ok) {
    const err = new Error(body.message || `Error ${response.status}`);
    err.status = response.status;
    err.body = body;
    throw err;
  }
  return body;
}

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export async function unlockRiderProfile({ full_name, emergency_phone }) {
  const body = await parseJson(
    await fetch(buildUrl('/api/rider-profile/unlock'), {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, emergency_phone }),
    })
  );
  if (body.profile_token) setProfileToken(body.profile_token);
  return body;
}

export async function fetchRiderProfile(token) {
  const t = token || getProfileToken();
  const body = await parseJson(
    await fetch(buildUrl(`/api/rider-profile/${encodeURIComponent(t)}`), {
      headers: { Accept: 'application/json' },
    })
  );
  if (body.profile_token) setProfileToken(body.profile_token);
  return body;
}

export async function fetchAvailablePlates(token) {
  const t = token || getProfileToken();
  return parseJson(
    await fetch(buildUrl(`/api/rider-profile/${encodeURIComponent(t)}/plates`), {
      headers: { Accept: 'application/json' },
    })
  );
}

export async function updateRiderProfile(token, formData) {
  const t = token || getProfileToken();
  const body = await parseJson(
    await fetch(buildUrl(`/api/rider-profile/${encodeURIComponent(t)}`), {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    })
  );
  return body;
}
