<template>
  <div class="riders-table-wrapper fade-in">
    <AppTable :items="riders" :headers="headers">
      <!-- Slot de Celda: Foto -->
      <template #cell-photo="{ item }">
        <div class="avatar-cell">
          <img
            v-if="item.photo_url"
            :src="resolvePhotoUrl(item.photo_url)"
            @error="handleImageError"
            alt="Piloto"
            class="rider-avatar"
          />
          <div v-else class="rider-avatar-placeholder">
            {{ getInitials(item.full_name) }}
          </div>
        </div>
      </template>

      <!-- Slot de Celda: Placa -->
      <template #cell-plate="{ item }">
        <div class="plate-cell">
          <span v-if="hasPlate(item)" class="plate-number">{{ item.plate_number }}</span>
          <span v-else class="plate-empty">Sin placa</span>
          <button
            type="button"
            class="btn-plate-assign"
            :class="{ 'is-reassign': hasPlate(item) }"
            @click="$emit('assign-plate', item)"
          >
            {{ hasPlate(item) ? 'Reasignar' : 'Asignar placa' }}
          </button>
        </div>
      </template>

      <!-- Slot de Celda: Nombre -->
      <template #cell-name="{ item }">
        <div class="name-cell">
          <span class="full-name">{{ item.full_name }}</span>
          <span class="nickname" v-if="item.nickname">"{{ item.nickname }}"</span>
          <span v-if="item.profile_incomplete" class="incomplete-pill">Ficha incompleta</span>
          <span v-if="item.profile_link_sent_at" class="sent-pill" title="Enlace de ficha ya compartido">
            Ficha enviada
          </span>
          <span v-if="item.dossier_link_sent_at" class="sent-pill" title="Enlace Mi carrera ya compartido">
            Mi carrera enviada
          </span>
        </div>
      </template>

      <!-- Slot de Celda: Categoría -->
      <template #cell-category="{ item }">
        <span class="category-name">{{ item.category?.name || 'Sin Categoría' }}</span>
      </template>

      <!-- Slot de Celda: Club / Equipo -->
      <template #cell-club_team="{ item }">
        <span>{{ item.club_team || '—' }}</span>
      </template>

      <!-- Slot de Celda: Estado -->
      <template #cell-status="{ item }">
        <div
          class="status-badge"
          :class="getStatusStyle(item.race_status).colorClass"
          :style="{
            color: getStatusStyle(item.race_status).color,
            backgroundColor: getStatusStyle(item.race_status).bgColor
          }"
        >
          <span class="material-icons status-icon">{{ getStatusStyle(item.race_status).icon }}</span>
          <span>{{ getStatusStyle(item.race_status).label }}</span>
        </div>
      </template>

      <!-- Slot de Celda: Acciones -->
      <template #cell-actions="{ item }">
        <div class="actions-cell">
          <AppTooltip content="Ver detalles">
            <AppButton
              variant="icon-action"
              icon="visibility"
              class="btn-detail"
              @click="$emit('view-detail', item)"
              aria-label="Ver detalles"
            />
          </AppTooltip>

          <AppTooltip content="Editar piloto">
            <AppButton
              variant="icon-action"
              icon="edit"
              class="btn-edit"
              @click="$emit('edit', item)"
              aria-label="Editar piloto"
            />
          </AppTooltip>

          <AppTooltip content="Cambiar estado" align="right">
            <AppButton
              variant="icon-action"
              icon="swap_horiz"
              class="btn-status"
              @click="$emit('change-status', item)"
              aria-label="Cambiar estado"
            />
          </AppTooltip>

          <ShareLinkPopover
            title="Completar ficha"
            ariaLabel="Compartir enlace completar ficha"
            trigger-icon="link"
            :sent="!!item.profile_link_sent_at"
            :load-link="() => loadProfileLink(item)"
            @copied="$emit('link-copied', $event)"
            @sent="$emit('profile-link-sent', item)"
          />

          <ShareLinkPopover
            title="Mi carrera"
            ariaLabel="Compartir enlace Mi carrera"
            trigger-icon="folder_shared"
            :sent="!!item.dossier_link_sent_at"
            :load-link="() => loadDossierLink(item)"
            @copied="$emit('link-copied', $event)"
            @sent="$emit('dossier-link-sent', item)"
          />

          <AppTooltip content="Eliminar piloto" align="right">
            <AppButton
              variant="icon-action"
              icon="delete"
              class="btn-delete"
              @click="$emit('delete', item)"
              aria-label="Eliminar piloto"
            />
          </AppTooltip>
        </div>
      </template>

      <!-- Slot para Vista Móvil: RiderCard -->
      <template #card="{ item }">
        <RiderCard
          :rider="item"
          :load-profile-link="loadProfileLink"
          :load-dossier-link="loadDossierLink"
          @edit="$emit('edit', item)"
          @change-status="$emit('change-status', item)"
          @view-detail="$emit('view-detail', item)"
          @assign-plate="$emit('assign-plate', item)"
          @link-copied="$emit('link-copied', $event)"
          @profile-link-sent="$emit('profile-link-sent', item)"
          @dossier-link-sent="$emit('dossier-link-sent', item)"
          @delete="$emit('delete', item)"
        />
      </template>

      <!-- Mensaje cuando la lista está vacía -->
      <template #empty>
        No se encontraron competidores registrados.
      </template>
    </AppTable>
  </div>
