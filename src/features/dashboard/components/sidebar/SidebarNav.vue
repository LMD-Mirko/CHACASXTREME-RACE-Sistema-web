<template>
  <nav class="sidebar-nav">
    <template v-for="item in filteredNavItems" :key="item.name">
      <SidebarNavItem
        v-if="!item.disabled"
        :item="item"
        @click="$emit('close')"
      />
      <div v-else class="nav-item-disabled">
        <div class="icon-container">
          <span class="material-icons nav-icon">{{ item.icon }}</span>
        </div>
        <span class="nav-label">{{ item.label }}</span>
        <span class="soon-badge">Soon</span>
      </div>
    </template>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import SidebarNavItem from './SidebarNavItem.vue';
import { useAuth } from '../../../login/hooks/useAuth';

defineEmits(['close']);

const { currentUser } = useAuth();

const role = computed(() => currentUser.value?.role?.toUpperCase() || '');

const allItems = {
  partida:      { name: 'partida',             path: '/dashboard/partida',             icon: 'flag',          label: 'Partida' },
  categorias:   { name: 'categorias-explorer', path: '/dashboard/categorias-explorer', icon: 'grid_view',     label: 'Categorías' },
  checkpoint:   { name: 'checkpoint',          path: '/dashboard/checkpoint',          icon: 'location_on',   label: 'Checkpoint' },
  meta:         { name: 'meta',                path: '/dashboard/meta',                icon: 'emoji_events',  label: 'Meta' },
  confirmacion: { name: 'confirmacion',        path: '/dashboard/confirmacion',        icon: 'assignment_turned_in', label: 'Confirmación' },
  competidores: { name: 'competidores',        path: '/dashboard/competidores',        icon: 'group',         label: 'Competidores' },
  configuracion: { name: 'configuracion',       path: '/dashboard/configuracion',       icon: 'settings',      label: 'Configuración' },
  posicion:     { name: 'posicion',            path: '#',                              icon: 'sports_score',  label: 'Posición', disabled: true },
};

const filteredNavItems = computed(() => {
  if (role.value === 'PARTIDA') {
    return [allItems.partida, allItems.categorias, allItems.competidores, allItems.posicion];
  } else if (role.value === 'INTERMEDIO') {
    return [allItems.checkpoint, allItems.categorias, allItems.competidores, allItems.posicion];
  } else if (role.value === 'META') {
    return [allItems.meta, allItems.confirmacion, allItems.categorias, allItems.posicion];
  }
  
  // ADMIN u otros roles ven todo
  return [
    allItems.partida,
    allItems.checkpoint,
    allItems.meta,
    allItems.confirmacion,
    allItems.categorias,
    allItems.competidores,
    allItems.configuracion
  ];
});
</script>

<style scoped>
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  overflow-y: auto;
}

/* Item deshabilitado premium en Sidebar */
.nav-item-disabled {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 0 16px;
  margin: 2px 0;
  border-radius: 12px;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  opacity: 0.45;
  cursor: not-allowed;
  user-select: none;
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
}

.nav-icon {
  font-size: 20px;
}

.nav-label {
  letter-spacing: 0.3px;
}

.soon-badge {
  margin-left: auto;
  background: var(--color-primary);
  color: #FFFFFF;
  font-size: 8px;
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
</style>
