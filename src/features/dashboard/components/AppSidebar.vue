<template>
  <!-- Overlay oscuro para cerrar el sidebar en dispositivos móviles (SDD-005 R4) -->
  <Transition name="fade">
    <div v-if="isOpen" class="sidebar-overlay" @click="$emit('close')"></div>
  </Transition>

  <!-- Panel lateral principal -->
  <aside class="sidebar" :class="{ 'sidebar--open': isOpen }">
    <!-- Branding del evento -->
    <SidebarBrand />

    <!-- Línea divisoria naranja con gradiente deportivo -->
    <div class="sidebar-divider"></div>

    <!-- Navegación interactiva modular -->
    <SidebarNav @close="$emit('close')" />

    <!-- Tarjeta de usuario final y logout -->
    <SidebarUserCard />
  </aside>
</template>

<script setup>
import SidebarBrand from './sidebar/SidebarBrand.vue';
import SidebarNav from './sidebar/SidebarNav.vue';
import SidebarUserCard from './sidebar/SidebarUserCard.vue';

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

defineEmits(['close']);
</script>

<style scoped>
/* === BASE: MÓVIL — Sidebar móvil como overlay deslizante === */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 199;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 270px;
  z-index: 200;
  transform: translateX(-100%);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar--open {
  transform: translateX(0);
}

.sidebar-divider {
  height: 1px;
  margin: 0 20px 8px;
  background: linear-gradient(90deg, var(--color-primary) 0%, rgba(255, 94, 0, 0.15) 70%, transparent 100%);
}

/* Transición suave para el overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* === DESKTOP (min-width: 1024px) — Fijo y permanente (SDD-005 R4) === */
@media (min-width: 1024px) {
  .sidebar-overlay {
    display: none;
  }
  
  .sidebar {
    position: relative;
    transform: translateX(0);
    width: 250px;
    height: 100vh;
    flex-shrink: 0;
    box-shadow: var(--shadow-premium);
  }
}
</style>
