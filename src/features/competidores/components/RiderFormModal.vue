<template>
  <AppModal
    :is-open="isOpen"
    :title="riderId ? 'Editar Piloto' : 'Registrar Piloto'"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" id="rider-form" class="rider-form-content">
      <p v-if="validationError" class="form-validation-error" role="alert">{{ validationError }}</p>
      <RiderFormFields
        v-model="form"
        :categories="categories"
        @file-selected="handleFileSelected"
      />
    </form>

    <template #footer>
      <AppButton variant="secondary" @click="$emit('close')">
        Cancelar
      </AppButton>
      <AppButton type="submit" form="rider-form" :loading="isSaving">
        Guardar
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, watch } from 'vue';
import RiderFormFields from './RiderFormFields.vue';

const props = defineProps({
  isOpen: Boolean,
  rider: Object,
  categories: Array,
  isSaving: Boolean,
});

const emit = defineEmits(['close', 'save']);

const validationError = ref('');

const riderId = ref(null);
const photoFile = ref(null);

const defaultForm = () => ({
  full_name: '',
  plate_number: '',
  category_id: '',
  dni: '',
  nickname: '',
  origin: '',
  club_team: '',
  instagram: '',
  emergency_phone: '',
  photo_url: '',
  has_guardian: false,
  guardian_full_name: '',
  guardian_dni: '',
  guardian_phone: '',
});

const form = ref(defaultForm());

function categoryRequiresGuardian(rider) {
  const name = rider?.category?.name || '';
  return /cadetes|junior/i.test(name);
}

watch(
  () => props.rider,
  (newVal) => {
    if (newVal) {
      riderId.value = newVal.id;
      const hasGuardianData = Boolean(
        newVal.guardian_full_name || newVal.guardian_dni || newVal.guardian_phone
      );
      form.value = {
        ...defaultForm(),
        ...newVal,
        // Cadetes/Junior siempre muestran apoderado; OPEN solo si ya hay datos
        has_guardian: categoryRequiresGuardian(newVal) || hasGuardianData,
      };
    } else {
      riderId.value = null;
      form.value = defaultForm();
    }
    photoFile.value = null;
  },
  { immediate: true }
);

function handleFileSelected(file) {
  photoFile.value = file;
}

function handleSubmit() {
  const name = (form.value.full_name || '').trim();
  const phone = String(form.value.emergency_phone || '').trim();
  const categoryId = form.value.category_id;

  if (!name || !categoryId || !phone) {
    validationError.value =
      'Completa nombre completo, categoría y número telefónico del competidor.';
    return;
  }

  validationError.value = '';

  const formData = new FormData();
  const payload = { ...form.value };

  // No enviar flag UI al API
  delete payload.has_guardian;

  if (!form.value.has_guardian) {
    payload.guardian_full_name = '';
    payload.guardian_dni = '';
    payload.guardian_phone = '';
  }

  Object.keys(payload).forEach((key) => {
    const value = payload[key];
    if (value === null || value === undefined) return;
    if (value === '') return;
    if (key === 'plate_number' && value === '') return;
    formData.append(key, value);
  });

  if (photoFile.value) {
    formData.append('photo_file', photoFile.value);
  }

  emit('save', { id: riderId.value, data: formData });
}
</script>

<style scoped>
.rider-form-content {
  display: flex;
  flex-direction: column;
}

.form-validation-error {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #fecaca;
  background: rgba(225, 29, 72, 0.12);
  border: 1px solid rgba(225, 29, 72, 0.35);
}
</style>
