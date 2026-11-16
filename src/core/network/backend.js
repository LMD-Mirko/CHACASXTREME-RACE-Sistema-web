/**
 * Backend en el VPS, publicado por el túnel.
 * API y WebSocket comparten el mismo host: /api y /storage van a Laravel,
 * /app y /apps van a Reverb.
 */
export const REVERB_KEY = 'uqehdqpxmzpvlro4kocd';

/** API Laravel HTTPS (sin slash final) */
export const BACKEND_API_BASE_URL = 'https://api-chacas.eilhichasistema.xyz';

/** Reverb / WebSocket wss */
export const REVERB_HOST = 'api-chacas.eilhichasistema.xyz';
export const REVERB_PORT = 443;
export const REVERB_FORCE_TLS = true;
