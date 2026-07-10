import { ref } from 'vue';

export const wsStatus = ref('connecting');

if (window.Echo && window.Echo.connector && window.Echo.connector.pusher) {
  const pusher = window.Echo.connector.pusher;
  wsStatus.value = pusher.connection.state;

  pusher.connection.bind('state_change', (states) => {
    wsStatus.value = states.current;
    console.log('[WebSocket Status] State changed to:', states.current);
    
    // Si la conexión entra en fallo o se desconecta, forzar reconexión inmediata
    if (states.current === 'unavailable' || states.current === 'failed' || states.current === 'disconnected') {
      console.warn('[WebSocket Status] Conexión inactiva o caída. Intentando reconectar...');
      try {
        pusher.connect();
      } catch (err) {
        console.error('[WebSocket Status] Error al forzar reconexión:', err);
      }
    }
  });

  // BUCLE DE SEGURIDAD: Cada 5 segundos verifica que no nos hayamos quedado desconectados en segundo plano
  setInterval(() => {
    const currentState = pusher.connection.state;
    if (currentState !== 'connected' && currentState !== 'connecting') {
      console.warn(`[WebSocket Status] Vigilancia detectó estado '${currentState}'. Forzando reconexión...`);
      try {
        pusher.connect();
      } catch (err) {
        console.error('[WebSocket Status] Error en bucle de reconexión:', err);
      }
    }
  }, 5000);

  // Escuchar cuando el celular se despierta, la pestaña vuelve a ser visible o se cambia de app
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('[WebSocket Status] Aplicación visible. Reiniciando conexión WebSocket para evitar sockets zombis...');
      try {
        pusher.disconnect();
        pusher.connect();
      } catch (err) {
        console.error('[WebSocket Status] Error al reiniciar socket por visibilidad:', err);
      }
    }
  });

  // Escuchar enfoque de ventana/pestaña
  window.addEventListener('focus', () => {
    if (pusher.connection.state !== 'connected' && pusher.connection.state !== 'connecting') {
      console.log('[WebSocket Status] Pestaña enfocada. Forzando reconexión...');
      try {
        pusher.connect();
      } catch (err) {
        console.error('[WebSocket Status] Error al reconectar en focus:', err);
      }
    }
  });
}
