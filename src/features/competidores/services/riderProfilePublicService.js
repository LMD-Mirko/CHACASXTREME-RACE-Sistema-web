/**
 * API pública para completar ficha del competidor (sin login staff).
 */
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
    throw new Error(body.message || `Error ${response.status}`);
  }
  return body;
}

export async function unlockRiderProfile({ full_name, emergency_phone }) {
  return parseJson(
    await fetch('/api/rider-profile/unlock', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, emergency_phone }),
    })
  );
}

export async function fetchRiderProfile(token) {
  return parseJson(
    await fetch(`/api/rider-profile/${encodeURIComponent(token)}`, {
      headers: { Accept: 'application/json' },
    })
  );
}

export async function updateRiderProfile(token, formData) {
  return parseJson(
    await fetch(`/api/rider-profile/${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    })
  );
}
