import { BACKEND_API_BASE_URL } from './backend.js';

/**
 * URL pública de archivos en /storage.
 * Reescribe hosts viejos (trycloudflare / IP) al API fijo actual.
 */
export function storageUrl(path) {
  if (!path) return '';
  const s = String(path).trim();
  if (!s) return '';

  const base = String(BACKEND_API_BASE_URL || '').replace(/\/$/, '');

  // Absolute URL → keep path, swap host if stale
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      const host = u.hostname.toLowerCase();
      const isStale =
        host.includes('trycloudflare.com') ||
        host === '24.199.82.193' ||
        host === '127.0.0.1' ||
        host === 'localhost';

      if (isStale && base) {
        let pathname = u.pathname || '';
        if (!pathname.startsWith('/storage/') && !pathname.startsWith('/api/')) {
          pathname = `/storage/${pathname.replace(/^\/+/, '')}`;
        }
        return `${base}${pathname}${u.search || ''}`;
      }
      return s;
    } catch {
      return s;
    }
  }

  const clean = s.replace(/^\/+/, '').replace(/^storage\//, '');
  return base ? `${base}/storage/${clean}` : `/storage/${clean}`;
}
