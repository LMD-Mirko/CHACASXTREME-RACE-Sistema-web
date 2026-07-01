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
        <span class="plate-number">{{ item.plate_number }}</span>
      </template>

      <!-- Slot de Celda: Nombre -->
      <template #cell-name="{ item }">
        <div class="name-cell">
          <span class="full-name">{{ item.full_name }}</span>
          <span class="nickname" v-if="item.nickname">"{{ item.nickname }}"</span>
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
          @edit="$emit('edit', item)"
          @change-status="$emit('change-status', item)"
          @view-detail="$emit('view-detail', item)"
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
import RiderCard from './RiderCard.vue';

defineProps({
  riders: { type: Array, required: true }
});

defineEmits(['edit', 'change-status', 'view-detail', 'delete']);

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

function resolvePhotoUrl(path) {
  if (path.startsWith('http')) return path;
  return `http://127.0.0.1:8000/storage/${path}`;
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
