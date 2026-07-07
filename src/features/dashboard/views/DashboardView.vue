<template>
  <!-- Contenedor raíz del dashboard -->
  <div class="dashboard-root">
    
    <!-- BLOQUEADOR PARA ADMIN EN DISPOSITIVOS MÓVILES -->
    <div v-if="isAdmin && isMobile" class="admin-mobile-blocker fade-in">
      <div class="blocker-card">
        <div class="blocker-icon-container">
          <span class="material-icons blocker-icon">desktop_access_disabled</span>
        </div>
        <h1>Acceso Restringido</h1>
        <p class="blocker-desc">
          El panel de Administración de <strong>Chacas Xtreme Race</strong> solo está disponible en pantallas de escritorio (Laptops o PCs). Por favor, ingresa desde una computadora para gestionar la carrera de manera segura y cómoda.
        </p>
        
        <div class="blocker-user-info">
          <span class="material-icons user-icon">account_circle</span>
          <span class="user-name">{{ currentUser?.name || 'Administrador' }}</span>
        </div>

        <button class="btn-logout-blocker" @click="handleLogout">
          <span class="material-icons">logout</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>

    <template v-else>
      <!-- Sidebar lateral (se muestra solo en desktop si es staff, u ocultable en móvil si no estamos usando el menú flotante, pero ahora el staff usa el menú flotante) -->
      <AppSidebar
        v-if="!isMobile"
        :is-open="isSidebarOpen"
        @close="isSidebarOpen = false"
      />

      <!-- Columna principal: header pegado al tope + área de contenido -->
      <div class="dashboard-main" :class="{ 'dashboard-main--mobile': isMobile }">
        <AppHeader 
          :show-hamburger="!isMobile" 
          @toggle-sidebar="isSidebarOpen = !isSidebarOpen" 
        />

        <!-- Área de contenido — aquí se renderizan las vistas hijas -->
        <main class="dashboard-content" :class="{ 'dashboard-content--mobile': isMobile }">
          <router-view />
        </main>

        <!-- Menú flotante móvil para staff -->
        <FloatingMobileMenu v-if="isMobile" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { useAuth } from '../../login/hooks/useAuth';
import AppSidebar from '../components/AppSidebar.vue';
import AppHeader from '../components/AppHeader.vue';
import FloatingMobileMenu from '../components/FloatingMobileMenu.vue';

const isSidebarOpen = ref(false);
const isMobile = useMediaQuery('(max-width: 1023px)');
const { currentUser, logout } = useAuth();

const isAdmin = computed(() => {
  return currentUser.value?.role?.toUpperCase() === 'ADMIN';
});

async function handleLogout() {
  await logout();
  window.location.reload();
}
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

/* Margen adicional en móvil para evitar tapado por la barra flotante */
.dashboard-main--mobile {
  position: relative;
}

/* Área de contenido con scroll propio */
.dashboard-content {
  flex: 1;
  padding: 20px 16px;
  overflow-y: auto;
}

.dashboard-content--mobile {
  padding-bottom: 96px; /* Espacio extra para el menú flotante bottom */
}

/* === PANTALLA BLOQUEADORA ADMIN MÓVIL === */
.admin-mobile-blocker {
  position: fixed;
  inset: 0;
  background: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 9999;
}

.blocker-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 28px;
  padding: 36px 28px;
  width: 100%;
  max-width: 380px;
  text-align: center;
  box-shadow: var(--shadow-premium);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.blocker-icon-container {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: rgba(255, 94, 0, 0.08);
  border: 1.5px solid var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.blocker-icon {
  font-size: 36px;
  color: var(--color-primary);
}

.blocker-card h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 22px;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--color-text-primary);
  letter-spacing: 0.5px;
}

.blocker-desc {
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.blocker-user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--color-border);
  padding: 6px 14px;
  border-radius: 12px;
}

.user-icon {
  font-size: 18px;
  color: var(--color-text-secondary);
}

.user-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.btn-logout-blocker {
  height: 48px;
  width: 100%;
  border-radius: 14px;
  border: 1px solid var(--color-border);
  background: var(--color-input-bg);
  color: var(--color-text-primary);
  font-size: 13.5px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-logout-blocker:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
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


