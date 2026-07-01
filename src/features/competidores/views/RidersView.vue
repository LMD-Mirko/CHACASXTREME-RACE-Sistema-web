<template>
  <div class="view-container">
    <!-- Filtros y buscador superior -->
    <RidersFilters
      :model-value="filters"
      @update:model-value="Object.assign(filters, $event)"
      :categories="categories"
      @create="openCreateModal"
    />

    <!-- Estado de carga o error -->
    <div v-if="isLoading && riders.length === 0" class="loading-state">
      <span class="material-icons rotating">sync</span>
      <span>Cargando competidores...</span>
    </div>
    <div v-else-if="errorMessage" class="error-banner">
      <span class="material-icons">error_outline</span>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Contenido adaptativo responsivo -->
    <div v-else class="content-layout">
      <RidersTable
        :riders="riders"
        @edit="openEditModal"
        @change-status="openStatusModal"
        @view-detail="openDetailModal"
        @delete="handleDelete"
      />
    </div>

    <!-- Modales de operaciones -->
    <RiderFormModal
      :is-open="isFormOpen"
      :rider="selectedRider"
      :categories="categories"
      :is-saving="isLoading"
      @close="isFormOpen = false"
      @save="handleSave"
    />

    <RiderStatusModal
      :is-open="isStatusOpen"
      :rider="selectedRider"
      :is-saving="isLoading"
      @close="isStatusOpen = false"
      @update-status="handleUpdateStatus"
      @retire="handleRetireAction"
      @revert-retire="handleRevertRetireAction"
    />

    <RiderDetailModal
      :is-open="isDetailOpen"
      :rider="selectedRider"
      @close="isDetailOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRiders } from '../composables/useRiders';
import RidersFilters from '../components/RidersFilters.vue';
import RidersTable from '../components/RidersTable.vue';
import RiderFormModal from '../components/RiderFormModal.vue';
import RiderStatusModal from '../components/RiderStatusModal.vue';
import RiderDetailModal from '../components/RiderDetailModal.vue';

const {
  riders,
  categories,
  isLoading,
  errorMessage,
  filters,
  fetchRiders,
  fetchCategories,
  saveRiderData,
  updateStatus,
  handleRetire,
  handleRevertRetire,
  removeRider,
} = useRiders();

const isFormOpen = ref(false);
const isStatusOpen = ref(false);
const isDetailOpen = ref(false);
const selectedRider = ref(null);

onMounted(() => {
  fetchCategories();
  fetchRiders();
});

function openCreateModal() {
  selectedRider.value = null;
  isFormOpen.value = true;
}

function openEditModal(rider) {
  selectedRider.value = rider;
  isFormOpen.value = true;
}

function openStatusModal(rider) {
  selectedRider.value = rider;
  isStatusOpen.value = true;
}

function openDetailModal(rider) {
  selectedRider.value = rider;
  isDetailOpen.value = true;
}

async function handleSave({ id, data }) {
  const success = await saveRiderData(id, data);
  if (success) isFormOpen.value = false;
}

async function handleUpdateStatus({ id, status }) {
  await updateStatus(id, status);
  isStatusOpen.value = false;
}

async function handleRetireAction({ id, checkpointName }) {
  const success = await handleRetire(id, checkpointName);
  if (success) isStatusOpen.value = false;
}

async function handleRevertRetireAction(id) {
  await handleRevertRetire(id);
  isStatusOpen.value = false;
}

async function handleDelete(rider) {
  const confirmMsg = `¿Está seguro de que desea eliminar al competidor "${rider.full_name}" con Placa N° ${rider.plate_number}? Esta acción no se puede deshacer.`;
  if (confirm(confirmMsg)) {
    await removeRider(rider.id);
  }
}
</script>

<style scoped>
.view-container {
  display: flex;
  flex-direction: column;
}

.content-layout {
  width: 100%;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 16px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.rotating {
  animation: spin 1s linear infinite;
  font-size: 28px;
  color: var(--color-primary);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #EF4444;
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 13.5px;
  margin-bottom: 16px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
