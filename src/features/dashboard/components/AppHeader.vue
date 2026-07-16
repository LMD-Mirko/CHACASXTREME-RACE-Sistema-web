<template>
  <header class="app-header">
    <!-- Lado izquierdo: Botón menú hamburguesa (móvil) y Título (sección activa) -->
    <div class="header-left">
      <button
        v-if="showHamburger"
        class="btn-hamburger"
        @click="$emit('toggle-sidebar')"
        aria-label="Abrir menú de navegación"
      >
        <span class="material-icons">menu</span>
      </button>
      <div class="header-title">
        <span class="section-label">{{ currentSectionName }}</span>
      </div>
    </div>

    <!-- Lado derecho: Reloj en vivo, Switch de tema y Avatar con dropdown -->
    <div class="header-right">
      <!-- Indicador de WebSocket Sincronizado -->
      <div class="ws-indicator" :class="'ws-indicator--' + wsStatus" :title="'Servidor de Sincronización: ' + wsStatus">
        <span class="ws-indicator-dot"></span>
        <span class="ws-indicator-label">{{ wsStatus === 'connected' ? 'LIVE' : 'SYNC' }}</span>
      </div>

      <HeaderClock />

      <div class="vertical-divider"></div>

      <HeaderThemeToggle />

      <HeaderUserAvatar />
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useMediaQuery } from '@vueuse/core';
import HeaderClock from './header/HeaderClock.vue';
import HeaderThemeToggle from './header/HeaderThemeToggle.vue';
import HeaderUserAvatar from './header/HeaderUserAvatar.vue';
import { useRiders } from '../../competidores/composables/useRiders';
import { wsStatus } from '../../../core/network/wsStatus';

defineProps({
  showHamburger: {
    type: Boolean,
    default: true
  }
});

defineEmits(['toggle-sidebar']);

const route = useRoute();
const isNarrow = useMediaQuery('(max-width: 1023px)');
const { filters, categories } = useRiders();

const SECTION_NAMES = {
  partida: 'Control de Partida',
  checkpoint: 'Checkpoint de Ruta',
  meta: 'Meta y Cronometraje',
  competidores: 'Competidores',
  camarografos: 'Camarógrafos',
  dashboard: 'Dashboard',
  chat: 'Chat',
  posicion: 'Posición',
  configuracion: 'Configuración',
};

const currentSectionName = computed(() => {
  if (route.name === 'competidores') {
    // En móvil el título largo empuja el avatar fuera de pantalla
    if (isNarrow.value) return 'Competidores';
    const selectedCat = categories.value.find(c => String(c.id) === String(filters.category_id));
    const catLabel = selectedCat ? selectedCat.name : 'Todas las categorías';
    return `Competidores: ${catLabel}`;
  }
  return SECTION_NAMES[route.name] ?? 'Dashboard';
});
</script>

<style scoped>
/* === BASE: MÓVIL — Header compacto + safe-area iPhone === */
.app-header {
  /* Extiende el fondo bajo el notch; el contenido queda debajo del status bar */
  min-height: 56px;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: max(10px, env(safe-area-inset-top, 0px)) max(12px, env(safe-area-inset-right, 0px)) 10px max(12px, env(safe-area-inset-left, 0px));
  gap: 8px;
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-surface);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 1px 0 rgba(255, 94, 0, 0.05), 0 4px 20px rgba(0, 0, 0, 0.02);
  transition: background-color 0.3s, border-color 0.3s;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: visible;
}

:global(.dark-theme) .app-header {
  background: var(--color-surface);
  box-shadow: 0 1px 0 rgba(255, 94, 0, 0.1), 0 4px 24px rgba(0, 0, 0, 0.25);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  min-width: 0;
}

.vertical-divider {
  display: none;
  width: 1px;
  height: 24px;
  background: var(--color-border);
}

.btn-hamburger {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  touch-action: manipulation;
  flex-shrink: 0;
}

.btn-hamburger:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(255, 94, 0, 0.05);
}

.header-title {
  display: flex;
  align-items: center;
  font-family: var(--font-family);
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.section-label {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  display: block;
}

@media (min-width: 1024px) {
  .app-header {
    min-height: 64px;
    padding: 0 28px;
  }

  .btn-hamburger {
    display: none;
  }

  .vertical-divider {
    display: block;
  }

  .header-right {
    gap: 16px;
  }

  .section-label {
    font-size: 16px;
  }
}

.ws-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(148, 163, 184, 0.06);
  border: 1px solid var(--color-border);
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.ws-indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94A3B8;
  transition: all 0.3s ease;
}

.ws-indicator--connected {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.2);
  color: #10B981;
}

.ws-indicator--connected .ws-indicator-dot {
  background: #10B981;
  box-shadow: 0 0 8px #10B981;
  animation: pulse-dot 1.5s infinite alternate ease-in-out;
}

.ws-indicator--connecting .ws-indicator-dot,
.ws-indicator--disconnected .ws-indicator-dot {
  background: #EF4444;
  box-shadow: 0 0 8px #EF4444;
  animation: pulse-dot-red 1s infinite alternate ease-in-out;
}

.ws-indicator-label {
  letter-spacing: 0.5px;
}

@keyframes pulse-dot {
  from { transform: scale(0.9); opacity: 0.6; }
  to { transform: scale(1.1); opacity: 1; }
}

@keyframes pulse-dot-red {
  from { transform: scale(0.9); opacity: 0.4; }
  to { transform: scale(1.1); opacity: 1; }
}

/* iPhone 11 / pantas estrechas: solo punto LIVE + tema + avatar */
@media (max-width: 1023px) {
  .ws-indicator-label {
    display: none;
  }
  .ws-indicator {
    padding: 6px;
  }
  .header-right {
    gap: 6px;
  }
}

@media (max-width: 380px) {
  .section-label {
    font-size: 13px;
  }
}
</style>
