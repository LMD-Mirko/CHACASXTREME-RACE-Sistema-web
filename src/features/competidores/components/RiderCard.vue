<template>
  <div class="rider-card fade-in">
    <!-- Encabezado de la tarjeta con placa y avatar -->
    <div class="card-header">
      <div class="avatar-container">
        <img
          v-if="rider.photo_url"
          :src="resolvePhotoUrl(rider.photo_url)"
          @error="handleImageError"
          alt="Foto del piloto"
          class="rider-avatar"
        />
        <div v-else class="rider-avatar-placeholder">
          {{ getInitials(rider.full_name) }}
        </div>
      </div>
      <div class="plate-badge">
        <span class="plate-label">N°</span>
        <span class="plate-value">{{ rider.plate_number }}</span>
      </div>
    </div>

    <!-- Contenido con información del competidor -->
    <div class="card-body">
      <h3 class="rider-name">{{ rider.full_name }}</h3>
      <p class="rider-nickname" v-if="rider.nickname">"{{ rider.nickname }}"</p>
      
      <div class="rider-meta">
        <div class="meta-item">
          <span class="material-icons meta-icon">flag</span>
          <span class="meta-text">{{ rider.category?.name || 'Sin Categoría' }}</span>
        </div>
        <div class="meta-item">
          <span class="material-icons meta-icon">place</span>
          <span class="meta-text">{{ rider.origin }}</span>
        </div>
      </div>
    </div>

    <!-- Footer con estado y botones de acción -->
    <div class="card-footer">
      <!-- Badge de estado de carrera tipo píldora premium con borde -->
      <div
        class="status-badge"
        :class="statusStyle.colorClass"
        :style="{ color: statusStyle.color, backgroundColor: statusStyle.bgColor }"
      >
        <span class="material-icons status-icon">{{ statusStyle.icon }}</span>
        <span class="status-label">{{ statusStyle.label }}</span>
      </div>

      <!-- Botones de acción táctiles -->
      <div class="action-buttons">
        <AppTooltip content="Ver detalles">
          <AppButton
            variant="icon-action"
            icon="visibility"
            class="btn-detail"
            @click="$emit('view-detail', rider)"
            aria-label="Ver detalles"
          />
        </AppTooltip>

        <AppTooltip content="Editar">
          <AppButton
            variant="icon-action"
            icon="edit"
            class="btn-edit"
            @click="$emit('edit', rider)"
            aria-label="Editar competidor"
          />
        </AppTooltip>

        <AppTooltip content="Cambiar estado" align="right">
          <AppButton
            variant="icon-action"
            icon="swap_horiz"
            class="btn-status"
            @click="$emit('change-status', rider)"
            aria-label="Cambiar estado del competidor"
          />
        </AppTooltip>

        <AppTooltip content="Eliminar" align="right">
          <AppButton
            variant="icon-action"
            icon="delete"
            class="btn-delete"
            @click="$emit('delete', rider)"
            aria-label="Eliminar competidor"
          />
        </AppTooltip>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getStatusStyle } from '../../../core/constants/riderStatusStyles';

const props = defineProps({
  rider: { type: Object, required: true },
});

defineEmits(['edit', 'change-status', 'view-detail', 'delete']);

const statusStyle = computed(() => getStatusStyle(props.rider.race_status));

function resolvePhotoUrl(path) {
  if (path.startsWith('http')) return path;
  return `http://127.0.0.1:8000/storage/${path}`;
}

function handleImageError(event) {
  event.target.style.display = 'none';
  const parent = event.target.parentElement;
  if (parent) {
    const placeholder = document.createElement('div');
    placeholder.className = 'rider-avatar-placeholder';
    placeholder.innerText = getInitials(props.rider.full_name);
    parent.appendChild(placeholder);
  }
}

function getInitials(name) {
  if (!name) return 'X';
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}
</script>

<style scoped>
.rider-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--shadow-premium);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.rider-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 94, 0, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.avatar-container {
  width: 48px;
  height: 48px;
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
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
  background: rgba(255, 94, 0, 0.05);
}

.plate-badge {
  background: var(--color-primary);
  color: #FFFFFF;
  padding: 4px 10px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-weight: 700;
}

.plate-label {
  font-size: 10px;
  opacity: 0.8;
}

.plate-value {
  font-size: 14px;
}

.rider-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.rider-nickname {
  font-size: 12px;
  color: var(--color-primary);
  font-style: italic;
  margin-bottom: 6px;
}

.rider-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
}

.meta-icon {
  font-size: 16px;
  display: inline-flex;
}

.meta-text {
  font-size: 12.5px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
  margin-top: 4px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 30px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid currentColor;
}

.status-icon {
  font-size: 14px;
  display: inline-flex;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

/* Hover de botón eliminar específico de la tarjeta */
:deep(.btn-delete:hover:not(:disabled)) {
  border-color: var(--color-error) !important;
  color: var(--color-error) !important;
  background: rgba(239, 68, 68, 0.05) !important;
}
</style>
