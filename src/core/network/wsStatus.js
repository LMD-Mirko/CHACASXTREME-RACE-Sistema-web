import { ref } from 'vue';
import { ensureRaceChannels, recoverSocketAfterForeground, softReconnectSocket } from './raceRealtime';

export const wsStatus = ref('connecting');

function bindPusherWatchdog() {
  if (!window.Echo?.connector?.pusher) {
    // Echo aún no listo: reintentar
    setTimeout(bindPusherWatchdog, 300);
    return;
  }

  const pusher = window.Echo.connector.pusher;
  wsStatus.value = pusher.connection.state;

  pusher.connection.bind('state_change', (states) => {
    wsStatus.value = states.current;
    console.log('[WebSocket Status] State changed to:', states.current);

    if (states.current === 'connected') {
      ensureRaceChannels();
      window.dispatchEvent(new CustomEvent('ws-connected'));
    }

    if (
      states.current === 'unavailable' ||
      states.current === 'failed' ||
      states.current === 'disconnected'
    ) {
      console.warn('[WebSocket Status] Caído. Reintento suave...');
      softReconnectSocket();
    }
  });

  // Vigilancia cada 8s (menos agresivo en móvil)
  setInterval(() => {
    const currentState = pusher.connection.state;
    if (currentState !== 'connected' && currentState !== 'connecting') {
      console.warn(`[WebSocket Status] Vigilancia: '${currentState}'. Reconectando...`);
      softReconnectSocket();
    }
  }, 8000);

  // Al volver a la app: NO hacer disconnect()+connect() si ya está connected
  // (eso mataba suscripciones en iOS/Android)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('[WebSocket Status] App visible → recover');
      recoverSocketAfterForeground();
    }
  });

  window.addEventListener('online', () => {
    console.log('[WebSocket Status] Red online → recover');
    recoverSocketAfterForeground();
  });

  window.addEventListener('focus', () => {
    softReconnectSocket();
  });

  // Primer ensure
  if (pusher.connection.state === 'connected') {
    ensureRaceChannels();
  } else {
    softReconnectSocket();
  }
}

bindPusherWatchdog();
