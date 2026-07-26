/** Extrae payload firmado CXR4 desde texto crudo o URL.
 * Nuevo: CXR4.{comp}.{plate}.{sig}
 * Legacy: CXR4.{comp}.{rider}.{plate}.{sig}
 */
const CXR4_LEGACY_RE = /(CXR4\.[0-9]+\.[0-9]+\.[0-9]+\.[a-f0-9]+)/i;
const CXR4_PLATE_RE = /(CXR4\.[0-9]+\.[0-9]+\.[a-f0-9]+)/i;

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

  // Preferir legacy (5 segmentos) si coincide; si no, formato placa (4).
  const legacy = candidate.match(CXR4_LEGACY_RE);
  if (legacy) {
    const parts = legacy[1].split('.');
    if (parts.length === 5) {
      return `CXR4.${parts[1]}.${parts[2]}.${parts[3]}.${String(parts[4]).toLowerCase()}`;
    }
  }

  const plate = candidate.match(CXR4_PLATE_RE);
  if (!plate) return null;

  const parts = plate[1].split('.');
  if (parts.length !== 4) return null;

  return `CXR4.${parts[1]}.${parts[2]}.${String(parts[3]).toLowerCase()}`;
}

export function looksLikePlateQr(raw) {
  return !!normalizePlateQrPayload(raw);
}
