<template>
  <div class="view-container">
    <div class="explorer-view-layout">
      <!-- Estados de carga y error iniciales -->
      <div v-if="isLoading" class="loading-state">
        <span class="material-icons rotating">sync</span>
        <span>Cargando categorías...</span>
      </div>
      <div v-else-if="errorMessage" class="error-banner">
        <span class="material-icons">error_outline</span>
        <span>{{ errorMessage }}</span>
      </div>

      <div v-else class="explorer-body">
        
        <!-- PANTALLA 1: GRID DE CATEGORÍAS -->
        <Transition name="slide-fade" mode="out-in">
          <div v-if="!selectedCategoryId" class="categories-grid-screen">
            <div class="screen-header">
              <h1>Explorar Categorías</h1>
              <p>Selecciona una categoría para ver los participantes registrados.</p>
            </div>
            
            <div class="categories-grid">
              <div
                v-for="cat in categories"
                :key="cat.id"
                class="category-card-premium"
                @click="selectCategory(cat.id)"
              >
                <!-- Decoración deportiva superior -->
                <div class="card-sport-accent"></div>
                
                <div class="card-content">
                  <div class="card-top-row">
                    <span class="material-icons category-icon">sports_motorsports</span>
                    <span class="riders-badge">{{ getRidersCount(cat.id) }} Pilotos</span>
                  </div>
                  
                  <h2 class="category-card-title">{{ cat.name }}</h2>
                  
                  <div class="card-footer">
                    <span>Ver Competidores</span>
                    <span class="material-icons arrow-icon">arrow_forward</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- PANTALLA 2: DETALLES DE CATEGORÍA Y LISTA DE COMPETIDORES -->
          <div v-else class="riders-list-screen">
            <div class="screen-header-nav">
              <button class="back-pill-btn" @click="selectedCategoryId = null">
                <span class="material-icons">arrow_back</span>
                <span>Volver</span>
              </button>
              
              <div class="category-info-title">
                <h1>Categoría: {{ activeCategoryName }}</h1>
                <span class="total-riders-badge">{{ filteredRiders.length }} Inscritos</span>
              </div>
            </div>

            <!-- Buscador Rápido de Competidores en la Categoría -->
            <div class="search-box-wrapper">
              <div class="search-input-container">
                <span class="material-icons search-input-icon">search</span>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Buscar competidor por placa o nombre..."
                  class="explorer-search-input"
                  aria-label="Buscar competidor"
                />
                <button
                  v-if="searchQuery"
                  class="clear-search-btn"
                  @click="searchQuery = ''"
                >
                  <span class="material-icons">cancel</span>
                </button>
              </div>
            </div>

            <!-- Listado de competidores -->
            <div v-if="filteredRiders.length > 0" class="riders-list-wrapper">
              <div
                v-for="rider in filteredRiders"
                :key="rider.id"
                class="rider-explorer-row"
              >
                <!-- Placa -->
                <div class="plate-box">
                  <span class="plate-text">#{{ rider.plate_number }}</span>
                </div>
                
                <!-- Nombre y origen -->
                <div class="rider-details">
                  <span class="rider-name">{{ rider.full_name }}</span>
                  <span class="rider-team-origin">
                    {{ rider.origin }}
                    <span v-if="rider.club_team" class="divider">•</span>
                    {{ rider.club_team }}
                  </span>
                </div>
                
                <!-- Estado del corredor -->
                <div class="status-pill-box">
                  <span :class="['status-badge', `status-badge--${rider.race_status}`]">
                    {{ formatRaceStatus(rider.race_status) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div v-else class="empty-riders-state">
              <span class="material-icons empty-icon">group_off</span>
              <p>No se encontraron competidores en esta categoría.</p>
            </div>
          </div>
        </Transition>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getCategories, getRidersByCategory } from '../../partida/services/partidaService';

const categories = ref([]);
const allRiders = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');

const selectedCategoryId = ref(null);
const searchQuery = ref('');

onMounted(async () => {
  isLoading.value = true;
  try {
    const rawCategories = await getCategories();
    // Exclude the 'all' option from explorer categories
    categories.value = rawCategories.filter(c => c.id !== 'all');
    allRiders.value = await getRidersByCategory(undefined); // fetch all riders
  } catch (error) {
    errorMessage.value = error.friendlyMessage || 'Error al cargar los datos de categorías.';
  } finally {
    isLoading.value = false;
  }
});

function getRidersCount(catId) {
  return allRiders.value.filter(r => r.category_id === catId).length;
}

function selectCategory(catId) {
  selectedCategoryId.value = catId;
  searchQuery.value = '';
}

const activeCategoryName = computed(() => {
  const cat = categories.value.find(c => c.id === selectedCategoryId.value);
  return cat ? cat.name : '';
});

const filteredRiders = computed(() => {
  const list = allRiders.value.filter(r => r.category_id === selectedCategoryId.value);
  if (!searchQuery.value.trim()) return list;
  
  const query = searchQuery.value.toLowerCase().trim();
  return list.filter(r => 
    r.full_name.toLowerCase().includes(query) || 
    r.plate_number.toString().includes(query)
  );
});

function formatRaceStatus(status) {
  switch (status) {
    case 'pre_inscrito': return 'Pre-Inscrito';
    case 'en_carrera': return 'En Carrera';
    case 'finalizado': return 'Finalizado';
    case 'DNS': return 'No Partió (DNS)';
    case 'DNF': return 'No Terminó (DNF)';
    default: return status;
  }
}
</script>

<style scoped>
.view-container {
  padding: 16px;
  max-width: 1024px;
  margin: 0 auto;
  min-height: 100%;
}

@media (min-width: 1024px) {
  .view-container {
    padding: 24px;
    height: 100%;
    overflow-y: auto;
  }
}

.explorer-view-layout {
  display: flex;
  flex-direction: column;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 16px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.rotating {
  animation: spin 1s linear infinite;
  font-size: 28px;
  color: var(--color-primary);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #EF4444;
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 13.5px;
  margin-bottom: 16px;
}

/* Pantalla 1: Grid de Categorías */
.categories-grid-screen {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.screen-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.screen-header h1 {
  font-family: var(--font-headings);
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.screen-header p {
  font-size: 13.5px;
  color: var(--color-text-secondary);
}

.categories-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 600px) {
  .categories-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 900px) {
  .categories-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Tarjeta Premium de Categoría */
.category-card-premium {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  box-shadow: var(--shadow-premium);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

.category-card-premium:hover {
  transform: translateY(-4px);
  border-color: var(--color-primary);
  box-shadow: 0 12px 30px rgba(255, 94, 0, 0.1);
}

.card-sport-accent {
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  width: 100%;
}

.card-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.card-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-icon {
  font-size: 24px;
  color: var(--color-primary);
}

.riders-badge {
  background: rgba(255, 94, 0, 0.08);
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 20px;
  text-transform: uppercase;
}

.category-card-title {
  font-family: var(--font-headings);
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text-primary);
  text-transform: uppercase;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--color-text-secondary);
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
}

.arrow-icon {
  font-size: 16px;
  transition: transform 0.25s;
}

.category-card-premium:hover .arrow-icon {
  transform: translateX(4px);
  color: var(--color-primary);
}

/* Pantalla 2: Lista de Competidores */
.riders-list-screen {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.screen-header-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

@media (min-width: 600px) {
  .screen-header-nav {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.back-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-pill-btn:hover {
  background: var(--color-border);
}

.category-info-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-info-title h1 {
  font-family: var(--font-headings);
  font-size: 20px;
  font-weight: 800;
  color: var(--color-text-primary);
  text-transform: uppercase;
}

.total-riders-badge {
  background: rgba(16, 185, 129, 0.08);
  color: var(--color-success);
  font-size: 11.5px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 20px;
}

/* Buscador */
.search-box-wrapper {
  background: var(--color-background);
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

.explorer-search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 14.5px;
  font-weight: 500;
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

/* Tabla de Competidores */
.riders-list-wrapper {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-premium);
}

.rider-explorer-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  gap: 14px;
}

.rider-explorer-row:last-child {
  border-bottom: none;
}

.plate-box {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.plate-text {
  font-family: var(--font-headings);
  font-size: 16px;
  font-weight: 800;
  color: var(--color-primary);
}

.rider-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rider-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.rider-team-origin {
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.divider {
  margin: 0 4px;
  opacity: 0.4;
}

/* Badges de Estados en Carrera */
.status-pill-box {
  flex-shrink: 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
}

.status-badge--pre_inscrito {
  color: var(--status-pre-registered-color);
  background: var(--status-pre-registered-bg);
}

.status-badge--en_carrera {
  color: var(--status-racing-color);
  background: var(--status-racing-bg);
}

.status-badge--finalizado {
  color: var(--status-finished-color);
  background: var(--status-finished-bg);
}

.status-badge--DNS {
  color: var(--status-dns-color);
  background: var(--status-dns-bg);
}

.status-badge--DNF {
  color: var(--status-dnf-color);
  background: var(--status-dnf-bg);
}

.empty-riders-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 16px;
  text-align: center;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: 16px;
}

.empty-icon {
  font-size: 36px;
  color: var(--color-border);
}

/* Transición slide-fade */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
