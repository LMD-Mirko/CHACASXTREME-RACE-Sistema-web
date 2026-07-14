<template>
  <div class="tab-pane">
    <div class="pane-header">
      <h3>Configuración de Competencia</h3>
    </div>

    <!-- Alert Messages -->
    <div v-if="alertMessage" class="alert-banner" :class="`alert-banner--${alertType}`">
      <span class="material-icons">
        {{ alertType === 'error' ? 'error_outline' : 'check_circle_outline' }}
      </span>
      <span>{{ alertMessage }}</span>
      <button class="btn-close-alert" @click="alertMessage = ''">
        <span class="material-icons">close</span>
      </button>
    </div>

    <div v-if="loading" class="loading-spinner">
      <span class="material-icons rotating">sync</span>
      <span>Obteniendo datos de carrera...</span>
    </div>

    <div v-else-if="!activeComp" class="no-competition-alert">
      <span class="material-icons">info</span>
      <p>No se encontró ninguna competencia activa en la base de datos.</p>
    </div>

    <div v-else class="competition-settings-grid">
      <!-- Tarjeta de Info Global -->
      <div class="config-card">
        <h4>Competencia Activa</h4>
        <p class="comp-name">{{ activeComp.name }}</p>

        <div class="phase-selector-section">
          <span class="section-subtitle">Fase Actual del Evento</span>
          <div class="phase-buttons">
            <AppButton
              :variant="activeComp.current_phase === 'practica' ? 'primary' : 'secondary'"
              icon="settings_backup_restore"
              @click="handleUpdatePhase('practica')"
              :loading="saving"
            >
              Clasificación
            </AppButton>
            <AppButton
              :variant="activeComp.current_phase === 'final' ? 'primary' : 'secondary'"
              icon="sports_score"
              @click="handleUpdatePhase('final')"
              :loading="saving"
            >
              Final
            </AppButton>
          </div>
          <p class="phase-help-text">
            La fase operativa la usan Partida, Checkpoint y Meta. En Puestos puedes mirar ambas mangas con el selector.
          </p>
          <AppButton
            variant="primary"
            icon="sports"
            class="btn-prepare-final"
            @click="handlePrepareFinal"
            :loading="preparingFinal"
          >
            Cerrar Clasificación y Abrir Final
          </AppButton>
        </div>
      </div>

      <!-- Tarjeta de Consolidación de Categorías -->
      <div class="config-card">
        <h4>Consolidación y Cierre de Categorías</h4>
        <p class="section-help-text">
          Consolidar una categoría oficializa los tiempos finales y bloquea los resultados para la premiación.
        </p>

        <div class="consolidate-list">
          <div v-for="cat in categories" :key="cat.id" class="consolidate-item">
            <div class="consolidate-item-info">
              <span class="material-icons">flag</span>
              <span>{{ cat.name }}</span>
            </div>
            <AppButton
              variant="secondary"
              icon="check"
              @click="handleFinalizeCategory(cat)"
              :loading="finalizingIds.includes(cat.id)"
            >
              Consolidar
            </AppButton>
          </div>
        </div>
      </div>

      <!-- Tarjeta de Zona de Peligro (Reinicio de Carrera) -->
      <div class="config-card config-card--danger">
        <h4 class="text-danger-title">Zona de Peligro / Reinicios</h4>
        <p class="section-help-text">
          Usa reinicios parciales para ensayos. El reinicio total borra clasificación y final.
        </p>

        <div class="danger-zone-actions">
          <AppButton
            variant="secondary"
            icon="restart_alt"
            @click="handleResetCompetition('practica')"
            :loading="resetting"
          >
            Reiniciar solo Clasificación
          </AppButton>
          <AppButton
            variant="secondary"
            icon="restart_alt"
            @click="handleResetCompetition('final')"
            :loading="resetting"
          >
            Reiniciar solo Final
          </AppButton>
          <AppButton
            variant="primary"
            icon="delete_forever"
            class="btn-danger-reset"
            @click="handleResetCompetition('all')"
            :loading="resetting"
          >
            Reiniciar Carrera a 0
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  getActiveCompetition,
  updateCompetitionPhase,
  finalizeCategory,
  getCategories,
  resetCompetitionResults,
  prepareFinal,
} from '../services/configuracionService';

const activeComp = ref(null);
const categories = ref([]);
const loading = ref(false);
const saving = ref(false);
const finalizingIds = ref([]);
const preparingFinal = ref(false);
const resetting = ref(false);

const alertMessage = ref('');
const alertType = ref('success');

