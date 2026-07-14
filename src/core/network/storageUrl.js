import { BACKEND_API_BASE_URL } from './backend.js';

/**
 * URL pública de archivos en /storage (API base / Cloudflare tunnel).
 */
export function storageUrl(path) {
  if (!path) return '';
  const s = String(path).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const clean = s.replace(/^\/+/, '').replace(/^storage\//, '');
  const base = String(BACKEND_API_BASE_URL || '').replace(/\/$/, '');
  return base ? `${base}/storage/${clean}` : `/storage/${clean}`;
}