</template>

<script setup>
import { getStatusStyle } from '../../../core/constants/riderStatusStyles';
import { storageUrl } from '../../../core/network/storageUrl';
import ShareLinkPopover from '../../../components/common/ShareLinkPopover.vue';
import RiderCard from './RiderCard.vue';

const props = defineProps({
  riders: { type: Array, required: true },
  loadProfileLink: { type: Function, required: true },
  loadDossierLink: { type: Function, required: true },
});

defineEmits(['edit', 'change-status', 'view-detail', 'delete', 'assign-plate', 'link-copied', 'profile-link-sent', 'dossier-link-sent']);

function loadProfileLink(item) {
  return props.loadProfileLink(item);
}

function loadDossierLink(item) {
  return props.loadDossierLink(item);
}

const headers = [
  { key: 'photo', label: 'Foto' },
  { key: 'plate', label: 'Placa' },
  { key: 'name', label: 'Nombre' },
  { key: 'category', label: 'Categoría' },
  { key: 'origin', label: 'Procedencia' },
  { key: 'club_team', label: 'Club / Equipo' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: 'Acciones', alignClass: 'text-right' }
];

function hasPlate(rider) {
  const p = rider?.plate_number;
  return p != null && p !== '' && Number(p) > 0;
}

function resolvePhotoUrl(path) {
  return storageUrl(path);
}

function handleImageError(e) {
  e.target.style.display = 'none';
  const parent = e.target.parentElement;
  if (parent) {
    const placeholder = document.createElement('div');
    placeholder.className = 'rider-avatar-placeholder';
    placeholder.innerText = 'X';
    parent.appendChild(placeholder);
  }
}

function getInitials(name) {
  if (!name) return 'X';
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}
</script>

<style scoped>
.riders-table-wrapper {
  margin-top: 16px;
}

.avatar-cell {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 1.5px solid var(--color-border);
  background: var(--color-background);
}

.rider-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rider-avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: var(--color-primary);
  background: rgba(255, 94, 0, 0.05);
}

.plate-number {
  font-weight: 700;
  color: var(--color-primary);
}

.plate-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.plate-empty {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.btn-plate-assign {
  appearance: none;
  border: 1px solid rgba(255, 94, 0, 0.35);
  background: rgba(255, 94, 0, 0.08);
  color: var(--color-primary);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  line-height: 1.2;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.btn-plate-assign:hover {
  background: rgba(255, 94, 0, 0.16);
  border-color: rgba(255, 94, 0, 0.55);
}

.btn-plate-assign.is-reassign {
  border-color: rgba(59, 130, 246, 0.35);
  background: rgba(59, 130, 246, 0.08);
  color: #3b82f6;
}

.btn-plate-assign.is-reassign:hover {
  background: rgba(59, 130, 246, 0.16);
  border-color: rgba(59, 130, 246, 0.55);
}

.name-cell {
  display: flex;
  flex-direction: column;
}

.full-name {
  font-weight: 600;
}

.nickname {
  font-size: 11.5px;
  color: var(--color-text-secondary);
  margin-top: 1px;
}

.incomplete-pill {
  display: inline-flex;
  margin-top: 4px;
  width: fit-content;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 999px;
  padding: 2px 8px;
}

.sent-pill {
  display: inline-flex;
  margin-top: 4px;
  width: fit-content;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #1b8a45;
  background: rgba(34, 160, 90, 0.12);
  border: 1px solid rgba(34, 160, 90, 0.35);
  border-radius: 999px;
  padding: 2px 8px;
}

.category-name {
  font-weight: 500;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 30px;
  font-size: 11.5px;
  font-weight: 600;
  border: 1px solid currentColor;
}

.status-icon {
  font-size: 14px;
  display: inline-flex;
}

.actions-cell {
  display: inline-flex;
  gap: 8px;
}

/* Hover de botón eliminar específico de la tabla */
:deep(.btn-delete:hover:not(:disabled)) {
  border-color: var(--color-error) !important;
  color: var(--color-error) !important;
  background: rgba(239, 68, 68, 0.05) !important;
}
</style>
