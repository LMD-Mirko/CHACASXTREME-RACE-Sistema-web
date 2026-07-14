/**
 * Backend VPS.
 *
 * API (HTTP):  http://24.199.82.193:8888
 * Reverb (WS): Cloudflare tunnel → wss (necesario desde páginas HTTPS / Vercel).
 *
 * Si reinicias chacas-ws-tunnel en el VPS, el host trycloudflare.com cambia:
 *   ssh root@24.199.82.193 "grep -oE 'https://[a-z0-9-]+\\.trycloudflare\\.com' /var/log/chacas-ws-tunnel.log | tail -1"
 */
export const REVERB_KEY = 'uqehdqpxmzpvlro4kocd';

/** Base URL del API Laravel (sin slash final) */
export const BACKEND_API_BASE_URL = 'http://24.199.82.193:8888';

/** Host Cloudflare delante de Reverb (:8080) → wss */
export const REVERB_HOST = 'grounds-trained-robin-essentially.trycloudflare.com';
export const REVERB_PORT = 443;
export const REVERB_FORCE_TLS = true;
