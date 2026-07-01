<template>
  <div class="configuracion-view fade-in">
    <header class="config-header">
      <h1>Configuración del Sistema</h1>
      <p class="config-subtitle">Gestiona el personal, categorías de la carrera y el control de fase activa de competencia.</p>
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

const tabs = [
  { id: 'users', label: 'Usuarios Staff', icon: 'manage_accounts', component: UsersConfigTab },
  { id: 'categories', label: 'Categorías', icon: 'category', component: CategoriesConfigTab },
  { id: 'competition', label: 'Control Carrera', icon: 'settings', component: CompetitionConfigTab }
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
  height: 100%;
  overflow-y: auto;
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
  display: inline-flex;
  gap: 6px;
  background: rgba(255, 94, 0, 0.04);
  border: 1px solid var(--color-border);
  padding: 6px;
  border-radius: 16px;
  width: max-content;
  max-width: 100%;
  overflow-x: auto;
  align-self: flex-start;
}

:global(.dark-theme) .tabs-nav {
  background: rgba(255, 255, 255, 0.02);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-family: var(--font-family);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
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
    padding: 16px;
    gap: 16px;
  }
  
  .tabs-nav {
    width: 100%;
    align-self: stretch;
  }
  
  .tab-btn {
    flex: 1;
    justify-content: center;
    padding: 10px 12px;
    font-size: 12.5px;
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
