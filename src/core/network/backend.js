/**
 * Backend VPS vía subdominios fijos + Nginx/Certbot (HTTPS/WSS).
 * 1) API   → https://api.mankariders.xyz  (proxy → :8888)
 * 2) Socket→ wss://ws.mankariders.xyz     (proxy → :8080)
 *
 * Directo VPS (solo local HTTP): http://24.199.82.193:8888 · ws://24.199.82.193:8080
 */
export const REVERB_KEY = 'uqehdqpxmzpvlro4kocd';

/** API Laravel HTTPS (sin slash final) */
export const BACKEND_API_BASE_URL = 'https://api.mankariders.xyz';

/** Reverb / WebSocket wss */
export const REVERB_HOST = 'ws.mankariders.xyz';
export const REVERB_PORT = 443;
export const REVERB_FORCE_TLS = true;
