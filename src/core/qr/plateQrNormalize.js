/** Extrae payload firmado CXR4 desde texto crudo o URL. */
const CXR4_RE = /(CXR4\.[0-9]+\.[0-9]+\.[0-9]+\.[a-f0-9]+)/i;

/**
 * @param {string} raw
 * @returns {string|null}
 */
export function normalizePlateQrPayload(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();

  let candidate = trimmed;
  const fromQuery = trimmed.match(/[?&#]d=([A-Za-z0-9.]+)/);
  if (fromQuery?.[1]) candidate = fromQuery[1];

  const hit = candidate.match(CXR4_RE);
  if (!hit) return null;

  const parts = hit[1].split('.');
  if (parts.length !== 5) return null;

  return `CXR4.${parts[1]}.${parts[2]}.${parts[3]}.${String(parts[4]).toLowerCase()}`;
}

export function looksLikePlateQr(raw) {
  return !!normalizePlateQrPayload(raw);
}
