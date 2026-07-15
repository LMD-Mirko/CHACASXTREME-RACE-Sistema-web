/**
 * Backend VPS vía 2 Cloudflare tunnels (HTTPS/WSS).
 * El frontend desplegado NO puede hablar a http://IP — el navegador lo bloquea.
 *
 * 1) API   → chacas-api-tunnel  (:8888)
 * 2) Socket→ chacas-ws-tunnel   (:8080)
 *
 * Si reinicias los servicios en el VPS, las URLs trycloudflare.com CAMBIAN:
 *   ssh root@24.199.82.193 "grep -oE 'https://[a-z0-9-]+\\.trycloudflare\\.com' /var/log/chacas-api-tunnel.log | tail -1"
 *   ssh root@24.199.82.193 "grep -oE 'https://[a-z0-9-]+\\.trycloudflare\\.com' /var/log/chacas-ws-tunnel.log | tail -1"
 *
 * Directo VPS (solo local HTTP): http://24.199.82.193:8888 · ws://24.199.82.193:8080
 */
export const REVERB_KEY = 'uqehdqpxmzpvlro4kocd';

/** Tunnel 1 — API Laravel HTTPS (sin slash final) */
export const BACKEND_API_BASE_URL =
  'https://shuttle-out-distributor-decision.trycloudflare.com';

/** Tunnel 2 — Reverb / WebSocket wss */
export const REVERB_HOST = 'grounds-trained-robin-essentially.trycloudflare.com';
export const REVERB_PORT = 443;
export const REVERB_FORCE_TLS = true;
