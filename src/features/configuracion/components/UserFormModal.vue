<template>
  <AppModal
    :is-open="isOpen"
    :title="userId ? 'Editar Usuario de Staff' : 'Registrar Usuario de Staff'"
    @close="$emit('close')"
    max-width="440px"
    allow-overflow
  >
    <form @submit.prevent="handleSubmit" id="user-form" class="user-form-grid">
      <div class="form-group">
        <label for="username">Nombre de Usuario *</label>
        <AppInput
          id="username"
          type="text"
          v-model="form.username"
          placeholder="Ej: jsmith"
          required
        />
      </div>

      <div class="form-group">
        <label for="role">Rol asignado *</label>
        <AppSelect
          v-model="form.role"
          :options="roleOptions"
          placeholder="Seleccione un rol"
          icon="shield"
          required
        />
      </div>

      <!-- Info Banner about default password -->
      <div v-if="!userId" class="info-banner">
        <span class="material-icons">info</span>
        <span>La contraseña por defecto para este nuevo usuario será: <strong>manka2026</strong></span>
      </div>
    </form>

    <template #footer>
      <AppButton variant="secondary" @click="$emit('close')">
        Cancelar
      </AppButton>
      <AppButton type="submit" form="user-form" :loading="isSaving">
        Guardar
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  user: Object,
  isSaving: Boolean,
});

const emit = defineEmits(['close', 'save']);

const roleOptions = [
  { value: 'ADMIN', label: 'Director General (ADMIN)' },
  { value: 'PARTIDA', label: 'Juez de Partida (PARTIDA)' },
  { value: 'INTERMEDIO', label: 'Juez de Checkpoint (INTERMEDIO)' },
  { value: 'META', label: 'Juez de Meta (META)' },
];

const userId = ref(null);
const defaultForm = () => ({
  username: '',
  role: '',
});

const form = ref(defaultForm());

watch(
  () => props.user,
  (newVal) => {
    if (newVal) {
      userId.value = newVal.id;
      form.value = {
        username: newVal.username || '',
        role: newVal.role || '',
      };
    } else {
      userId.value = null;
      form.value = defaultForm();
    }
  },
  { immediate: true }
);

function handleSubmit() {
  emit('save', {
    id: userId.value,
    data: { ...form.value },
  });
}
</script>

<style scoped>
.user-form-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.info-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 94, 0, 0.05);
  border: 1px solid rgba(255, 94, 0, 0.15);
  color: var(--color-primary);
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.4;
}

.info-banner span.material-icons {
  font-size: 18px;
  flex-shrink: 0;
}
</style>
