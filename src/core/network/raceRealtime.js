/**
 * Bus de tiempo real de carrera.
 * Una sola suscripción Echo a los canales compartidos — NUNCA leaveChannel
 * desde vistas hijas (eso apagaba las notificaciones hasta refrescar).
 */

let subscribed = false;
const handlerRegistry = {
  mountain: [],
  timing: [],
  infrastructure: [],
};

function getPusher() {
  return window.Echo?.connector?.pusher || null;
}

function bindChannel(name, listKey) {
  if (!window.Echo) return null;
  const channel = window.Echo.channel(name);
  for (const { event, handler } of handlerRegistry[listKey]) {
    channel.stopListening(event, handler);
    channel.listen(event, handler);
  }
  return channel;
}

/**
 * Registra un listener en un canal compartido.
 * @param {'mountain'|'timing'|'infrastructure'} bus
 * @param {string} event  ej. '.RiderFinished'
 * @param {Function} handler
 */
export function onRaceEvent(bus, event, handler) {
  const key =
    bus === 'timing' ? 'timing' :
    bus === 'infrastructure' ? 'infrastructure' :
    'mountain';

  handlerRegistry[key].push({ event, handler });

  if (!window.Echo) {
    return () => {
      handlerRegistry[key] = handlerRegistry[key].filter(
        (h) => !(h.event === event && h.handler === handler)
      );
    };
  }

  const channelName =
    key === 'timing' ? 'race-timing' :
    key === 'infrastructure' ? 'race-infrastructure' :
    'race-mountain';

  const channel = window.Echo.channel(channelName);
  channel.listen(event, handler);

  return () => {
    handlerRegistry[key] = handlerRegistry[key].filter(
      (h) => !(h.event === event && h.handler === handler)
    );
    try {
      channel.stopListening(event, handler);
    } catch (_) { /* ignore */ }
  };
}

/** Asegura canales vivos (llamar al montar el dashboard / al reconectar). */
export function ensureRaceChannels() {
  if (!window.Echo) return false;
  bindChannel('race-mountain', 'mountain');
  bindChannel('race-timing', 'timing');
  bindChannel('race-infrastructure', 'infrastructure');
  subscribed = true;
  return true;
}

export function isRaceRealtimeSubscribed() {
  return subscribed;
}

/** Reconectar suave: solo si no está connected/connecting. */
export function softReconnectSocket() {
  const pusher = getPusher();
  if (!pusher) return;
  const state = pusher.connection.state;
  if (state === 'connected' || state === 'connecting') return;
  try {
    pusher.connect();
  } catch (err) {
    console.warn('[raceRealtime] softReconnect falló:', err);
  }
}

/** Tras volver de background: reconectar solo si hace falta, luego re-bind. */
export function recoverSocketAfterForeground() {
  const pusher = getPusher();
  if (!pusher) return;

  const state = pusher.connection.state;
  if (state === 'connected') {
    ensureRaceChannels();
    return;
  }

  try {
    if (state !== 'connecting') {
      pusher.connect();
    }
  } catch (err) {
    console.warn('[raceRealtime] recover connect falló:', err);
  }
}
