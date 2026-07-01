<template>
  <header class="app-header">
    <!-- Lado izquierdo: Botón menú hamburguesa (móvil) y Título (sección activa) -->
    <div class="header-left">
      <button
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
import HeaderClock from './header/HeaderClock.vue';
import HeaderThemeToggle from './header/HeaderThemeToggle.vue';
import HeaderUserAvatar from './header/HeaderUserAvatar.vue';
import { useRiders } from '../../competidores/composables/useRiders';

defineEmits(['toggle-sidebar']);

const route = useRoute();
const { filters, categories } = useRiders();

// Mapeo oficial de nombres para la sección del header
const SECTION_NAMES = {
  partida:      'Control de Partida',
  checkpoint:   'Checkpoint de Ruta',
  meta:         'Meta y Cronometraje',
  competidores: 'Competidores',
  dashboard:    'Dashboard',
};

const currentSectionName = computed(() => {
  if (route.name === 'competidores') {
    const selectedCat = categories.value.find(c => String(c.id) === String(filters.category_id));
    const catLabel = selectedCat ? selectedCat.name : 'Todas las categorías';
    return `Competidores: ${catLabel}`;
  }
  return SECTION_NAMES[route.name] ?? 'Dashboard';
});
</script>

<style scoped>
/* === BASE: MÓVIL — Header compacto con efecto glassmorphism premium === */
.app-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-surface);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 1px 0 rgba(255, 94, 0, 0.05), 0 4px 20px rgba(0, 0, 0, 0.02);
  transition: background-color 0.3s, border-color 0.3s;
}

:global(.dark-theme) .app-header {
  background: var(--color-surface);
  box-shadow: 0 1px 0 rgba(255, 94, 0, 0.1), 0 4px 24px rgba(0, 0, 0, 0.25);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.vertical-divider {
  display: none;
  width: 1px;
  height: 24px;
  background: var(--color-border);
}

/* Botón hamburguesa táctil de 40px con hover (zona clicable expandida a 48px con padding si es necesario) */
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
}

.btn-hamburger:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(255, 94, 0, 0.05);
}

/* Breadcrumb minimalista */
.header-title {
  display: flex;
  align-items: center;
  font-family: var(--font-family);
}

.section-label {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* === DESKTOP (min-width: 1024px) — Espaciado expandido y divisiones === */
@media (min-width: 1024px) {
  .app-header {
    height: 64px;
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
</style>
