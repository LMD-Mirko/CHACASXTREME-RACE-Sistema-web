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

function authHeaders() {
  const token = localStorage.getItem('auth_token') || '';
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * Reverb / Echo → Cloudflare Tunnel (wss) delante del Reverb del VPS.
 * Bearer Sanctum habilita canales privados (staff chat).
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
  auth: { headers: authHeaders() },
  authorizer: (channel) => ({
    authorize: (socketId, callback) => {
      fetch(`${BACKEND_API_BASE_URL}/broadcasting/auth`, {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          socket_id: socketId,
          channel_name: channel.name,
        }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            callback(true, data);
            return;
          }
          callback(false, data);
        })
        .catch((err) => callback(true, err));
    },
  }),
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
