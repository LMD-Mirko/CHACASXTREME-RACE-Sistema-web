import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

// Inicialización global de Laravel Echo para comunicación en tiempo real
// --- MODO LOCAL ---
window.Echo = new Echo({
  broadcaster: 'reverb',
  key: 'uqehdqpxmzpvlro4kocd',
  wsHost: 'athens-mats-announced-precise.trycloudflare.com',
  wsPort: 443,
  wssPort: 443,
  forceTLS: true,
  enabledTransports: ['ws', 'wss'],
  activityTimeout: 10000, // Detectar conexiones caídas rápidamente (10 segundos)
  pongTimeout: 5000,      // Espera de respuesta ping del servidor
});

// --- MODO TÚNEL CLOUDFLARE (Activar cuando uses un túnel para el WebSocket) ---
/*
window.Echo = new Echo({
  broadcaster: 'reverb',
  key: 'uqehdqpxmzpvlro4kocd',
  wsHost: 'tu-tunel-websocket.trycloudflare.com', // Reemplazar por la URL del túnel del WebSocket (sin https://)
  wsPort: 443,
  wssPort: 443,
  forceTLS: true,
  enabledTransports: ['ws', 'wss'],
});
*/

