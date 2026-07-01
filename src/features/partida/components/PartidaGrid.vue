<template>
  <div class="partida-grid-container">
    <!-- Buscador Rápido por Placa o Nombre con Selector de Teclado -->
    <div class="search-box-wrapper">
      <div class="search-input-container">
        <!-- Icono de Modo -->
        <span class="material-icons search-input-icon">
          {{ searchMode === 'plate' ? 'tag' : 'badge' }}
        </span>
        
        <input
          ref="searchInputRef"
          type="text"
          :inputmode="searchMode === 'plate' ? 'numeric' : 'text'"
          :placeholder="searchMode === 'plate' ? 'Digitar número de placa...' : 'Buscar competidor por nombre...'"
          class="giant-search-input"
          :value="searchQuery"
          @input="$emit('update:searchQuery', $event.target.value)"
          aria-label="Buscar competidor"
        />

        <!-- Botón para alternar teclado (Placa vs Nombre) -->
        <button
          class="keyboard-toggle-btn"
          :class="{ 'keyboard-toggle-btn--active': searchMode === 'name' }"
          @click="toggleSearchMode"
          type="button"
          :title="searchMode === 'plate' ? 'Cambiar a teclado de texto' : 'Cambiar a teclado numérico'"
        >
          <span class="material-icons btn-icon-small">keyboard</span>
          <span class="keyboard-mode-label">{{ searchMode === 'plate' ? '123' : 'ABC' }}</span>
        </button>

        <button
          v-if="searchQuery"
          class="clear-search-btn"
          @click="$emit('update:searchQuery', '')"
        >
          <span class="material-icons">cancel</span>
        </button>
      </div>
    </div>
 
     <!-- Título de Sección de Activos -->
     <div class="section-title-container">
       <h2>Padrón de Asistencia</h2>
       <span class="badge-count">{{ presentCount }} / {{ activeRiders.length }} presentados</span>
     </div>
 
     <!-- Listado Premium de Corredores (Diseño Estilo Lista de Alta Velocidad) -->
     <div v-if="activeRiders.length > 0">
       <div v-if="isMega" class="grouped-riders-container">
         <div v-for="(ridersInGroup, categoryName) in groupedActiveRiders" :key="categoryName" class="category-group-block">
           <div class="category-group-header">
             <span class="material-icons group-header-icon">flag</span>
             <h3 class="group-category-title">{{ categoryName }}</h3>
             <span class="group-count-badge">{{ countPresentInGroup(ridersInGroup) }} / {{ ridersInGroup.length }}</span>
           </div>
           <div class="riders-list-wrapper">
             <PartidaRiderRow
               v-for="rider in ridersInGroup"
               :key="rider.id"
               :rider="rider"
               :is-present="presentRiderIds.has(rider.id)"
               @toggle-presence="$emit('togglePresence', $event)"
               @mark-dns="$emit('markDns', $event)"
             />
           </div>
         </div>
       </div>
       <div v-else class="riders-list-wrapper">
         <PartidaRiderRow
           v-for="rider in activeRiders"
           :key="rider.id"
           :rider="rider"
           :is-present="presentRiderIds.has(rider.id)"
           @toggle-presence="$emit('togglePresence', $event)"
           @mark-dns="$emit('markDns', $event)"
         />
       </div>
     </div>
 
     <!-- Estado vacío -->
     <div v-else class="empty-state">
       <span class="material-icons empty-icon">sports_motorsports</span>
       <p v-if="searchQuery">No hay pilotos activos con la placa "{{ searchQuery }}".</p>
       <p v-else>Cargando padrón de corredores o lista vacía.</p>
     </div>
 
     <PartidaDnsList
       :dns-riders="dnsRiders"
       @revert-dns="$emit('revertDns', $event)"
     />
   </div>
 </template>
 
 <script setup>
 import { computed } from 'vue';
 import PartidaRiderRow from './PartidaRiderRow.vue';
 import PartidaDnsList from './PartidaDnsList.vue';
 
 const props = defineProps({
   searchQuery: { type: String, required: true },
   activeRiders: { type: Array, required: true },
   dnsRiders: { type: Array, required: true },
   presentRiderIds: { type: Object, required: true },
   isMega: { type: Boolean, default: false }
 });
 
 import { ref } from 'vue';

const emit = defineEmits(['update:searchQuery', 'markDns', 'revertDns', 'togglePresence']);

const searchMode = ref('plate'); // 'plate' or 'name'
const searchInputRef = ref(null);

function toggleSearchMode() {
  searchMode.value = searchMode.value === 'plate' ? 'name' : 'plate';
  emit('update:searchQuery', '');
  setTimeout(() => {
    if (searchInputRef.value) {
      searchInputRef.value.focus();
    }
  }, 50);
}
 
 const presentCount = computed(() => {
   return props.activeRiders.filter(r => props.presentRiderIds.has(r.id)).length;
 });
 
 const groupedActiveRiders = computed(() => {
   const groups = {};
   props.activeRiders.forEach(rider => {
     const catName = rider.category?.name || 'Sin Categoría';
     if (!groups[catName]) {
       groups[catName] = [];
     }
     groups[catName].push(rider);
   });
   return groups;
 });
 
 function countPresentInGroup(ridersList) {
   return ridersList.filter(r => props.presentRiderIds.has(r.id)).length;
 }
 </script>

<style scoped>
.partida-grid-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-box-wrapper {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-background);
  padding: 2px 0;
}

.search-input-container {
  display: flex;
  align-items: center;
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  height: 48px;
  padding: 0 14px;
  transition: border-color 0.25s, box-shadow 0.25s;
}

.search-input-container:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 94, 0, 0.1);
}

.search-input-icon {
  font-size: 20px;
  color: var(--color-text-secondary);
  margin-right: 10px;
}

.giant-search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 15px;
  font-weight: 600;
  outline: none;
  width: 100%;
}

.clear-search-btn {
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
}

.section-title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.section-title-container h2 {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-count {
  background: rgba(255, 94, 0, 0.08);
  color: var(--color-primary);
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
}

.riders-list-wrapper {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-premium);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 16px;
  text-align: center;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: 16px;
}

.empty-icon {
  font-size: 32px;
  color: var(--color-border);
}

.grouped-riders-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.category-group-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 2px solid var(--color-primary);
  width: 100%;
  margin-bottom: 4px;
}

.group-header-icon {
  font-size: 18px;
  color: var(--color-primary);
}

.group-category-title {
  font-family: var(--font-family);
  font-size: 13.5px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color-text-primary);
  letter-spacing: 0.8px;
  flex: 1;
}

.group-count-badge {
  background: rgba(255, 94, 0, 0.08);
  color: var(--color-primary);
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
}

/* Selector de Teclado */
.keyboard-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 4px 8px;
  color: var(--color-text-secondary);
  font-family: var(--font-headings);
  font-weight: 700;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  margin-right: 6px;
  height: 28px;
  touch-action: manipulation;
}

.keyboard-toggle-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(255, 94, 0, 0.05);
}

.keyboard-toggle-btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #FFFFFF !important;
  box-shadow: 0 2px 8px rgba(255, 94, 0, 0.2);
}

.btn-icon-small {
  font-size: 14px;
}

.keyboard-mode-label {
  letter-spacing: 0.5px;
}
</style>
