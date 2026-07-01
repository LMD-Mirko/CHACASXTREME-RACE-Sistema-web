<template>
  <nav class="sidebar-nav">
    <SidebarNavItem
      v-for="item in filteredNavItems"
      :key="item.name"
      :item="item"
      @click="$emit('close')"
    />
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import SidebarNavItem from './SidebarNavItem.vue';
import { useAuth } from '../../../login/hooks/useAuth';

defineEmits(['close']);

const { currentUser } = useAuth();

const navItems = [
  { name: 'partida',             path: '/dashboard/partida',             icon: 'flag',          label: 'Partida' },
  { name: 'categorias-explorer', path: '/dashboard/categorias-explorer', icon: 'grid_view',     label: 'Categorías' },
  { name: 'checkpoint',          path: '/dashboard/checkpoint',          icon: 'location_on',   label: 'Checkpoint' },
  { name: 'meta',                path: '/dashboard/meta',                icon: 'emoji_events',  label: 'Meta' },
  { name: 'competidores',        path: '/dashboard/competidores',        icon: 'group',         label: 'Competidores' },
  { name: 'configuracion',       path: '/dashboard/configuracion',       icon: 'settings',      label: 'Configuración' },
];

const filteredNavItems = computed(() => {
  return navItems.filter(item => {
    if (item.adminOnly) {
      return currentUser.value?.role?.toUpperCase() === 'ADMIN';
    }
    return true;
  });
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
</style>
