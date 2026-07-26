import api from '../network/axios';
import { normalizePlateQrPayload } from './plateQrNormalize.js';

/** Cache en memoria: payload → rider (o null inválido). */
const cache = new Map();
const INFLIGHT = new Map();
const TTL_OK_MS = 15 * 60 * 1000;
const TTL_BAD_MS = 45 * 1000;

function now() {
  return Date.now();
}

function getCached(key) {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (hit.expires < now()) {
    cache.delete(key);
    return undefined;
  }
  return hit.rider;
}

function setCached(key, rider, ttl) {
  cache.set(key, { rider, expires: now() + ttl });
}

/**
 * Resuelve un QR de placa con normalización + cache + dedupe de requests.
 * @param {string} raw
 * @returns {Promise<object|null>}
 */
export async function resolvePlateQr(raw) {
  const payload = normalizePlateQrPayload(raw) || String(raw || '').trim();
  if (!payload) return null;

  const cached = getCached(payload);
  if (cached !== undefined) return cached;

  if (INFLIGHT.has(payload)) {
    return INFLIGHT.get(payload);
  }

  const request = (async () => {
    try {
      const { data } = await api.post('/api/plate-qr/resolve', { payload });
      const rider = data?.data?.rider || null;
      setCached(payload, rider, rider ? TTL_OK_MS : TTL_BAD_MS);
      return rider;
    } catch {
      setCached(payload, null, TTL_BAD_MS);
      return null;
    } finally {
      INFLIGHT.delete(payload);
    }
  })();

  INFLIGHT.set(payload, request);
  return request;
}

export function peekResolvedPlate(raw) {
  const payload = normalizePlateQrPayload(raw) || String(raw || '').trim();
  return getCached(payload);
}
