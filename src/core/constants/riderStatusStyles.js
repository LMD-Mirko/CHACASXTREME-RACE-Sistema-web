/**
 * Catálogo centralizado de estilos visuales por estado del competidor (SDD-005 Regla 5).
 * Todos los módulos del sistema (partida, checkpoint, meta, competidores) deben
 * importar exclusivamente de aquí para garantizar consistencia visual total.
 * Un cambio aquí impacta automáticamente toda la interfaz.
 */
export const RIDER_STATUS_STYLES = {
  pre_inscrito: {
    label: 'Pre-Inscrito',
    icon: 'assignment',
    colorClass: 'status--pre-registered',
    color: 'var(--status-pre-registered-color)',
    bgColor: 'var(--status-pre-registered-bg)',
  },
  en_carrera: {
    label: 'En Carrera',
    icon: 'directions_run',
    colorClass: 'status--racing',
    color: 'var(--status-racing-color)',
    bgColor: 'var(--status-racing-bg)',
  },
  llego: {
    label: 'Llegó',
    icon: 'check_circle',
    colorClass: 'status--finished',
    color: 'var(--status-finished-color)',
    bgColor: 'var(--status-finished-bg)',
  },
  DNF: {
    label: 'DNF',
    icon: 'cancel',
    colorClass: 'status--dnf',
    color: 'var(--status-dnf-color)',
    bgColor: 'var(--status-dnf-bg)',
  },
  DNS: {
    label: 'DNS',
    icon: 'remove_circle',
    colorClass: 'status--dns',
    color: 'var(--status-dns-color)',
    bgColor: 'var(--status-dns-bg)',
  },
};

/**
 * Retorna el estilo correspondiente al estado recibido.
 * Si el estado no existe en el catálogo, retorna DNS como fallback seguro.
 */
export function getStatusStyle(status) {
  return RIDER_STATUS_STYLES[status] ?? RIDER_STATUS_STYLES['DNS'];
}
