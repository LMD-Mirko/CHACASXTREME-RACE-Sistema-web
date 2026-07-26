<template>
  <div class="configuracion-view fade-in">
    <header class="config-header">
      <h1>Configuración del Sistema</h1>
      <p class="config-subtitle">Staff, carrera, auspiciadores, galería y descarga de media de la 4ª edición.</p>
    </header>

    <!-- Navegación por pestañas -->
    <div class="tabs-nav">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span class="material-icons">{{ tab.icon }}</span>
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- Contenedor del panel activo -->
    <div class="tab-panel-container">
      <transition name="tab-fade" mode="out-in">
        <keep-alive>
          <component :is="currentTabComponent" />
        </keep-alive>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import UsersConfigTab from '../components/UsersConfigTab.vue';
import CategoriesConfigTab from '../components/CategoriesConfigTab.vue';
import CompetitionConfigTab from '../components/CompetitionConfigTab.vue';
import SponsorsConfigTab from '../components/SponsorsConfigTab.vue';
import GalleryConfigTab from '../components/GalleryConfigTab.vue';
import Edition4MediaTab from '../components/Edition4MediaTab.vue';
import PlateQrConfigTab from '../components/PlateQrConfigTab.vue';
import PlateInventoryConfigTab from '../components/PlateInventoryConfigTab.vue';

const tabs = [
  { id: 'users', label: 'Usuarios Staff', icon: 'manage_accounts', component: UsersConfigTab },
  { id: 'categories', label: 'Categorías', icon: 'category', component: CategoriesConfigTab },
  { id: 'competition', label: 'Control Carrera', icon: 'settings', component: CompetitionConfigTab },
  { id: 'sponsors', label: 'Auspiciadores', icon: 'handshake', component: SponsorsConfigTab },
  { id: 'gallery', label: 'Galería', icon: 'photo_library', component: GalleryConfigTab },
  { id: 'edition4-media', label: 'Media Ed.4', icon: 'folder_zip', component: Edition4MediaTab },
  { id: 'plates', label: 'Inventario placas', icon: 'grid_view', component: PlateInventoryConfigTab },
  { id: 'plate-qr', label: 'Placas QR', icon: 'qr_code_2', component: PlateQrConfigTab },
];

const activeTab = ref('users');

const currentTabComponent = computed(() => {
  return tabs.find(tab => tab.id === activeTab.value)?.component || UsersConfigTab;
});
</script>

<style scoped>
.configuracion-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  height: auto;
  min-height: 100%;
  overflow-x: clip;
  overflow-y: visible;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.config-header {
  flex-shrink: 0;
}

.config-header h1 {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.config-subtitle {
  font-size: 13.5px;
  color: var(--color-text-secondary);
}

/* Diseño de pestañas tipo cápsula (Pills) */
.tabs-nav {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  background: rgba(255, 94, 0, 0.04);
  border: 1px solid var(--color-border);
  padding: 6px;
  border-radius: 16px;
  width: 100%;
  max-width: 100%;
  align-self: stretch;
  flex-shrink: 0;
  min-height: 52px;
  align-items: center;
  box-sizing: border-box;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

:global(.dark-theme) .tabs-nav {
  background: rgba(255, 255, 255, 0.02);
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  min-height: 40px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-family: var(--font-family);
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-btn:hover {
  color: var(--color-primary);
  background: rgba(255, 94, 0, 0.04);
}

.tab-btn--active {
  color: #FFFFFF !important;
  background: var(--color-primary);
  box-shadow: 0 4px 12px rgba(255, 94, 0, 0.2);
}

:global(.dark-theme) .tab-btn--active {
  color: #FFFFFF !important;
  background: var(--color-primary);
  box-shadow: 0 4px 12px rgba(255, 94, 0, 0.4);
}

.tab-btn .material-icons {
  font-size: 18px;
}

.tab-panel-container {
  flex: 1;
  margin-top: 16px;
}

/* Adaptación responsiva */
@media (max-width: 600px) {
  .configuracion-view {
    padding: 12px;
    gap: 16px;
  }
  
  .tabs-nav {
    width: 100%;
    align-self: stretch;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .tab-btn {
    flex: 1;
    justify-content: center;
    padding: 10px 12px;
    font-size: 12.5px;
    min-width: max-content;
  }
}

/* Transiciones de Pestañas (Tab Slide-Fade) */
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
