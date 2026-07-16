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
        :load-profile-link="loadProfileShare"
        :load-dossier-link="loadDossierShare"
        @edit="openEditModal"
        @change-status="openStatusModal"
        @view-detail="openDetailModal"
        @assign-plate="openAssignPlateModal"
        @link-copied="onLinkCopied"
        @profile-link-sent="onProfileLinkSent"
        @dossier-link-sent="onDossierLinkSent"
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
import {
  dossierThanksMessage,
  profileCompleteMessage,
  withClientWhatsApp,
} from '../../../core/share/whatsappMessages.js';
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
  getDossierLink,
  markProfileLinkSent,
  markDossierLinkSent,
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

async function loadProfileShare(rider) {
  const data = await getProfileLink(rider.id);
  if (!data) throw new Error('No se pudo generar el enlace de ficha.');
  return withClientWhatsApp(
    {
      ...data,
      rider: data?.rider || { full_name: rider.full_name },
      phone: data?.phone || rider.emergency_phone,
    },
    profileCompleteMessage,
  );
}

async function loadDossierShare(rider) {
  const data = await getDossierLink(rider.id);
  if (!data) throw new Error('No se pudo generar el enlace de Mi carrera.');
  return withClientWhatsApp(
    {
      ...data,
      rider: data?.rider || { full_name: rider.full_name },
      phone: data?.phone || rider.emergency_phone,
    },
    dossierThanksMessage,
  );
}

function onLinkCopied(url) {
  showShareToast(`Link copiado: ${url}`);
}

async function onProfileLinkSent(rider) {
  const ok = await markProfileLinkSent(rider.id);
  if (ok) showShareToast('Envío de ficha registrado. Puedes reenviar cuando quieras.');
}

async function onDossierLinkSent(rider) {
  const ok = await markDossierLinkSent(rider.id);
  if (ok) showShareToast('Envío de Mi carrera registrado. Puedes reenviar cuando quieras.');
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
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
}

.content-layout {
  width: 100%;
  max-width: 100%;
  min-width: 0;
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
  bottom: calc(100px + env(safe-area-inset-bottom, 0px));
  left: 16px;
  right: 16px;
  z-index: 1200;
  max-width: min(92vw, 420px);
  margin: 0 auto;
  width: fit-content;
  box-sizing: border-box;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(255, 94, 0, 0.4);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  word-break: break-word;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