function showAlert(message, type = 'success') {
  alertMessage.value = message;
  alertType.value = type;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadData() {
  loading.value = true;
  try {
    activeComp.value = await getActiveCompetition();
    categories.value = await getCategories();
  } catch (err) {
    showAlert('Error al cargar información de competencia', 'error');
  } finally {
    loading.value = false;
  }
}

async function handleUpdatePhase(phase) {
  if (!activeComp.value) return;
  saving.value = true;
  try {
    const updated = await updateCompetitionPhase(activeComp.value.id, phase);
    activeComp.value = updated;
    showAlert(`Fase cambiada a ${phase === 'practica' ? 'Clasificación' : 'Final'}`);
  } catch (err) {
    showAlert(err.friendlyMessage || 'Error al actualizar fase', 'error');
  } finally {
    saving.value = false;
  }
}

async function handlePrepareFinal() {
  if (!activeComp.value) return;
  const ok = confirm(
    '¿Cerrar Clasificación y abrir Final?\n\nSolo quienes tienen META en clasificación entrarán a la grilla. No se borran tiempos de clasificación.'
  );
  if (!ok) return;

  preparingFinal.value = true;
  try {
    const res = await prepareFinal(activeComp.value.id);
    activeComp.value = res.data?.competition || { ...activeComp.value, current_phase: 'final' };
    showAlert(res.message || 'Final preparada.');
    window.dispatchEvent(new CustomEvent('race-reset'));
  } catch (err) {
    showAlert(err.friendlyMessage || 'No se pudo preparar la Final', 'error');
  } finally {
    preparingFinal.value = false;
  }
}

async function handleFinalizeCategory(cat) {
  if (!activeComp.value) return;
  const confirmMsg = `¿Deseas consolidar los resultados de la categoría "${cat.name}"?`;
  if (!confirm(confirmMsg)) return;

  finalizingIds.value.push(cat.id);
  try {
    const res = await finalizeCategory(activeComp.value.id, cat.id);
    if (res && res.warning) {
      showAlert(`Consolidación completa. ${res.warning}`, 'success');
    } else {
      showAlert(`Categoría "${cat.name}" consolidada con éxito.`);
    }
  } catch (err) {
    showAlert(err.friendlyMessage || 'Error al consolidar la categoría', 'error');
  } finally {
    finalizingIds.value = finalizingIds.value.filter(id => id !== cat.id);
  }
}

async function handleResetCompetition(scope = 'all') {
  if (!activeComp.value) return;

  const labels = {
    all: 'TODA la carrera (clasificación + final)',
    practica: 'SOLO la Clasificación (ensayos)',
    final: 'SOLO la Final',
  };

  const step1 = confirm(
    `⚠️ Esto reiniciará ${labels[scope]}.\n\n¿Continuar?`
  );
  if (!step1) return;

  if (scope === 'all') {
    const step2 = confirm('Última confirmación: se borrarán TODOS los tiempos del día. ¿Seguro?');
    if (!step2) return;
  }

  resetting.value = true;
  try {
    const res = await resetCompetitionResults(activeComp.value.id, scope);
    showAlert(res.message || 'Reinicio completado.');
    await loadData();
    window.dispatchEvent(new CustomEvent('race-reset'));
  } catch (err) {
    showAlert(err.friendlyMessage || 'Error al reiniciar', 'error');
  } finally {
    resetting.value = false;
  }
}

onMounted(loadData);
</script>

<style scoped>
.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pane-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 60px 20px;
  color: var(--color-text-secondary);
}

.rotating {
  font-size: 28px;
  color: var(--color-primary);
  animation: spin 1s linear infinite;
  display: inline-flex;
}

.no-competition-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  color: #D97706;
  padding: 16px;
  border-radius: 12px;
  font-size: 13.5px;
}

.no-competition-alert span {
  font-size: 20px;
}

.competition-settings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 768px) {
  .competition-settings-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.config-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow-premium);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s, box-shadow 0.25s;
}

.config-card:hover {
  border-color: rgba(255, 94, 0, 0.18);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(255, 94, 0, 0.04);
}

:global(.dark-theme) .config-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
}

.config-card h4 {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.comp-name {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0;
}

.phase-selector-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
  border-top: 1px dashed var(--color-border);
  padding-top: 16px;
}

.section-subtitle {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.phase-buttons {
  display: flex;
  gap: 12px;
}

.phase-buttons button {
  flex: 1;
}

.phase-help-text,
.section-help-text {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
}

.consolidate-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 4px;
}

.consolidate-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.consolidate-item:hover {
  border-color: var(--color-primary);
  background: var(--color-surface);
  transform: translateX(2px);
}

.consolidate-item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.consolidate-item-info span.material-icons {
  font-size: 18px;
  color: var(--color-primary);
  display: inline-flex;
}

/* Alert Banner */
.alert-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13.5px;
  position: relative;
  font-weight: 500;
}

.alert-banner--success {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #10B981;
}

.alert-banner--error {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #EF4444;
}

.btn-close-alert {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  display: flex;
}


.config-card--danger {
  border-color: rgba(239, 68, 68, 0.15);
}

.config-card--danger:hover {
  border-color: rgba(239, 68, 68, 0.4) !important;
  box-shadow: 0 8px 30px rgba(239, 68, 68, 0.05) !important;
}

.text-danger-title {
  color: var(--color-error) !important;
}

.danger-zone-action {
  margin-top: 12px;
  border-top: 1px dashed rgba(239, 68, 68, 0.15);
  padding-top: 16px;
  display: flex;
}

.danger-zone-actions {
  margin-top: 12px;
  border-top: 1px dashed rgba(239, 68, 68, 0.15);
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-prepare-final {
  width: 100%;
}

.btn-danger-reset {
  background: var(--color-error) !important;
  color: #FFFFFF !important;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
  width: 100%;
}

.btn-danger-reset:hover {
  background: #DC2626 !important;
  box-shadow: 0 6px 18px rgba(239, 68, 68, 0.35);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
