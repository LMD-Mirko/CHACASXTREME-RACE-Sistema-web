<template>
  <!-- Contenedor raíz del dashboard -->
  <div class="dashboard-root">

    <!-- Sidebar lateral (overlay en móvil, fijo en desktop) -->
    <AppSidebar
      :is-open="isSidebarOpen"
      @close="isSidebarOpen = false"
    />

    <!-- Columna principal: header pegado al tope + área de contenido -->
    <div class="dashboard-main">
      <AppHeader @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />

      <!-- Área de contenido — aquí se renderizan las vistas hijas -->
      <main class="dashboard-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AppSidebar from '../components/AppSidebar.vue';
import AppHeader from '../components/AppHeader.vue';

// Estado de visibilidad del sidebar (activo en modo overlay/móvil)
const isSidebarOpen = ref(false);
</script>

<style scoped>
/* === BASE: MÓVIL — layout de columna única === */
.dashboard-root {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-background);
}

.dashboard-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* Previene desbordamiento en contenedores flex */
  overflow: hidden;
}

/* Área de contenido con scroll propio */
.dashboard-content {
  flex: 1;
  padding: 20px 16px;
  overflow-y: auto;
}

/* === DESKTOP (min-width: 1024px): layout de dos columnas === */
@media (min-width: 1024px) {
  .dashboard-root {
    height: 100vh;
    overflow: hidden;
  }
  .dashboard-content {
    padding: 28px 32px;
  }
}
</style>

