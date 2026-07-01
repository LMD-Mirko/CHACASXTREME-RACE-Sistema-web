<template>
  <AppModal
    :is-open="isOpen"
    :title="categoryId ? 'Editar Categoría' : 'Nueva Categoría de Carrera'"
    @close="$emit('close')"
    max-width="440px"
  >
    <form @submit.prevent="handleSubmit" id="category-form" class="category-form-content">
      <div class="form-group">
        <label for="name">Nombre de Categoría *</label>
        <AppInput
          id="name"
          type="text"
          v-model="name"
          placeholder="Ej: Elite, Master A, Rígidas"
          required
        />
      </div>
    </form>

    <template #footer>
      <AppButton variant="secondary" @click="$emit('close')">
        Cancelar
      </AppButton>
      <AppButton type="submit" form="category-form" :loading="isSaving">
        Guardar
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  category: Object,
  isSaving: Boolean,
});

const emit = defineEmits(['close', 'save']);

const categoryId = ref(null);
const name = ref('');

watch(
  () => props.category,
  (newVal) => {
    if (newVal) {
      categoryId.value = newVal.id;
      name.value = newVal.name || '';
    } else {
      categoryId.value = null;
      name.value = '';
    }
  },
  { immediate: true }
);

function handleSubmit() {
  emit('save', {
    id: categoryId.value,
    name: name.value.trim(),
  });
}
</script>

<style scoped>
.category-form-content {
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
</style>
