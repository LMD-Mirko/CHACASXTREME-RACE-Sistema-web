<template>
  <div class="form-fields">
    <!-- Carga de Foto y Vista previa -->
    <div class="photo-upload-section">
      <div class="photo-preview-wrapper" @click="triggerFileInput">
        <img v-if="previewUrl" :src="previewUrl" alt="Vista previa de foto" class="preview-image" />
        <div v-else class="upload-placeholder">
          <span class="material-icons">add_a_photo</span>
          <span class="upload-text">Subir Foto</span>
        </div>
      </div>
      <input
        type="file"
        ref="fileInput"
        @change="handleFileChange"
        accept="image/*"
        class="hidden-file-input"
        aria-label="Cargar foto del competidor"
      />
      <p class="photo-help-text">JPG, PNG o WEBP. Máx. 10MB.</p>
    </div>

    <!-- Grid de campos de texto -->
    <div class="fields-grid">
      <div class="form-group">
        <label for="full_name">Nombre Completo *</label>
        <AppInput
          id="full_name"
          type="text"
          :model-value="modelValue.full_name"
          @update:model-value="updateValue('full_name', $event)"
          required
        />
      </div>

      <div class="form-group">
        <label for="plate_number">Número de Placa *</label>
        <AppInput
          id="plate_number"
          type="number"
          :model-value="modelValue.plate_number"
          @update:model-value="updateValue('plate_number', parseInt($event) || '')"
          required
        />
      </div>

      <div class="form-group">
        <label>Categoría *</label>
        <AppSelect
          :model-value="modelValue.category_id"
          @update:model-value="updateValue('category_id', $event)"
          :options="categories"
          placeholder="Seleccione categoría"
          icon="flag"
        />
      </div>

      <div class="form-group">
        <label for="dni">DNI / Pasaporte</label>
        <AppInput
          id="dni"
          type="number"
          :model-value="modelValue.dni"
          @update:model-value="updateValue('dni', $event)"
        />
      </div>

      <div class="form-group">
        <label for="nickname">Apodo</label>
        <AppInput
          id="nickname"
          type="text"
          :model-value="modelValue.nickname"
          @update:model-value="updateValue('nickname', $event)"
        />
      </div>

      <div class="form-group">
        <label for="origin">Procedencia *</label>
        <AppInput
          id="origin"
          type="text"
          :model-value="modelValue.origin"
          @update:model-value="updateValue('origin', $event)"
          required
        />
      </div>

      <div class="form-group">
        <label for="club_team">Club o Equipo</label>
        <AppInput
          id="club_team"
          type="text"
          :model-value="modelValue.club_team"
          @update:model-value="updateValue('club_team', $event)"
        />
      </div>

      <div class="form-group">
        <label for="instagram">Instagram</label>
        <AppInput
          id="instagram"
          type="text"
          prefix="@"
          :model-value="modelValue.instagram ? modelValue.instagram.replace('@', '') : ''"
          @update:model-value="updateValue('instagram', $event.trim() ? '@' + $event.replace('@', '').trim() : '')"
        />
      </div>

      <div class="form-group full-width">
        <label for="emergency_phone">Contacto de Emergencia *</label>
        <AppInput
          id="emergency_phone"
          type="number"
          :model-value="modelValue.emergency_phone"
          @update:model-value="updateValue('emergency_phone', $event)"
          required
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  categories: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'file-selected']);

const fileInput = ref(null);
const localPreview = ref('');

const previewUrl = computed(() => {
  if (localPreview.value) return localPreview.value;
  if (props.modelValue.photo_url) {
    if (props.modelValue.photo_url.startsWith('http')) return props.modelValue.photo_url;
    return `http://127.0.0.1:8000/storage/${props.modelValue.photo_url}`;
  }
  return '';
});

function triggerFileInput() {
  fileInput.value.click();
}

function handleFileChange(event) {
  const file = event.target.files[0];
  if (file) {
    localPreview.value = URL.createObjectURL(file);
    emit('file-selected', file);
  }
}

function updateValue(field, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  });
}
</script>

<style scoped>
.form-fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.photo-upload-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.photo-preview-wrapper {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 2px dashed var(--color-border);
  background: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
}

.photo-preview-wrapper:hover {
  border-color: var(--color-primary);
  background: rgba(255, 94, 0, 0.02);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--color-text-secondary);
}

.upload-text {
  font-size: 11px;
  font-weight: 500;
  margin-top: 4px;
}

.hidden-file-input {
  display: none;
}

.photo-help-text {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.fields-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px 24px;
}

@media (min-width: 640px) {
  .fields-grid {
    grid-template-columns: 1fr 1fr;
  }
  .form-group.full-width {
    grid-column: span 2;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
}
</style>
