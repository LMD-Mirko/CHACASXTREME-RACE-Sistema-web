<template>
  <div class="filters-container">
    <div class="filters-inputs">
      <!-- Buscador por texto -->
      <div class="search-wrapper">
        <AppInput
          :model-value="modelValue.search"
          @update:model-value="updateField('search', $event)"
          placeholder="Buscar piloto, DNI, placa..."
          icon="search"
          aria-label="Buscar competidores"
        />
      </div>

      <!-- Selector de categoría moderno -->
      <div class="select-field-wrapper">
        <AppSelect
          :model-value="modelValue.category_id"
          @update:model-value="updateField('category_id', $event)"
          :options="categoryOptions"
          placeholder="Todas las categorías"
          icon="flag"
        />
      </div>
    </div>

    <!-- Botón de creación -->
    <AppButton
      icon="add"
      @click="$emit('create')"
      aria-label="Agregar nuevo competidor"
      class="btn-create"
    >
      Nuevo Piloto
    </AppButton>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: Object, required: true },
  categories: { type: Array, required: true },
});

const emit = defineEmits(['update:modelValue', 'create']);

const categoryOptions = computed(() => {
  return [
    { value: '', label: 'Todas las categorías' },
    ...props.categories.map((cat) => ({ value: cat.id, label: cat.name })),
  ];
});

function updateField(key, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  });
}
</script>

<style scoped>
/* === BASE: MÓVIL — Filtros apilados con diseño premium === */
.filters-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.filters-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-wrapper,
.select-field-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
}

/* === DESKTOP: Disposición en fila para filtros === */
@media (min-width: 1024px) {
  .filters-container {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .filters-inputs {
    flex-direction: row;
    flex: 1;
    max-width: 600px;
  }

  .search-wrapper {
    flex: 2;
  }

  .select-field-wrapper {
    flex: 1;
  }

  .btn-create {
    padding: 0 24px;
  }
}
</style>
