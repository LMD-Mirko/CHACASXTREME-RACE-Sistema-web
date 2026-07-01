<template>
  <AppModal
    :is-open="isOpen"
    :title="`Estado: ${rider?.full_name}`"
    @close="$emit('close')"
    allow-overflow
    max-width="440px"
  >
    <form @submit.prevent="handleSubmit" id="status-form">
      <!-- Si está DNF, ofrece la opción directa de revertir -->
      <div v-if="rider?.race_status === 'DNF'" class="revert-section">
        <p class="revert-warning-text">
          El corredor actualmente está registrado como <strong>Retirado (DNF)</strong>.
        </p>
        <AppButton
          variant="success"
          icon="replay"
          class="btn-revert"
          @click="$emit('revert-retire', rider.id)"
          :disabled="isSaving"
        >
          Revertir Retiro
        </AppButton>
        <div class="divider"><span>O cambiar a otro estado</span></div>
      </div>

      <div class="form-group">
        <label>Seleccione Nuevo Estado</label>
        <AppSelect
          v-model="selectedStatus"
          :options="statusOptions"
          placeholder="Seleccione un estado"
          icon="star"
        />
      </div>

      <!-- Campo condicional para DNF (Requiere punto de control) -->
      <Transition name="slide">
        <div v-if="selectedStatus === 'DNF'" class="form-group checkpoint-group">
          <label for="checkpoint-input">Punto de Control (Retiro) *</label>
          <AppInput
            id="checkpoint-input"
            type="text"
            v-model="checkpointName"
            required
          />
          <p class="help-text">
            Indique dónde ocurrió el incidente o retiro. Esto notificará a los jueces.
          </p>
        </div>
      </Transition>
    </form>

    <template #footer>
      <AppButton variant="secondary" @click="$emit('close')">
        Cancelar
      </AppButton>
      <AppButton type="submit" form="status-form" :loading="isSaving">
        Actualizar
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, watch } from 'vue';

const statusOptions = [
  { value: 'pre_inscrito', label: 'Pre-Inscrito' },
  { value: 'en_carrera', label: 'En Carrera' },
  { value: 'llego', label: 'Llegó (Meta)' },
  { value: 'DNS', label: 'DNS (No Partió)' },
  { value: 'DNF', label: 'DNF (Retirado)' },
];

const props = defineProps({
  isOpen: Boolean,
  rider: Object,
  isSaving: Boolean,
});

const emit = defineEmits(['close', 'update-status', 'retire', 'revert-retire']);

const selectedStatus = ref('');
const checkpointName = ref('');

watch(
  () => props.rider,
  (newVal) => {
    if (newVal) {
      selectedStatus.value = newVal.race_status;
      checkpointName.value = '';
    }
  },
  { immediate: true }
);

function handleSubmit() {
  if (selectedStatus.value === 'DNF') {
    emit('retire', { id: props.rider.id, checkpointName: checkpointName.value });
  } else {
    emit('update-status', { id: props.rider.id, status: selectedStatus.value });
  }
}
</script>

<style scoped>
.revert-section {
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 20px;
}

.revert-warning-text {
  font-size: 12px;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.btn-revert {
  width: 100%;
}

.divider {
  text-align: center;
  position: relative;
  margin: 16px 0;
}

.divider::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: var(--color-border);
}

.divider span {
  position: relative;
  background: var(--color-background);
  padding: 0 10px;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.help-text {
  font-size: 11px;
  color: var(--color-text-secondary);
}

/* Transiciones del DNF */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
