<template>
  <div class="form-fields">
    <!-- Foto del competidor -->
    <div class="photo-upload-section">
      <div class="photo-preview-wrapper" @click="triggerFileInput">
        <img
          v-if="previewUrl"
          :src="previewUrl"
          alt="Vista previa de la foto del competidor"
          class="preview-image"
        />
        <div v-else class="upload-placeholder">
          <span class="material-icons">add_a_photo</span>
          <span class="upload-text">Foto rider</span>
        </div>
      </div>
      <input
        type="file"
        ref="fileInput"
        @change="handleFileChange"
        accept="image/jpeg,image/png,image/webp"
        class="hidden-file-input"
        aria-label="Subir foto rider del competidor"
      />
      <p class="photo-help-text">
        Foto rider (acción / salto / bajada o a tu gusto). Se usa en la página web.
        JPG, PNG o WEBP. Máx. 10MB.
      </p>
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
        <label for="plate_number">Número de Placa</label>
        <AppInput
          id="plate_number"
          type="number"
          :model-value="modelValue.plate_number"
          @update:model-value="updateValue('plate_number', parseInt($event) || '')"
        />
        <p class="field-hint">Opcional. También puedes asignarla después con “Asignar placa”.</p>
      </div>

      <div class="form-group">
        <label>Categoría *</label>
        <AppSelect
          :model-value="modelValue.category_id"
          @update:model-value="onCategoryChange"
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

      <!-- Solo CADETES, JUNIOR (obligatorio) y OPEN (opcional) -->
      <template v-if="showsGuardianSection">
        <div
          v-if="guardianIsOptional"
          class="form-group full-width guardian-toggle"
        >
          <label class="checkbox-row">
            <input
              type="checkbox"
              :checked="hasGuardian"
              @change="toggleGuardian($event.target.checked)"
            />
            <span>Tiene apoderado (menores / tutela)</span>
          </label>
          <p class="field-hint">
            En OPEN solo aplica si el competidor es menor de edad.
          </p>
        </div>

        <template v-if="showGuardianFields">
          <div class="form-group full-width guardian-block-title">
            Datos del apoderado
            <span v-if="guardianIsRequired" class="guardian-required-badge">Obligatorio</span>
          </div>
          <p v-if="guardianIsRequired" class="field-hint guardian-hint">
            En Cadetes y Junior el apoderado es obligatorio.
          </p>
          <div class="form-group">
            <label for="guardian_full_name">Nombre completo del apoderado *</label>
            <AppInput
              id="guardian_full_name"
              type="text"
              :model-value="modelValue.guardian_full_name"
              @update:model-value="updateValue('guardian_full_name', $event)"
              required
            />
          </div>
          <div class="form-group">
            <label for="guardian_dni">DNI del apoderado</label>
            <AppInput
              id="guardian_dni"
              type="text"
              :model-value="modelValue.guardian_dni"
              @update:model-value="updateValue('guardian_dni', $event)"
            />
          </div>
          <div class="form-group full-width">
            <label for="guardian_phone">Teléfono del apoderado</label>
            <AppInput
              id="guardian_phone"
              type="text"
              :model-value="modelValue.guardian_phone"
              @update:model-value="updateValue('guardian_phone', $event)"
            />
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { storageUrl } from '../../../core/network/storageUrl';

/** Categorías donde aplica apoderado (menores / tutela). */
const GUARDIAN_REQUIRED_RE = /cadetes|junior/i;
const GUARDIAN_OPTIONAL_RE = /open/i;

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

const selectedCategoryName = computed(() => {
  const id = props.modelValue.category_id;
  if (id === '' || id === null || id === undefined) return '';
  const cat = props.categories.find((c) => String(c.id) === String(id));
  return cat?.name || '';
});

const guardianIsRequired = computed(() => GUARDIAN_REQUIRED_RE.test(selectedCategoryName.value));
const guardianIsOptional = computed(() => {
  if (guardianIsRequired.value) return false;
  return GUARDIAN_OPTIONAL_RE.test(selectedCategoryName.value);
});
const showsGuardianSection = computed(
  () => guardianIsRequired.value || guardianIsOptional.value
);

const hasGuardian = computed(() => Boolean(props.modelValue.has_guardian));
const showGuardianFields = computed(
  () => guardianIsRequired.value || (guardianIsOptional.value && hasGuardian.value)
);

const previewUrl = computed(() => {
  if (localPreview.value) return localPreview.value;
  if (props.modelValue.photo_url) {
    if (props.modelValue.photo_url.startsWith('http')) return props.modelValue.photo_url;
    return storageUrl(props.modelValue.photo_url);
  }
  return '';
});

watch(
  selectedCategoryName,
  (name) => {
    syncGuardianForCategory(name);
  },
  { immediate: true }
);

function syncGuardianForCategory(name) {
  if (GUARDIAN_REQUIRED_RE.test(name)) {
    if (!props.modelValue.has_guardian) {
      emit('update:modelValue', {
        ...props.modelValue,
        has_guardian: true,
      });
    }
    return;
  }

  if (GUARDIAN_OPTIONAL_RE.test(name)) {
    // OPEN: dejar el checkbox como está (no forzar ni limpiar)
    return;
  }

  // Otras categorías: ocultar y limpiar
  if (
    props.modelValue.has_guardian ||
    props.modelValue.guardian_full_name ||
    props.modelValue.guardian_dni ||
    props.modelValue.guardian_phone
  ) {
    emit('update:modelValue', {
      ...props.modelValue,
      has_guardian: false,
      guardian_full_name: '',
      guardian_dni: '',
      guardian_phone: '',
    });
  }
}

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

function onCategoryChange(categoryId) {
  const cat = props.categories.find((c) => String(c.id) === String(categoryId));
  const name = cat?.name || '';
  const next = {
    ...props.modelValue,
    category_id: categoryId,
  };

  if (GUARDIAN_REQUIRED_RE.test(name)) {
    next.has_guardian = true;
  } else if (!GUARDIAN_OPTIONAL_RE.test(name)) {
    next.has_guardian = false;
    next.guardian_full_name = '';
    next.guardian_dni = '';
    next.guardian_phone = '';
  }

  emit('update:modelValue', next);
}

function toggleGuardian(checked) {
  if (checked) {
    emit('update:modelValue', {
      ...props.modelValue,
      has_guardian: true,
    });
    return;
  }
  emit('update:modelValue', {
    ...props.modelValue,
    has_guardian: false,
    guardian_full_name: '',
    guardian_dni: '',
    guardian_phone: '',
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
  text-align: center;
  padding: 0 6px;
}

.upload-text {
  font-size: 10px;
  font-weight: 600;
  margin-top: 4px;
  line-height: 1.2;
}

.hidden-file-input {
  display: none;
}

.photo-help-text {
  font-size: 11px;
  color: var(--color-text-secondary);
  text-align: center;
  max-width: 280px;
  line-height: 1.4;
  margin: 0;
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

.field-hint {
  margin: 0;
  font-size: 11px;
  color: var(--color-text-muted, #94a3b8);
  line-height: 1.35;
}

.guardian-hint {
  grid-column: 1 / -1;
  margin-top: -8px;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary, #e2e8f0);
}

.checkbox-row input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary, #ff5e00);
  cursor: pointer;
}

.guardian-block-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-primary, #ff5e00);
  margin-top: 4px;
}

.guardian-required-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 94, 0, 0.15);
  color: var(--color-primary, #ff5e00);
}

.guardian-toggle {
  padding-top: 4px;
  border-top: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
}
</style>
