<template>
  <AppModal
    :is-open="isOpen"
    :title="modalTitle"
    @close="$emit('close')"
    max-width="420px"
  >
    <form id="assign-plate-form" @submit.prevent="handleSubmit">
      <p class="rider-line">
        <strong>{{ rider?.full_name }}</strong>
        <span v-if="rider?.category?.name" class="cat"> · {{ rider.category.name }}</span>
      </p>

      <p v-if="hasCurrentPlate" class="current-plate">
        Placa actual: <strong>#{{ rider.plate_number }}</strong>
      </p>
      <p v-else class="current-plate muted">
        Este piloto aún no tiene número de placa.
      </p>

      <div class="form-group">
        <label for="new-plate">Número de placa *</label>
        <AppInput
          id="new-plate"
          type="number"
          v-model="plateInput"
          min="1"
          step="1"
          required
          placeholder="Ej. 101"
        />
        <p class="help-text">Debe ser único. No puede repetirse con otro competidor.</p>
      </div>

      <p v-if="localError" class="form-error">{{ localError }}</p>
      <p v-else-if="serverError" class="form-error">{{ serverError }}</p>
    </form>

    <template #footer>
      <AppButton variant="secondary" @click="$emit('close')" :disabled="isSaving">
        Cancelar
      </AppButton>
      <AppButton type="submit" form="assign-plate-form" :loading="isSaving">
        {{ hasCurrentPlate ? 'Reasignar' : 'Asignar placa' }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  rider: Object,
  isSaving: Boolean,
  serverError: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close', 'assign']);

const plateInput = ref('');
const localError = ref('');

const hasCurrentPlate = computed(() => {
  const p = props.rider?.plate_number;
  return p != null && p !== '' && Number(p) > 0;
});

const modalTitle = computed(() =>
  hasCurrentPlate.value ? 'Reasignar número de placa' : 'Asignar número de placa'
);

watch(
  () => [props.isOpen, props.rider],
  ([open]) => {
    if (!open) return;
    localError.value = '';
    plateInput.value = hasCurrentPlate.value ? String(props.rider.plate_number) : '';
  }
);

function handleSubmit() {
  localError.value = '';
  const n = Number(plateInput.value);
  if (!Number.isInteger(n) || n < 1) {
    localError.value = 'Ingresa un número de placa válido (entero ≥ 1).';
    return;
  }
  if (hasCurrentPlate.value && n === Number(props.rider.plate_number)) {
    localError.value = 'Es el mismo número actual. Elige otro para reasignar.';
    return;
  }
  emit('assign', { id: props.rider.id, plate_number: n });
}
</script>

<style scoped>
.rider-line {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--color-text-primary);
}

.cat {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.current-plate {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--color-text-primary);
}

.current-plate.muted {
  color: var(--color-text-secondary);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.help-text {
  margin: 0;
  font-size: 11.5px;
  color: var(--color-text-secondary);
}

.form-error {
  margin: 12px 0 0;
  font-size: 13px;
  color: #ef4444;
}
</style>
