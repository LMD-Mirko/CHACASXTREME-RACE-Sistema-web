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
    <div v-else-if="errorMessage && riders.length === 0" class="error-banner">
      <span class="material-icons">error_outline</span>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Contenido adaptativo responsivo -->
    <div v-else class="content-layout">
      <div v-if="errorMessage && !isPlateOpen" class="error-banner error-banner--inline">
        <span class="material-icons">error_outline</span>
        <span>{{ errorMessage }}</span>
      </div>
      <RidersTable
        :riders="riders"
        @edit="openEditModal"
        @change-status="openStatusModal"
        @view-detail="openDetailModal"
        @assign-plate="openAssignPlateModal"
        @share-profile="handleShareProfile"
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

    <AssignPlateModal
      :is-open="isPlateOpen"
      :rider="selectedRider"
      :is-saving="isLoading"
      :server-error="isPlateOpen ? errorMessage : ''"
      @close="closeAssignPlateModal"
      @assign="handleAssignPlate"
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

    <div v-if="shareToast" class="share-toast">{{ shareToast }}</div>
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
import AssignPlateModal from '../components/AssignPlateModal.vue';

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
  assignPlate,
  getProfileLink,
  removeRider,
} = useRiders();

const isFormOpen = ref(false);
const isStatusOpen = ref(false);
const isDetailOpen = ref(false);
const isPlateOpen = ref(false);
const selectedRider = ref(null);
const shareToast = ref('');
let shareToastTimer = null;

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

function openAssignPlateModal(rider) {
  selectedRider.value = rider;
  errorMessage.value = '';
  isPlateOpen.value = true;
}

function closeAssignPlateModal() {
  isPlateOpen.value = false;
  errorMessage.value = '';
}

function showShareToast(message) {
  shareToast.value = message;
  if (shareToastTimer) clearTimeout(shareToastTimer);
  shareToastTimer = setTimeout(() => {
    shareToast.value = '';
  }, 2800);
}

async function handleShareProfile(rider) {
  const data = await getProfileLink(rider.id);
  if (!data?.token) return;

  // URL en ESTE mismo sistema (no la web pública / puerto equivocado)
  const url = `${window.location.origin}/completar-perfil?token=${encodeURIComponent(data.token)}`;
  const waText = `Hola ${rider.full_name}! Sube tu foto rider y completa lo que falta para Chacas Xtreme Race.\n\nEntra aquí (enlace personal):\n${url}`;
  const phone = String(rider.emergency_phone || '').replace(/\D+/g, '');
  const waPhone = phone ? (phone.startsWith('51') ? phone : `51${phone}`) : '';

  try {
    await navigator.clipboard.writeText(url);
    showShareToast(`Link personal copiado: ${url}`);
  } catch {
    showShareToast(url);
  }

  if (waPhone) {
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`, '_blank', 'noopener,noreferrer');
  }
}

async function handleSave({ id, data }) {
  const success = await saveRiderData(id, data);
  if (success) isFormOpen.value = false;
}

async function handleAssignPlate({ id, plate_number }) {
  const success = await assignPlate(id, plate_number);
  if (success) closeAssignPlateModal();
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
  const plateLabel = rider.plate_number ? ` con Placa N° ${rider.plate_number}` : '';
  const confirmMsg = `¿Está seguro de que desea eliminar al competidor "${rider.full_name}"${plateLabel}? Esta acción no se puede deshacer.`;
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

.share-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1200;
  max-width: min(92vw, 420px);
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(255, 94, 0, 0.4);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  word-break: break-all;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
