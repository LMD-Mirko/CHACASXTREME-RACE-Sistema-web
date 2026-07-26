import api from '../network/axios';
import { normalizePlateQrPayload } from './plateQrNormalize.js';

/** Cache en memoria: payload → resultado de resolve. */
const cache = new Map();
const INFLIGHT = new Map();
const TTL_OK_MS = 15 * 60 * 1000;
const TTL_UNASSIGNED_MS = 8 * 1000; // corto: al asignar placa, re-scan debe encontrar rider
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
  return hit.value;
}

function setCached(key, value, ttl) {
  cache.set(key, { value, expires: now() + ttl });
}

/**
 * Resuelve un QR de placa con normalización + cache + dedupe.
 * @param {string} raw
 * @returns {Promise<{
 *   ok: boolean,
 *   assigned: boolean,
 *   plate_number: number|null,
 *   rider: object|null,
 *   message?: string|null,
 * }>}
 */
export async function resolvePlateQr(raw) {
  const payload = normalizePlateQrPayload(raw) || String(raw || '').trim();
  if (!payload) {
    return { ok: false, assigned: false, plate_number: null, rider: null, message: 'QR vacío' };
  }

  const cached = getCached(payload);
  if (cached !== undefined) return cached;

  if (INFLIGHT.has(payload)) {
    return INFLIGHT.get(payload);
  }

  const request = (async () => {
    try {
      const { data } = await api.post('/api/plate-qr/resolve', { payload });
      const body = data?.data;
      const assigned = !!body?.assigned && !!body?.rider;
      const result = {
        ok: true,
        assigned,
        plate_number: body?.plate_number ?? body?.rider?.plate_number ?? null,
        rider: body?.rider || null,
        message: body?.message || null,
      };
      setCached(
        payload,
        result,
        assigned ? TTL_OK_MS : TTL_UNASSIGNED_MS,
      );
      return result;
    } catch (e) {
      const result = {
        ok: false,
        assigned: false,
        plate_number: null,
        rider: null,
        message: e.friendlyMessage || e.message || 'QR inválido o de otra edición',
      };
      setCached(payload, result, TTL_BAD_MS);
      return result;
    } finally {
      INFLIGHT.delete(payload);
    }
  })();

  INFLIGHT.set(payload, request);
  return request;
}

export function peekResolvedPlate(raw) {
  const payload = normalizePlateQrPayload(raw) || String(raw || '').trim();
  const hit = getCached(payload);
  return hit?.rider ?? null;
}
