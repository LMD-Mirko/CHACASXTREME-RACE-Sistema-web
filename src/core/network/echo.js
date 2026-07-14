import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import {
  BACKEND_API_BASE_URL,
  REVERB_KEY,
  REVERB_HOST,
  REVERB_PORT,
  REVERB_FORCE_TLS,
} from './backend.js';

window.Pusher = Pusher;

/**
 * Reverb / Echo → Cloudflare Tunnel (wss) delante del Reverb del VPS.
 * No usa proxy Vite ni SSH local: el tunnel corre en el VPS.
 */
window.Echo = new Echo({
  broadcaster: 'reverb',
  key: REVERB_KEY,
  wsHost: REVERB_HOST,
  wsPort: REVERB_PORT,
  wssPort: REVERB_PORT,
  forceTLS: REVERB_FORCE_TLS,
  enabledTransports: REVERB_FORCE_TLS ? ['ws', 'wss'] : ['ws'],
  authEndpoint: `${BACKEND_API_BASE_URL}/broadcasting/auth`,
  activityTimeout: 15000,
  pongTimeout: 8000,
});

if (import.meta.env.DEV) {
  console.info('[Echo]', {
    host: REVERB_HOST,
    port: REVERB_PORT,
    forceTLS: REVERB_FORCE_TLS,
    key: `${REVERB_KEY.slice(0, 4)}…`,
    api: BACKEND_API_BASE_URL,
    via: 'cloudflare-tunnel',
  });
}
