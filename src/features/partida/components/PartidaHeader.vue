<template>
  <div class="partida-header-card">
    <div class="header-main-grid">
      <!-- Selector de Fase (Switch Grande Deportivo) -->
      <div class="control-group">
        <span class="control-label">Fase del Evento</span>
        <div class="phase-toggle-container">
          <button
            class="phase-btn"
            :class="{ 'phase-btn--active-practice': phase === 'practica' }"
            @click="setPhase('practica')"
            :disabled="disabled"
          >
            <span class="material-icons">architecture</span>
            Práctica
          </button>
          <button
            class="phase-btn"
            :class="{ 'phase-btn--active-final': phase === 'final' }"
            @click="setPhase('final')"
            :disabled="disabled"
          >
            <span class="material-icons">flash_on</span>
            Final
          </button>
        </div>
      </div>

      <!-- Selector de Categoría (AppSelect adaptado) -->
      <div class="control-group">
        <span class="control-label">Categoría a Largarse</span>
        <AppSelect
          :model-value="categoryId"
          @update:model-value="setCategory"
          :options="categories"
          icon="sports_motorsports"
          placeholder="Seleccionar Categoría"
          :disabled="disabled"
        />
      </div>
    </div>

    <!-- Indicador de Estado de Tanda -->
    <PartidaStatusBar
      :active-category-name="activeCategoryName"
      :status-message="statusMessage"
      :race-state="raceState"
      :riders="riders"
      :present-rider-ids="presentRiderIds"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import PartidaStatusBar from './PartidaStatusBar.vue';

const props = defineProps({
  phase: { type: String, required: true },
  categoryId: { type: [String, Number], required: true },
  categories: { type: Array, required: true },
  riders: { type: Array, required: true },
  presentRiderIds: { type: Object, required: true }, // Set of confirmed present IDs
  raceState: { type: String, required: true },
  disabled: { type: Boolean, default: false }
});

const emit = defineEmits(['update:phase', 'update:categoryId']);

const activeCategoryName = computed(() => {
  if (props.categoryId === 'all') {
    return 'LARGADA GENERAL: MEGA AVALANCHA';
  }
  const cat = props.categories.find(c => c.id === parseInt(props.categoryId));
  return cat ? `Categoría: ${cat.name}` : 'Sin categoría seleccionada';
});

const statusMessage = computed(() => {
  const totalRiders = props.riders.length;
  const activeRiders = props.riders.filter(r => r.race_status !== 'DNS').length;
  
  if (props.raceState === 'active') {
    return `En pista: ${activeRiders} corredores (Manga Iniciada)`;
  }
  if (props.raceState === 'counting') {
    return 'Lanzando manga... ¡Cuenta regresiva!';
  }
  return `Estado: En Espera (${totalRiders} mapeados, ${activeRiders} listos)`;
});

function setPhase(phase) {
  emit('update:phase', phase);
}

function setCategory(id) {
  emit('update:categoryId', id);
}
</script>

<style scoped>
.partida-header-card {
  position: relative;
  z-index: 20; /* Establish stacking context to overlay dropdown on top of search bar */
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: var(--shadow-premium);
  animation: fadeIn 0.4s ease forwards;
}

.header-main-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 600px) {
  .header-main-grid {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.phase-toggle-container {
  display: flex;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 4px;
  height: 46px;
}

.phase-btn {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13.5px;
  font-weight: 600;
  border-radius: 9px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  touch-action: manipulation;
}

.phase-btn span {
  font-size: 18px;
}

.phase-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.phase-btn--active-practice {
  background: rgba(255, 94, 0, 0.1);
  color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(255, 94, 0, 0.08);
}

.dark-theme .phase-btn--active-practice {
  background: var(--color-primary);
  color: #FFFFFF;
}

.phase-btn--active-final {
  background: rgba(251, 191, 36, 0.1);
  color: var(--color-secondary);
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.08);
}

.dark-theme .phase-btn--active-final {
  background: var(--color-secondary);
  color: #000000;
}
</style>
