<template>
  <AppModal
    :is-open="isOpen"
    :title="riderId ? 'Editar Piloto' : 'Registrar Piloto'"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" id="rider-form" class="rider-form-content">
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
});

const form = ref(defaultForm());

watch(
  () => props.rider,
  (newVal) => {
    if (newVal) {
      riderId.value = newVal.id;
      form.value = { ...defaultForm(), ...newVal };
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
  const formData = new FormData();
  
  Object.keys(form.value).forEach((key) => {
    if (form.value[key] !== null && form.value[key] !== undefined) {
      formData.append(key, form.value[key]);
    }
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
</style>
