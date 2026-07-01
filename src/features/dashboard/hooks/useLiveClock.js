import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Composable que provee la hora y fecha actuales en español,
 * actualizándose cada segundo. Limpia el intervalo al desmontar
 * el componente para evitar memory leaks.
 *
 * @returns {{ timeString: Ref<string>, dateString: Ref<string> }}
 */
export function useLiveClock() {
  const timeString = ref('--:--:--');
  const dateString = ref('');
  let intervalId = null;

  // Formateadores localizados en español peruano
  const formatoHora = new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const formatoFecha = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Actualiza los valores reactivos con la hora actual
  const actualizar = () => {
    const ahora = new Date();
    timeString.value = formatoHora.format(ahora);
    dateString.value = formatoFecha.format(ahora);
  };

  onMounted(() => {
    actualizar();
    intervalId = setInterval(actualizar, 1000);
  });

  // Limpieza del intervalo para prevenir memory leaks
  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
  });

  return { timeString, dateString };
}
